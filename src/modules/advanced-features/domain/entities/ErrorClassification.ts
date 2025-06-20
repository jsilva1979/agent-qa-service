export type ImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ErrorClassificationProps {
  jiraIssueKey: string;
  errorType: string;
  impactLevel: ImpactLevel;
  recurrenceCount: number;
  aiAnalysis?: Record<string, any>;
}

export class ErrorClassification {
  private props: ErrorClassificationProps;

  constructor(props: ErrorClassificationProps) {
    this.props = {
      ...props,
      recurrenceCount: props.recurrenceCount || 1
    };
  }

  get jiraIssueKey(): string {
    return this.props.jiraIssueKey;
  }

  get errorType(): string {
    return this.props.errorType;
  }

  get impactLevel(): ImpactLevel {
    return this.props.impactLevel;
  }

  get recurrenceCount(): number {
    return this.props.recurrenceCount;
  }

  get aiAnalysis(): Record<string, any> | undefined {
    return this.props.aiAnalysis;
  }

  incrementRecurrence(): void {
    this.props.recurrenceCount += 1;
  }

  updateAIAnalysis(analysis: Record<string, any>): void {
    this.props.aiAnalysis = analysis;
  }

  toJSON(): ErrorClassificationProps {
    return {
      ...this.props
    };
  }
} 