/* =====================================================
   Core Verification Engine
   --------------------------------------------------------
   Multi-layer fake-profile detection:
     1. SHA-256 data hash
     2. Rule-based risk scoring
     3. Image hash generation + duplicate detection
     4. Database comparison (username / image duplicates)
     5. Risk score aggregation & classification
   ===================================================== */

import {
  ProfileInput,
  VerificationReason,
  ProfileStatus,
  ImageComparisonResult,
} from "./types";
import { findProfilesByImageHash, getProfileByUsername } from "./store";

// ---------- Helpers ----------

/** Simple SHA-256 hex hash (works in Node.js runtime) */
async function sha256(text: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** Parse a human-readable account age string into approximate days */
function parseAccountAgeDays(raw: string): number {
  const lower = raw.trim().toLowerCase();
  const num = parseFloat(lower) || 0;
  if (lower.includes("year")) return num * 365;
  if (lower.includes("month")) return num * 30;
  if (lower.includes("week")) return num * 7;
  if (lower.includes("hour")) return num / 24;
  return num; // default: treat as days
}

/** Check for suspicious username patterns */
function isSuspiciousUsername(username: string): boolean {
  const patterns = [
    /^[a-z]+\d{4,}$/i,           // e.g. user12345
    /^[a-z]{1,3}\d{5,}$/i,       // e.g. ab12345
    /bot/i,
    /fake/i,
    /spam/i,
    /test\d+/i,
    /^x{2,}/i,                   // xxx...
    /(.)\\1{4,}/,                 // repeated chars aaaaa
    /^\d+$/,                     // all digits
  ];
  return patterns.some((p) => p.test(username));
}

// ---------- Public API ----------

export async function generateDataHash(input: ProfileInput): Promise<string> {
  const blob = JSON.stringify({
    username: input.username,
    followers: input.followers,
    posts: input.posts,
    accountAge: input.accountAge,
    bio: input.bio,
  });
  return sha256(blob);
}

export async function generateImageHash(
  base64OrUrl: string | undefined
): Promise<string> {
  if (!base64OrUrl) return "";
  // Strip data-URL prefix if present, then hash the raw payload
  const payload = base64OrUrl.replace(/^data:[^;]+;base64,/, "");
  return sha256(payload);
}

export async function compareImages(imageHash: string): Promise<ImageComparisonResult> {
  if (!imageHash) return { duplicate: false, matchedProfiles: [] };
  const matches = await findProfilesByImageHash(imageHash);
  return {
    duplicate: matches.length > 0,
    matchedProfiles: matches,
  };
}

export interface VerificationOutput {
  riskScore: number;
  status: ProfileStatus;
  reasons: VerificationReason[];
  dataHash: string;
  imageHash: string;
  imageComparison: ImageComparisonResult;
}

export async function verifyProfile(
  input: ProfileInput
): Promise<VerificationOutput> {
  const reasons: VerificationReason[] = [];
  let risk = 0;

  // 1. Data hash
  const dataHash = await generateDataHash(input);

  // 2. Rule-based detection
  if (input.followers < 10) {
    risk += 20;
    reasons.push({
      rule: "Low Followers",
      detail: `Only ${input.followers} followers detected — typical of bot or newly-created fake accounts.`,
      riskAdded: 20,
    });
  }

  if (input.posts > 100) {
    risk += 20;
    reasons.push({
      rule: "Excessive Posts",
      detail: `${input.posts} posts is unusually high relative to other signals — possible automated posting.`,
      riskAdded: 20,
    });
  }

  const ageDays = parseAccountAgeDays(input.accountAge);
  if (ageDays < 7) {
    risk += 20;
    reasons.push({
      rule: "New Account",
      detail: `Account age ~${ageDays.toFixed(0)} day(s) — accounts under 7 days are high-risk.`,
      riskAdded: 20,
    });
  }

  if (!input.bio || input.bio.trim().length === 0) {
    risk += 10;
    reasons.push({
      rule: "Empty Bio",
      detail: "No bio/description provided — common trait of fake profiles.",
      riskAdded: 10,
    });
  }

  if (isSuspiciousUsername(input.username)) {
    risk += 10;
    reasons.push({
      rule: "Suspicious Username",
      detail: `"${input.username}" matches known suspicious patterns (bot, sequential digits, etc.).`,
      riskAdded: 10,
    });
  }

  // 3. Image processing
  const imageHash = await generateImageHash(input.profileImage);
  const imageComparison = await compareImages(imageHash);

  if (imageComparison.duplicate) {
    risk += 30;
    reasons.push({
      rule: "Duplicate Image",
      detail: `Profile image matches ${imageComparison.matchedProfiles.length} existing profile(s) — possible impersonation.`,
      riskAdded: 30,
    });
  }

  // 4. Database comparison — username duplication (now async)
  const existingUser = await getProfileByUsername(input.username);
  if (existingUser) {
    risk += 15;
    reasons.push({
      rule: "Duplicate Username",
      detail: `Username "${input.username}" already exists in the database — potential impersonation.`,
      riskAdded: 15,
    });
  }

  // 5. Cap at 100
  const riskScore = Math.min(risk, 100);

  // 6. Classification
  let status: ProfileStatus;
  if (riskScore <= 30) status = "REAL";
  else if (riskScore <= 60) status = "SUSPICIOUS";
  else status = "FAKE";

  return { riskScore, status, reasons, dataHash, imageHash, imageComparison };
}
