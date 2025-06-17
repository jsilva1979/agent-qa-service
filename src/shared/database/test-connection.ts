import { pool } from '../config/database';
import { DatabaseService } from '../services/database.service';

async function testDatabaseConnection() {
  const db = new DatabaseService();
  
  try {
    console.log('🔄 Testando conexão com o banco de dados...');
    
    // Teste 1: Conexão básica
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Teste 2: Inserir um log
    console.log('\n🔄 Testando inserção de log...');
    const log = await db.saveLog(
      'Teste de conexão com o banco',
      { source: 'test', type: 'connection_test' },
      ['test', 'database', 'connection']
    );
    console.log('✅ Log inserido com sucesso:', log.id);
    
    // Teste 3: Inserir uma análise
    console.log('\n🔄 Testando inserção de análise...');
    const analysis = await db.saveAnalysis(
      log.id,
      'connection_test',
      'Análise do teste de conexão',
      { status: 'success' },
      ['test', 'analysis']
    );
    console.log('✅ Análise inserida com sucesso:', analysis.id);
    
    // Teste 4: Buscar logs por tags
    console.log('\n🔄 Testando busca por tags...');
    const logsByTags = await db.searchLogsByTags(['test']);
    console.log('✅ Logs encontrados:', logsByTags.length);
    
    // Teste 5: Buscar análises do log
    console.log('\n🔄 Testando busca de análises...');
    const analyses = await db.getLogAnalyses(log.id);
    console.log('✅ Análises encontradas:', analyses.length);
    
    // Teste 6: Buscar logs por período
    console.log('\n🔄 Testando busca por período...');
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // últimas 24 horas
    const endDate = new Date();
    const logsByDate = await db.getLogsByDateRange(startDate, endDate);
    console.log('✅ Logs encontrados no período:', logsByDate.length);
    
    console.log('\n✨ Todos os testes concluídos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  } finally {
    await pool.end();
  }
}

// Executa os testes se este arquivo for executado diretamente
if (require.main === module) {
  testDatabaseConnection().catch(console.error);
} 