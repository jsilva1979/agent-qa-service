export interface AnalyzeError {
  rootCause: string;
  missingChecks: string[];
  correctionSuggestion: string;
  explanation: string;
  confidenceLevel: number; // 0-100
}
