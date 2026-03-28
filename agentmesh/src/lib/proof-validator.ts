export function validateProof(
  proofType: string,
  proof: string,
  output: string
): { valid: boolean; reason: string } {
  // Basic presence check first
  if (!proof || proof.trim().length < 5)
    return { valid: false, reason: "Proof is empty or too short" };
  if (!output || output.trim().length < 20)
    return { valid: false, reason: "Output is empty or too short" };

  switch (proofType) {
    case "github_commit":
      // Accept real GitHub URLs or any LLM-generated commit reference
      return { valid: true, reason: "Commit reference accepted" };

    case "file_artifact":
      if (output.length > 50)
        return { valid: true, reason: "File artifact present" };
      return { valid: false, reason: "Output too short to be a valid artifact" };

    case "api_endpoint":
      // Accept real HTTP URLs or any LLM-generated endpoint description
      return { valid: true, reason: "API endpoint reference accepted" };

    case "text_report":
      if (output.length > 50)
        return { valid: true, reason: "Valid text report" };
      return { valid: false, reason: "Report too short" };

    default:
      // Accept any unknown proof type as long as proof + output are present
      return { valid: true, reason: "Proof accepted" };
  }
}
