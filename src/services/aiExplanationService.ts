import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AIExplanationInput {
  prediction: string;
  followers: number;
  following: number;
  posts: number;
  bio: string;
  hasProfilePic: boolean;
  riskScore: number;
  reasons: { signal: string; detail: string; weight: number }[];
}

export interface AIExplanationOutput {
  explanation: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  suggestions: string[];
}

/**
 * Reusable AI service that leverages Google Gemini API to analyze prediction metrics
 * and return structured explanation text, risk level, and actionable recommendations.
 */
export async function explainPrediction(
  input: AIExplanationInput
): Promise<AIExplanationOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️  GEMINI_API_KEY is not defined in environment variables. Falling back to default explanation.");
    return {
      explanation: "AI explanation is currently unavailable because the GEMINI_API_KEY environment variable is not configured in the server environment.",
      riskLevel: input.riskScore > 60 ? "HIGH" : input.riskScore > 30 ? "MEDIUM" : "LOW",
      suggestions: [
        "Ensure GEMINI_API_KEY is configured inside your server's .env.local file.",
        "Manually review the specific risk triggers highlighted in the risk reasons panel."
      ]
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash for structured JSON response output
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const reasonsText = input.reasons
      .map((r) => `- **${r.signal}** (${r.weight > 0 ? "+" : ""}${r.weight} risk): ${r.detail}`)
      .join("\n");

    const prompt = `
You are an expert Social Media Security Analyst and Fraud Detection AI.
Explain the decision of our machine learning classification system for the following Instagram profile:

### Profile Details:
- **Followers**: ${input.followers}
- **Following**: ${input.following}
- **Posts**: ${input.posts}
- **Bio**: "${input.bio || "(None)"}"
- **Has Profile Pic**: ${input.hasProfilePic ? "Yes" : "No"}
- **Risk Score**: ${input.riskScore}/100
- **Prediction Verdict**: ${input.prediction}
- **Suspicious Risk Signals Triggered**:
${reasonsText || "No flags triggered."}

### Task:
Produce a JSON object matching this structure:
{
  "explanation": "A concise and professional explanation (around 150-200 words) describing why this profile was classified as ${input.prediction}. Explain how the followers/following, posts, and reasons justify this rating. Use basic Markdown for bold text and list items. Do not use headings (h1, h2, h3) or title text.",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "suggestions": [
    "A list of 3-4 actionable security recommendations for users interacting with this profile (e.g. check for duplicate photos, verify offline, avoid sharing sensitive details, etc.)"
  ]
}

Ensure your response is valid, parsable JSON and fits the schema definition.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    const data = JSON.parse(responseText);

    return {
      explanation: data.explanation || "No explanation generated.",
      riskLevel: data.riskLevel || (input.riskScore > 60 ? "HIGH" : input.riskScore > 30 ? "MEDIUM" : "LOW"),
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : ["Verify the profile through other reliable methods."]
    };
  } catch (error: any) {
    console.error("❌ Gemini API explainPrediction error:", error);
    return {
      explanation: `AI prediction explanation generation failed: ${error.message || error}`,
      riskLevel: input.riskScore > 60 ? "HIGH" : input.riskScore > 30 ? "MEDIUM" : "LOW",
      suggestions: ["Check your browser console or server log files for diagnostic details."]
    };
  }
}
