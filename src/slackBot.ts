import { App, LogLevel } from '@slack/bolt';
import dotenv from 'dotenv';

dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN, // Seu token de bot (xoxb-)
  appToken: process.env.SLACK_APP_TOKEN, // Seu token de app (xapp-) para Socket Mode
  socketMode: true, // Habilita o Socket Mode
  logLevel: LogLevel.DEBUG, // Corrigido para usar o enum LogLevel
});

// Listener para qualquer mensagem que o bot receber
app.message(async ({ message, say }) => {
  // Apenas processa mensagens de usuários comuns (sem subtipo)
  if (message.type === 'message' && message.subtype === undefined) {
    await say(`Olá, <@${message.user}>! Você disse: ${message.text}. Como posso ajudar?`);
  }
});

(async () => {
  try {
    await app.start();
    console.log('⚡️ Agente de QA está online e ouvindo mensagens!');
  } catch (error) {
    console.error('Falha ao iniciar o Agente de QA:', error);
  }
})(); 