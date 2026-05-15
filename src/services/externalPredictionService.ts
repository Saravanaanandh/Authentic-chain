import axios from "axios";

export function mapApifyToPredictionInput(apifyData: any) {
  return {
    username: apifyData.username || "",
    profileData: {
      fullName: apifyData.fullName || "",
      biography: apifyData.biography || "",
      followersCount: apifyData.followersCount || 0,
      followsCount: apifyData.followsCount || 0,
      postsCount: apifyData.postsCount || 0,
      verified: !!apifyData.verified,
      profilePicUrl: apifyData.profilePicUrl || "",
      isPrivate: !!apifyData.isPrivate,
      externalUrl: apifyData.externalUrl || "",
      instagramId: apifyData.id || "",
    },
    scannedBy: "fakeid_shield",
    blockchainHash: "",
    blockchainTx: ""
  };
}

export function validateExternalResponse(response: any) {
  if (!response || typeof response !== "object") {
    throw new Error("Invalid response format from external API");
  }
  // We expect something that gives us fakeProbability, riskScore, reasons, etc.
  // Assuming the external API returns something similar to our internal one:
  // Since the user prompt mentions `external.analysis.fakeProbability`, 
  // we will ensure those fields exist or default them.
  return true;
}

export async function callExternalPredictionAPI(payload: any, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const startTime = Date.now();
      const response = await axios.post("https://fakeprofiledetection-pvdh.onrender.com/api/predict", payload, {
        timeout: 15000, // 15 seconds timeout
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      validateExternalResponse(response.data);
      
      const latency = Date.now() - startTime;
      console.log(`External API Latency: ${latency}ms`);
      
      // The external API response might directly be the analysis object or wrapped in `data`.
      // We assume it returns an object with `fakeProbability`, `riskScore`, and `reasons`.
      // Let's standardise the return so it matches internal analysis format.
      const data = response.data.analysis || response.data;
      
      return {
        success: true,
        analysis: {
          fakeProbability: data.fakeProbability || data.riskScore || 0,
          riskScore: data.riskScore || data.fakeProbability || 0,
          verdict: data.verdict || "UNKNOWN",
          reasons: Array.isArray(data.reasons) ? data.reasons : [],
        }
      };
    } catch (error: any) {
      console.error(`External Prediction API failed on attempt ${attempt + 1}:`, error.message);
      if (attempt === retries) {
        return {
          success: false,
          error: error.message,
          analysis: null
        };
      }
    }
  }
  
  return { success: false, analysis: null };
}
