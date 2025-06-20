import { pool } from '../shared/config/database';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  // Substitua pelos valores reais
  const userId = 'U08UDKL99AT'; // ID do usuário do Slack
  const accessToken = 'SEU_ACCESS_TOKEN_AQUI';
  const refreshToken = 'SEU_REFRESH_TOKEN_AQUI';
  const expiresAt = Date.now() + 3600 * 1000; // 1 hora a partir de agora (exemplo)
  const cloudId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

  // Upsert: tenta atualizar, se não existir, insere
  const result = await pool.query(
    `INSERT INTO jira_tokens (user_id, access_token, refresh_token, expires_at, cloud_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       access_token = EXCLUDED.access_token,
       refresh_token = EXCLUDED.refresh_token,
       expires_at = EXCLUDED.expires_at,
       cloud_id = EXCLUDED.cloud_id
     RETURNING *`,
    [userId, accessToken, refreshToken, expiresAt, cloudId]
  );

  console.log('Registro de token salvo/atualizado:', result.rows[0]);
}

main().catch(console.error); 