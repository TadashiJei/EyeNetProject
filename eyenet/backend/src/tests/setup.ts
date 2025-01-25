// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/eyenet-test';
process.env.PORT = '3001';

// Mock external dependencies
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  Schema: jest.fn().mockReturnValue({
    pre: jest.fn(),
    index: jest.fn()
  }),
  model: jest.fn().mockReturnValue({})
}));

// Mock WebSocket
jest.mock('ws', () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      clients: new Set(),
      close: jest.fn()
    }))
  };
});

// Mock node-routeros
jest.mock('node-routeros', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(true),
    write: jest.fn().mockResolvedValue([]),
    close: jest.fn().mockResolvedValue(true)
  }));
});
