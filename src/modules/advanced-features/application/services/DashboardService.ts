import { pool } from '../../../../shared/config/database';

export interface DashboardMetrics {
  totalIssues: number;
  issuesByType: Record<string, number>;
  issuesByImpact: Record<string, number>;
  averageResponseTime: number;
  recentEscalations: any[];
  topRecurringErrors: any[];
}

export class DashboardService {
  async getMetrics(): Promise<DashboardMetrics> {
    const [
      totalIssues,
      issuesByType,
      issuesByImpact,
      averageResponseTime,
      recentEscalations,
      topRecurringErrors
    ] = await Promise.all([
      this.getTotalIssues(),
      this.getIssuesByType(),
      this.getIssuesByImpact(),
      this.getAverageResponseTime(),
      this.getRecentEscalations(),
      this.getTopRecurringErrors()
    ]);

    return {
      totalIssues,
      issuesByType,
      issuesByImpact,
      averageResponseTime,
      recentEscalations,
      topRecurringErrors
    };
  }

  private async getTotalIssues(): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) FROM error_classifications'
    );
    return parseInt(result.rows[0].count, 10);
  }

  private async getIssuesByType(): Promise<Record<string, number>> {
    const result = await pool.query(
      'SELECT error_type, COUNT(*) as count FROM error_classifications GROUP BY error_type'
    );
    return result.rows.reduce((acc: Record<string, number>, row) => {
      acc[row.error_type] = parseInt(row.count, 10);
      return acc;
    }, {});
  }

  private async getIssuesByImpact(): Promise<Record<string, number>> {
    const result = await pool.query(
      'SELECT impact_level, COUNT(*) as count FROM error_classifications GROUP BY impact_level'
    );
    return result.rows.reduce((acc: Record<string, number>, row) => {
      acc[row.impact_level] = parseInt(row.count, 10);
      return acc;
    }, {});
  }

  private async getAverageResponseTime(): Promise<number> {
    const result = await pool.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (ah2.created_at - ah1.created_at))) as avg_time
      FROM action_history ah1
      JOIN action_history ah2 ON ah1.jira_issue_key = ah2.jira_issue_key
      WHERE ah1.action_type = 'CREATE_ISSUE'
      AND ah2.action_type = 'RESOLVE_ISSUE'
    `);
    return parseFloat(result.rows[0].avg_time || '0');
  }

  private async getRecentEscalations(): Promise<any[]> {
    const result = await pool.query(`
      SELECT ec.*, ah.created_at as escalated_at
      FROM error_classifications ec
      JOIN action_history ah ON ec.jira_issue_key = ah.jira_issue_key
      WHERE ec.impact_level IN ('HIGH', 'CRITICAL')
      AND ah.action_type = 'ESCALATE'
      ORDER BY ah.created_at DESC
      LIMIT 5
    `);
    return result.rows;
  }

  private async getTopRecurringErrors(): Promise<any[]> {
    const result = await pool.query(`
      SELECT error_type, COUNT(*) as count
      FROM error_classifications
      GROUP BY error_type
      ORDER BY count DESC
      LIMIT 5
    `);
    return result.rows;
  }
} 