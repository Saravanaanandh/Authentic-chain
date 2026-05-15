/* =====================================================
   Instagram Fake Score Engine
   --------------------------------------------------------
   Analyses an Instagram profile's metadata and returns
   a risk score (0-100), a fake probability percentage,
   a human-readable verdict, and an array of reasons.
   ===================================================== */

import type { InstagramProfileData } from "./apifyService";

export type InstagramVerdict = "REAL" | "SUSPICIOUS" | "HIGHLY FAKE";

export interface FakeScoreResult {
  riskScore: number;
  fakeProbability: number;   // 0-100 %
  verdict: InstagramVerdict;
  reasons: {
    signal: string;
    detail: string;
    weight: number;
  }[];
  tabularScore?: number;
  imageScore?: number;
  bioScore?: number;
  anomalyScore?: number;
}

// ---------- Internal Helpers ----------

/** Check for suspicious username patterns */
function hasSuspiciousUsername(username: string): boolean {
  const patterns = [
    /^[a-z]+\d{4,}$/i,           // e.g. user12345
    /^[a-z]{1,3}\d{5,}$/i,       // e.g. ab12345
    /bot/i,
    /fake/i,
    /spam/i,
    /test\d+/i,
    /^x{2,}/i,                   // xxx…
    /(.)\\1{4,}/,                 // repeated chars aaaaa
    /^\d+$/,                     // all digits
    /follow/i,
    /promo/i,
    /free/i,
  ];
  return patterns.some((p) => p.test(username));
}

/** Check for suspicious external URLs */
function hasSuspiciousLink(url: string): boolean {
  if (!url) return false;
  const suspicious = [
    /bit\.ly/i,
    /tinyurl/i,
    /linktr\.ee/i,
    /taplink/i,
    /goo\.gl/i,
    /short\.io/i,
    /cash/i,
    /money/i,
    /earn/i,
    /free/i,
  ];
  return suspicious.some((p) => p.test(url));
}

// ---------- Public API ----------

export function analyzeInstagramProfile(
  profile: InstagramProfileData
): FakeScoreResult {
  const reasons: FakeScoreResult["reasons"] = [];
  let risk = 0;

  // ---- Signal 1: Suspicious username ----
  if (hasSuspiciousUsername(profile.username)) {
    const w = 12;
    risk += w;
    reasons.push({
      signal: "Suspicious Username",
      detail: `"${profile.username}" matches known bot / spam patterns.`,
      weight: w,
    });
  }

  // ---- Signal 2: Follower / following ratio ----
  if (profile.followersCount < 50 && profile.followsCount > 500) {
    const w = 20;
    risk += w;
    reasons.push({
      signal: "Low Followers / High Following",
      detail: `Only ${profile.followersCount} followers but following ${profile.followsCount} — typical mass-follow bot behaviour.`,
      weight: w,
    });
  } else if (profile.followersCount < 20) {
    const w = 10;
    risk += w;
    reasons.push({
      signal: "Very Low Followers",
      detail: `Only ${profile.followersCount} followers — could indicate a newly-created or unused account.`,
      weight: w,
    });
  }

  // ---- Signal 3: Empty bio ----
  if (!profile.biography || profile.biography.trim().length === 0) {
    const w = 10;
    risk += w;
    reasons.push({
      signal: "Empty Bio",
      detail: "No biography provided — a common trait of fake or bot accounts.",
      weight: w,
    });
  }

  // ---- Signal 4: No profile picture ----
  if (
    !profile.profilePicUrl ||
    profile.profilePicUrl.includes("default") ||
    profile.profilePicUrl.includes("s150x150/44884218_345707102882519")
  ) {
    const w = 15;
    risk += w;
    reasons.push({
      signal: "Default / No Profile Picture",
      detail: "Using the default Instagram profile picture — strong indicator of a throwaway account.",
      weight: w,
    });
  }

  // ---- Signal 5: Zero posts ----
  if (profile.postsCount === 0) {
    const w = 15;
    risk += w;
    reasons.push({
      signal: "Zero Posts",
      detail: "Account has no posts — may be a shell account used for spam or follow-manipulation.",
      weight: w,
    });
  } else if (profile.postsCount < 3) {
    const w = 8;
    risk += w;
    reasons.push({
      signal: "Very Few Posts",
      detail: `Only ${profile.postsCount} post(s) — may be recently created or inactive.`,
      weight: w,
    });
  }

  // ---- Signal 6: Private profile ----
  if (profile.isPrivate) {
    const w = 5;
    risk += w;
    reasons.push({
      signal: "Private Account",
      detail: "Account is private — limited data available for full analysis.",
      weight: w,
    });
  }

  // ---- Signal 7: Suspicious external link ----
  if (hasSuspiciousLink(profile.externalUrl)) {
    const w = 10;
    risk += w;
    reasons.push({
      signal: "Suspicious External Link",
      detail: `External URL "${profile.externalUrl}" matches known shady link patterns.`,
      weight: w,
    });
  }

  // ---- Signal 8: Verified badge ----
  if (profile.verified) {
    // Verified users get a significant risk reduction
    risk = Math.max(0, risk - 30);
    reasons.push({
      signal: "Verified Account",
      detail: "This account has Instagram's verified badge — greatly reduces fake probability.",
      weight: -30,
    });
  }

  // ---- Signal 9: Follower-to-post ratio anomaly ----
  if (
    profile.postsCount > 0 &&
    profile.followersCount > 0 &&
    profile.followersCount / profile.postsCount < 0.5
  ) {
    const w = 8;
    risk += w;
    reasons.push({
      signal: "Low Follower-to-Post Ratio",
      detail: `Only ${(profile.followersCount / profile.postsCount).toFixed(1)} followers per post — may indicate purchased or bot-generated content.`,
      weight: w,
    });
  }

  // ---- Signal 10: Recently created account detection ----
  {
    let recentlyCreated = false;
    let detailMsg = "";

    // Check 1: Apify's joinedRecently flag or high numeric ID
    if (profile.joinedRecently) {
      recentlyCreated = true;
      detailMsg = "Account flagged as recently created based on Instagram ID analysis.";
    }

    // Check 2: Latest post is very recent but account has minimal activity
    if (!recentlyCreated && profile.latestPostDate) {
      const latestDate = new Date(profile.latestPostDate);
      const daysSincePost = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24);
      if (
        daysSincePost < 30 &&
        profile.postsCount <= 5 &&
        profile.followersCount < 100
      ) {
        recentlyCreated = true;
        detailMsg = `Latest post is only ${Math.round(daysSincePost)} day(s) old with just ${profile.postsCount} total post(s) and ${profile.followersCount} followers — strong indicator of a new account.`;
      }
    }

    // Check 3: Behavioral pattern — very few posts + low followers + high following
    // (typical of newly created fake accounts mass-following to gain visibility)
    if (
      !recentlyCreated &&
      profile.postsCount <= 3 &&
      profile.followersCount < 50 &&
      profile.followsCount > 200
    ) {
      recentlyCreated = true;
      detailMsg = `${profile.postsCount} post(s), ${profile.followersCount} followers, following ${profile.followsCount} — behavioral pattern strongly suggests a recently created fake account doing mass-follow.`;
    }

    // Check 4: Zero posts + any following activity = very likely new and suspicious
    if (
      !recentlyCreated &&
      profile.postsCount === 0 &&
      profile.followsCount > 0 &&
      profile.followersCount < 20
    ) {
      recentlyCreated = true;
      detailMsg = `Zero posts but following ${profile.followsCount} accounts — account appears newly created and not yet active.`;
    }

    if (recentlyCreated) {
      const w = 18;
      risk += w;
      reasons.push({
        signal: "Recently Created Account",
        detail: detailMsg,
        weight: w,
      });
    }
  }

  // ---- Cap risk ----
  const riskScore = Math.min(Math.max(risk, 0), 100);

  // ---- Fake probability (slightly different from risk score for nuance) ----
  const fakeProbability = Math.min(
    Math.round(riskScore * 1.1 + (reasons.length > 3 ? 5 : 0)),
    100
  );

  // ---- Verdict ----
  let verdict: InstagramVerdict;
  if (riskScore <= 25) verdict = "REAL";
  else if (riskScore <= 55) verdict = "SUSPICIOUS";
  else verdict = "HIGHLY FAKE";

  return { riskScore, fakeProbability, verdict, reasons };
}
