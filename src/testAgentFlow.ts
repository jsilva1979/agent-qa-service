import { DatabaseService } from './shared/services/database.service';

async function simulateAgentFlow() {
  const db = new DatabaseService();
  
  console.log('--- Simulando Fluxo do Agente ---');

  try {
    // PASSO 1: Agente registra um log de um evento/problema
    console.log('\n[1/4] Agente registrando um log de problema...');
    const problemLog = await db.saveLog(
      'Erro crítico detectado no módulo de pagamentos ao processar transação ID: TXN_12345',
      { service: 'payments', severity: 'critical', transactionId: 'TXN_12345' },
      ['error', 'payments', 'critical']
    );
    console.log(`✅ Log de problema salvo: ID ${problemLog.id}`);

    // Simular que o agente continua monitorando e depois precisa de contexto
    await new Promise(resolve => setTimeout(resolve, 2000)); // Espera 2 segundos

    // PASSO 2: Agente busca logs relacionados para contextualizar uma análise
    console.log(`\n[2/4] Agente buscando logs relacionados a "pagamentos" e "erro"...`);
    const relatedLogs = await db.searchLogsByTags(['payments', 'error'], 5);
    console.log(`✅ ${relatedLogs.length} logs relacionados encontrados.`);

    let analysisContent = 'Nenhum log relacionado encontrado para análise imediata.';
    if (relatedLogs.length > 0) {
      analysisContent = 'Análise baseada nos seguintes logs:\n';
      relatedLogs.forEach(log => {
        analysisContent += `- ID: ${log.id}, Conteúdo: ${log.content.substring(0, 50)}...\n`;
      });
      analysisContent += '\nPossível causa: Falha na integração com gateway de pagamento externo. Requer investigação manual.';
    }

    // PASSO 3: Agente gera e salva uma análise baseada nas informações encontradas
    console.log('\n[3/4] Agente gerando e salvando análise...');
    const analysis = await db.saveAnalysis(
      problemLog.id,
      'root_cause_analysis',
      analysisContent,
      { analyzedBy: 'AutonomousAgent', status: 'pending_review' },
      ['analysis', 'root_cause', 'payments']
    );
    console.log(`✅ Análise salva: ID ${analysis.id}`);

    // PASSO 4: Agente verifica a análise recém-criada (ou outras análises do log)
    console.log('\n[4/4] Agente verificando análises para o log de problema...');
    const analysesForProblemLog = await db.getLogAnalyses(problemLog.id);
    console.log(`✅ Encontradas ${analysesForProblemLog.length} análises para o log ID ${problemLog.id}.`);
    if (analysesForProblemLog.length > 0) {
        console.log('   Última análise:', analysesForProblemLog[0].content.substring(0, 100) + '...');
    }

    console.log('\n--- Simulação Concluída com Sucesso! ---');

  } catch (error) {
    console.error('❌ Erro durante a simulação do fluxo do agente:', error);
  }
}

simulateAgentFlow().catch(console.error); 