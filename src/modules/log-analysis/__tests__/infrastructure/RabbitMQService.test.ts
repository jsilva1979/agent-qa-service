import amqp from 'amqplib';
import { RabbitMQService } from '../../infrastructure/rabbitmq';
import { LogEntry } from '../../domain/LogEntry';
import { setupLogging } from '../../../../shared/infrastructure/logging';

// Mock do amqplib
jest.mock('amqplib');

describe('RabbitMQService', () => {
  let rabbitMQService: RabbitMQService;
  let mockConnection: any;
  let mockChannel: any;
  let logger: any;

  beforeEach(() => {
    // Setup dos mocks
    mockConnection = {
      on: jest.fn(),
      createChannel: jest.fn(),
      close: jest.fn(),
    };

    mockChannel = {
      assertQueue: jest.fn(),
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn(),
    };

    (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);
    mockConnection.createChannel.mockResolvedValue(mockChannel);

    logger = setupLogging();
    rabbitMQService = new RabbitMQService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should establish connection and setup channel successfully', async () => {
      await rabbitMQService.initialize();

      expect(amqp.connect).toHaveBeenCalled();
      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.assertQueue).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      (amqp.connect as jest.Mock).mockRejectedValue(error);

      await expect(rabbitMQService.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('startConsuming', () => {
    it('should start consuming messages successfully', async () => {
      await rabbitMQService.initialize();
      const processMessage = jest.fn();
      await rabbitMQService.startConsuming(processMessage);

      expect(mockChannel.consume).toHaveBeenCalled();
    });

    it('should process message and acknowledge it', async () => {
      await rabbitMQService.initialize();
      const processMessage = jest.fn();
      const mockMessage = {
        content: Buffer.from(JSON.stringify({ level: 'error', message: 'test' })),
      };

      await rabbitMQService.startConsuming(processMessage);
      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      await consumeCallback(mockMessage);

      expect(processMessage).toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    it('should handle message processing errors', async () => {
      await rabbitMQService.initialize();
      const processMessage = jest.fn().mockRejectedValue(new Error('Processing failed'));
      const mockMessage = {
        content: Buffer.from(JSON.stringify({ level: 'error', message: 'test' })),
      };

      await rabbitMQService.startConsuming(processMessage);
      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      await consumeCallback(mockMessage);

      expect(mockChannel.nack).toHaveBeenCalledWith(mockMessage, false, true);
    });
  });

  describe('close', () => {
    it('should close connection and channel successfully', async () => {
      await rabbitMQService.initialize();
      await rabbitMQService.close();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });
}); 