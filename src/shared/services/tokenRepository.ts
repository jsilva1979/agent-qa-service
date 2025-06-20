import { pool } from '../config/database';

export async function getTokens(userId: string) {
  const result = await pool.query(
    'SELECT access_token, refresh_token, expires_at, cloud_id FROM jira_tokens WHERE user_id = $1',
    [userId]
  );
  if (result.rows.length === 0) throw new Error('Tokens não encontrados para o usuário');
  return result.rows[0];
}

export async function saveTokens({ userId, accessToken, refreshToken, expiresIn, cloudId }: any) {
  const expiresAt = Date.now() + expiresIn * 1000;
  await pool.query(
    `UPDATE jira_tokens SET access_token = $1, refresh_token = $2, expires_at = $3, cloud_id = $4 WHERE user_id = $5`,
    [accessToken, refreshToken, expiresAt, cloudId, userId]
  );
} 