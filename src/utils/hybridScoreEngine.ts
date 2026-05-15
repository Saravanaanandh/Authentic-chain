export function calculateHybridScore(externalAnalysis: any, internalAnalysis: any) {
  // If external is unavailable
  if (!externalAnalysis || externalAnalysis.unavailable) {
    return {
      finalFakeProbability: internalAnalysis.fakeProbability,
      finalRiskScore: internalAnalysis.riskScore,
      finalVerdict: internalAnalysis.verdict,
      combinedReasons: internalAnalysis.reasons || [],
      weights: {
        external: 0,
        internal: 100
      },
      externalUnavailable: true
    };
  }

  // If internal is unavailable
  if (!internalAnalysis) {
    return {
      finalFakeProbability: externalAnalysis.fakeProbability,
      finalRiskScore: externalAnalysis.riskScore,
      finalVerdict: externalAnalysis.verdict,
      combinedReasons: externalAnalysis.reasons || [],
      weights: {
        external: 100,
        internal: 0
      }
    };
  }

  const externalFakeProb = externalAnalysis.fakeProbability || 0;
  const internalFakeProb = internalAnalysis.fakeProbability || 0;

  const externalRisk = externalAnalysis.riskScore || 0;
  const internalRisk = internalAnalysis.riskScore || 0;

  const finalFakeProbability = (externalFakeProb * 0.70) + (internalFakeProb * 0.30);
  const finalRiskScore = (externalRisk * 0.70) + (internalRisk * 0.30);
  
  let verdict = "REAL";
  if (finalFakeProbability >= 75) {
    verdict = "HIGHLY FAKE";
  } else if (finalFakeProbability >= 50 && finalFakeProbability < 75) {
    verdict = "SUSPICIOUS";
  }

  // Reason merging - removing duplicates based on signal
  const combinedReasonsMap = new Map();
  
  const allReasons = [
    ...(externalAnalysis.reasons || []),
    ...(internalAnalysis.reasons || [])
  ];
  
  allReasons.forEach((reason: any) => {
    if (reason && reason.signal) {
      if (!combinedReasonsMap.has(reason.signal)) {
         combinedReasonsMap.set(reason.signal, reason);
      }
    }
  });
  
  const combinedReasons = Array.from(combinedReasonsMap.values());

  return {
    finalFakeProbability: Math.round(finalFakeProbability),
    finalRiskScore: Math.round(finalRiskScore),
    finalVerdict: verdict,
    combinedReasons,
    weights: {
      external: 70,
      internal: 30
    }
  };
}
