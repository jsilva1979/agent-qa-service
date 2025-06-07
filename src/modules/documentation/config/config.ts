export const config = {
  confluence: {
    baseUrl: process.env.CONFLUENCE_BASE_URL || 'https://your-domain.atlassian.net',
    username: process.env.CONFLUENCE_USERNAME || '',
    apiToken: process.env.CONFLUENCE_API_TOKEN || '',
    spaceKey: process.env.CONFLUENCE_SPACE_KEY || '',
    parentPageId: process.env.CONFLUENCE_PARENT_PAGE_ID || '',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: {
      path: 'logs/documentation.log',
    },
  },
  retry: {
    maxAttempts: 3,
    delay: 1000, // 1 segundo
  },
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000, // 1 minuto
  },
}; 