/* =====================================================
   Apify Instagram Scraper Service
   --------------------------------------------------------
   Triggers the Apify Instagram Scraper actor, waits for
   the dataset output, and returns normalised profile data.
   ===================================================== */

export interface InstagramProfileData {
  username: string;
  fullName: string;
  biography: string;
  followersCount: number;
  followsCount: number;
  postsCount: number;
  verified: boolean;
  profilePicUrl: string;
  isPrivate: boolean;
  externalUrl: string;
  id: string;
  /** ISO date string of the latest post (if available) */
  latestPostDate: string;
  /** Estimated account age category based on heuristics */
  joinedRecently: boolean;
}

const APIFY_BASE = "https://api.apify.com/v2";

/**
 * Fetches public Instagram profile data via the Apify actor.
 *
 * Flow:
 *  1. Start the actor run synchronously (POST /acts/.../runs?waitForFinish=120)
 *  2. Read the default dataset items from the finished run
 *  3. Normalise and return the first matching profile
 */
export async function fetchInstagramProfile(
  username: string
): Promise<InstagramProfileData> {
  const token = process.env.APIFY_API_TOKEN;
  const actorId = process.env.INSTAGRAM_SCRAPER_ACTOR_ID || "apify/instagram-scraper";

  if (!token) {
    throw new Error("APIFY_API_TOKEN is not configured");
  }

  // ---- 1. Start a synchronous actor run ----
  const runUrl = `${APIFY_BASE}/acts/${encodeURIComponent(actorId)}/runs?token=${token}&waitForFinish=120`;

  const runRes = await fetch(runUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directUrls: [`https://www.instagram.com/${username}/`],
      resultsType: "details",
      resultsLimit: 1,
      searchType: "user",
      searchLimit: 1,
    }),
  });

  if (!runRes.ok) {
    const errText = await runRes.text();
    if (runRes.status === 402) {
      throw new Error("API quota exceeded — please try again later.");
    }
    throw new Error(`Apify actor run failed (${runRes.status}): ${errText}`);
  }

  const runData = await runRes.json();
  const datasetId = runData?.data?.defaultDatasetId;

  if (!datasetId) {
    throw new Error("Apify run did not return a dataset ID.");
  }

  // ---- 2. Fetch dataset items ----
  const dataUrl = `${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&format=json&clean=true`;
  const dataRes = await fetch(dataUrl);

  if (!dataRes.ok) {
    throw new Error(`Failed to fetch dataset (${dataRes.status})`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = await dataRes.json();

  if (!items || items.length === 0) {
    throw new Error("Profile not found — the username may be invalid or the account is private.");
  }

  const raw = items[0];

  // ---- 3. Extract latest post date if available ----
  let latestPostDate = "";
  try {
    const posts = raw.latestPosts || raw.edge_owner_to_timeline_media?.edges || [];
    if (posts.length > 0) {
      const firstPost = posts[0];
      const ts = firstPost.timestamp || firstPost.taken_at_timestamp ||
        firstPost.node?.taken_at_timestamp || 0;
      if (ts > 0) {
        latestPostDate = new Date(ts * 1000).toISOString();
      } else if (firstPost.taken_at || firstPost.date) {
        latestPostDate = new Date(firstPost.taken_at || firstPost.date).toISOString();
      }
    }
  } catch {
    // Silently ignore date parsing failures
  }

  // ---- 4. Estimate if account was recently created ----
  // Instagram user IDs are sequential — IDs above ~60 billion are post-2023
  const numericId = parseInt(raw.id || raw.pk || "0", 10);
  const joinedRecently = raw.joinedRecently ?? raw.is_new ?? (
    numericId > 60_000_000_000 // IDs above 60B are very new accounts
  );

  // ---- 5. Normalise output ----
  return {
    username: raw.username || username,
    fullName: raw.fullName || raw.full_name || "",
    biography: raw.biography || raw.bio || "",
    followersCount: raw.followersCount ?? raw.followers ?? 0,
    followsCount: raw.followsCount ?? raw.follows ?? raw.following ?? 0,
    postsCount: raw.postsCount ?? raw.posts ?? raw.mediaCount ?? 0,
    verified: raw.verified ?? false,
    profilePicUrl: raw.profilePicUrl || raw.profilePicUrlHD || raw.profile_pic_url || "",
    isPrivate: raw.private ?? raw.isPrivate ?? false,
    externalUrl: raw.externalUrl || raw.external_url || "",
    id: raw.id || raw.pk || "",
    latestPostDate,
    joinedRecently,
  };
}
