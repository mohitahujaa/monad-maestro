export function validateProof(
  proofType: string,
  proof: string,
  output: string
): { valid: boolean; reason: string } {
  switch (proofType) {
    case "github_commit":
      if (proof.includes("github.com") || proof.startsWith("https://"))
        return { valid: true, reason: "Valid GitHub reference" };
      return { valid: false, reason: "Proof must be a GitHub URL" };

    case "file_artifact":
      if (output.length > 100)
        return { valid: true, reason: "File artifact present" };
      return {
        valid: false,
        reason: "Output too short to be a valid artifact",
      };

    case "api_endpoint":
      if (proof.startsWith("http"))
        return { valid: true, reason: "Valid API endpoint" };
      return { valid: false, reason: "Proof must be an HTTP URL" };

    case "text_report":
      if (output.length > 200 && output.includes("\n"))
        return { valid: true, reason: "Valid text report" };
      return {
        valid: false,
        reason: "Report too short or missing structure",
      };

    default:
      return { valid: false, reason: "Unknown proof type" };
  }
}
