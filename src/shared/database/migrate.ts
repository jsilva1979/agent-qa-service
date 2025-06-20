import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  try {
    // Lê todos os arquivos de migração
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Garante ordem alfabética (001_, 002_, etc)

    // Executa cada migração em ordem
    for (const file of migrationFiles) {
      console.log(`Executando migração: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      await pool.query(migrationSQL);
      console.log(`✅ Migração ${file} executada com sucesso!`);
    }

    console.log('\n🎉 Todas as migrações foram executadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executa as migrações se este arquivo for executado diretamente
if (require.main === module) {
  runMigrations().catch(console.error);
} 