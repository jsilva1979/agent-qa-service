export const config = {
  github: {
    token: process.env.GITHUB_TOKEN,
    apiUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      file: {
        enabled: process.env.GITHUB_LOG_FILE_ENABLED === 'true',
        path: process.env.GITHUB_LOG_FILE_PATH || 'logs/github.log'
      }
    }
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
}; 