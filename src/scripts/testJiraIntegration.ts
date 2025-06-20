import { createIssueForUser } from '../shared/services/jiraIntegrationExample';

async function main() {
  try {
    // Substitua pelo user_id que você usou ao salvar os tokens
    const userId = 'U0902Q1ELP2';
    const projectKey = 'CQ'; // Chave do seu projeto Jira
    const summary = 'Teste automático de integração';
    const description = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Issue criada via script de teste do agente QA.'
            }
          ]
        }
      ]
    };
    const issueType = '[System] Incident'; // Tipo válido do projeto

    const issue = await createIssueForUser(userId, projectKey, summary, description, issueType);
    console.log('✅ Issue criada com sucesso:', issue);
  } catch (error) {
    console.error('Erro ao criar issue:', error);
  }
}

main(); 