import axios from 'axios';

export async function refreshAccessToken(refreshToken: string) {
  const clientId = process.env.JIRA_CLIENT_ID!;
  const clientSecret = process.env.JIRA_CLIENT_SECRET!;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await axios.post(
    'https://auth.atlassian.com/oauth/token',
    {
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    },
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresIn: response.data.expires_in,
    obtainedAt: Date.now(),
  };
} 