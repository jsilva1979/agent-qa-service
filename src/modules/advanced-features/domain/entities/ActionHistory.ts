export interface ActionHistoryProps {
  userId: string;
  actionType: string;
  jiraIssueKey?: string;
  analysisResult?: Record<string, any>;
}

export class ActionHistory {
  private props: ActionHistoryProps;

  constructor(props: ActionHistoryProps) {
    this.props = props;
  }

  get userId(): string {
    return this.props.userId;
  }

  get actionType(): string {
    return this.props.actionType;
  }

  get jiraIssueKey(): string | undefined {
    return this.props.jiraIssueKey;
  }

  get analysisResult(): Record<string, any> | undefined {
    return this.props.analysisResult;
  }

  toJSON(): ActionHistoryProps {
    return {
      ...this.props
    };
  }
} 