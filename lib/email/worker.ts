import { initializeEmailQueue, stopEmailQueue } from './queue';

class EmailWorker {
  private initialized = false;

  async start(): Promise<void> {
    if (this.initialized) {
      console.log('Email worker already initialized');
      return;
    }

    try {
      await initializeEmailQueue();
      this.initialized = true;
      console.log('Email worker started successfully');
    } catch (error) {
      console.error('Failed to start email worker:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      await stopEmailQueue();
      this.initialized = false;
      console.log('Email worker stopped successfully');
    } catch (error) {
      console.error('Failed to stop email worker:', error);
    }
  }

  isRunning(): boolean {
    return this.initialized;
  }
}

// Singleton instance
export const emailWorker = new EmailWorker();

// Auto-start the worker in production
if (process.env.NODE_ENV === 'production') {
  emailWorker.start().catch(console.error);
}

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, stopping email worker...');
  await emailWorker.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, stopping email worker...');
  await emailWorker.stop();
  process.exit(0);
});