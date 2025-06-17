import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  try {
    // Lê o arquivo de migração
    const migrationPath = path.join(__dirname, 'migrations', '001_create_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Executa a migração
    await pool.query(migrationSQL);
    console.log('Migrações executadas com sucesso!');
  } catch (error) {
    console.error('Erro ao executar migrações:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executa as migrações se este arquivo for executado diretamente
if (require.main === module) {
  runMigrations().catch(console.error);
} 