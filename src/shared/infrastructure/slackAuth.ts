import { WebClient } from '@slack/web-api';
import winston from 'winston';
import axios from 'axios';

export class SlackAuthService {
  private client: WebClient;
  private accessToken: string;
  private refreshToken: string;
  private tokenExpiration: Date;
  private readonly logger: winston.Logger;

  constructor(
    accessToken: string,
    refreshToken: string,
    logging: {
      level: string;
      file: {
        path: string;
      };
    }
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiration = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 horas
    this.client = new WebClient(this.accessToken);

    this.logger = winston.createLogger({
      level: logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: logging.file.path,
          level: 'error',
        }),
      ],
    });
  }

  async getClient(): Promise<WebClient> {
    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
    return this.client;
  }

  private isTokenExpired(): boolean {
    // Adiciona uma margem de segurança de 5 minutos
    const safetyMargin = 5 * 60 * 1000; // 5 minutos em milissegundos
    return Date.now() + safetyMargin >= this.tokenExpiration.getTime();
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      this.logger.info('Iniciando refresh do token do Slack');
      
      // Faz a requisição para a API do Slack para refresh do token
      const response = await axios.post('https://slack.com/api/auth.refresh', {
        refresh_token: this.refreshToken
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.ok) {
        throw new Error(`Falha ao refresh do token: ${response.data.error}`);
      }

      // Atualiza o token e a data de expiração
      this.accessToken = response.data.access_token;
      this.tokenExpiration = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 horas
      this.client = new WebClient(this.accessToken);

      this.logger.info('Token do Slack atualizado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao refresh do token do Slack:', error);
      throw new Error(`Erro ao refresh do token do Slack: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
} 