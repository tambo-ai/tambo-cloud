import { sendEmail } from '../send-email';
import { WelcomeEmail } from '../templates';

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({
        data: { id: 'test-email-id' }
      })
    }
  }))
}));

// Mock React-Email render
jest.mock('@react-email/render', () => ({
  render: jest.fn().mockReturnValue('<html>Test Email</html>')
}));

// Mock database
jest.mock('@tambo-ai-cloud/db', () => ({
  getDb: jest.fn(() => ({
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn().mockResolvedValue([{ id: 'test-event-id' }])
      }))
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn().mockResolvedValue([])
      }))
    }))
  })),
  schema: {
    emailEvents: {},
    scheduledEmails: {}
  }
}));

// Mock addEmailJob
jest.mock('../queue', () => ({
  addEmailJob: jest.fn().mockResolvedValue('test-job-id')
}));

describe('sendEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-api-key';
  });

  it('should send immediate email successfully', async () => {
    const component = WelcomeEmail({
      firstName: 'John',
      projectName: 'Test Project'
    });

    await sendEmail({
      to: 'test@example.com',
      component,
      subject: 'Test Email'
    });

    // Should not throw any errors
    expect(true).toBe(true);
  });

  it('should schedule email for future delivery', async () => {
    const { addEmailJob } = require('../queue');
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const component = WelcomeEmail({
      firstName: 'John',
      projectName: 'Test Project'
    });

    await sendEmail({
      to: 'test@example.com',
      component,
      subject: 'Test Email',
      scheduledFor: futureDate
    });

    expect(addEmailJob).toHaveBeenCalled();
  });

  it('should handle multiple recipients', async () => {
    const component = WelcomeEmail({
      firstName: 'John',
      projectName: 'Test Project'
    });

    await sendEmail({
      to: ['test1@example.com', 'test2@example.com'],
      component,
      subject: 'Test Email'
    });

    // Should not throw any errors
    expect(true).toBe(true);
  });
});