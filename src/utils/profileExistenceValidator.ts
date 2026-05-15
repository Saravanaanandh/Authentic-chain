export function validateProfileExists(apifyResponse: any): boolean {
  if (!apifyResponse) return false;
  
  // Check if profile ID exists
  if (!apifyResponse.id && !apifyResponse.instagramId) return false;

  // Check if username exists
  if (!apifyResponse.username) return false;

  // Additional check: maybe it's an error object
  if (apifyResponse.error) return false;

  return true;
}

export function validateUsernameFormat(input: string): boolean {
  if (!input) return false;
  // Instagram username regex: 1-30 chars, letters, numbers, periods, underscores
  const regex = /^[a-zA-Z0-9._]{1,30}$/;
  return regex.test(input);
}

export function returnValidationError(username: string) {
  return {
    success: false,
    stage: "PROFILE_VALIDATION",
    error: "Instagram profile not found",
    username,
  };
}
