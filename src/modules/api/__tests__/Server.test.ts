import { Server } from '../server';
import { IGitHubRepository } from '../../github-access/domain/ports/IGitHubRepository';
import { IAIService } from '../../ai-prompting/domain/ports/IAIService';
import { IAlertService } from '../../alerting/domain/ports/IAlertService';
import { IDocumentationService } from '../../documentation/domain/ports/IDocumentationService';
import express from 'express';

jest.mock('express', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    use: jest.fn(),
    listen: jest.fn((port, callback) => {
      callback();
      return { close: jest.fn() };
    }),
  })),
}));

describe('Server', () => {
  let server: Server;
  let mockGitHubRepository: jest.Mocked<IGitHubRepository>;
  let mockAIService: jest.Mocked<IAIService>;
  let mockAlertService: jest.Mocked<IAlertService>;
  let mockDocumentationService: jest.Mocked<IDocumentationService>;

  beforeEach(() => {
    mockGitHubRepository = {
      getFileContent: jest.fn(),
      getRepositoryInfo: jest.fn(),
    } as any;

    mockAIService = {
      analyzeError: jest.fn(),
      checkAvailability: jest.fn(),
    } as any;

    mockAlertService = {
      sendAlert: jest.fn(),
      checkAvailability: jest.fn(),
    } as any;

    mockDocumentationService = {
      createDocument: jest.fn(),
      findDocument: jest.fn(),
    } as any;

    server = new Server(
      3000,
      mockGitHubRepository,
      mockAIService,
      mockAlertService,
      mockDocumentationService
    );
  });

  it('should start the server on the specified port', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    server.start();
    expect(consoleSpy).toHaveBeenCalledWith('Servidor rodando na porta 3000');
  });
}); 