/* =====================================================
   Instagram Input Parser
   --------------------------------------------------------
   Extracts a clean Instagram username from various input
   formats: URL, @handle, or plain username.
   ===================================================== */

/**
 * Supported input formats:
 *  - https://instagram.com/username
 *  - https://www.instagram.com/username/
 *  - http://instagram.com/username?hl=en
 *  - instagram.com/username
 *  - @username
 *  - username
 */
export function extractUsername(input: string): string | null {
  if (!input || typeof input !== "string") return null;

  let cleaned = input.trim();

  // 1. Handle Instagram URLs
  const urlPattern =
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)\/?/i;
  const urlMatch = cleaned.match(urlPattern);
  if (urlMatch) {
    const candidate = urlMatch[1].toLowerCase();
    // Filter out non-profile paths
    const reserved = [
      "p", "reel", "reels", "explore", "accounts",
      "stories", "direct", "tv", "about", "developer",
    ];
    if (reserved.includes(candidate)) return null;
    return candidate;
  }

  // 2. Handle @username
  if (cleaned.startsWith("@")) {
    cleaned = cleaned.slice(1);
  }

  // 3. Validate as a plain username (Instagram rules: 1-30 chars, alphanumeric + . + _)
  const usernamePattern = /^[a-zA-Z0-9._]{1,30}$/;
  if (usernamePattern.test(cleaned)) {
    return cleaned.toLowerCase();
  }

  return null;
}

/**
 * Returns true if the raw input looks like an Instagram URL.
 */
export function isInstagramUrl(input: string): boolean {
  return /(?:https?:\/\/)?(?:www\.)?instagram\.com\//i.test(input.trim());
}

/**
 * Validates that the extracted username is plausible.
 */
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9._]{1,30}$/.test(username);
}
