import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  slack: {
    accessToken: process.env.SLACK_ACCESS_TOKEN,
    refreshToken: process.env.SLACK_REFRESH_TOKEN,
    channel: process.env.SLACK_CHANNEL || '#alerts',
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      file: {
        path: path.join(process.cwd(), 'logs', 'slack-alerts.log'),
      },
    },
  },
  jira: {
    url: process.env.JIRA_URL,
    email: process.env.JIRA_EMAIL,
    apiToken: process.env.JIRA_API_TOKEN,
    project: process.env.JIRA_PROJECT,
  },
  retry: {
    maxAttempts: 3,
    delay: 1000, // ms
  },
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000, // 1 minuto
  },
}; 