import { WelcomeEmail } from '../templates/welcome-email';
import { NotificationEmail } from '../templates/notification-email';

export const emails = [
  {
    name: 'Welcome Email',
    component: (
      <WelcomeEmail
        firstName="John Doe"
        projectName="My Amazing Project"
        loginUrl="https://tambo.co/login"
      />
    ),
  },
  {
    name: 'Welcome Email (Minimal)',
    component: (
      <WelcomeEmail
        firstName="Jane"
      />
    ),
  },
  {
    name: 'Notification Email',
    component: (
      <NotificationEmail
        title="New Feature Available"
        message="We're excited to announce a new feature that will help you build better applications. Check it out and let us know what you think!"
        actionUrl="https://tambo.co/features"
        actionText="View Feature"
        userName="John Doe"
      />
    ),
  },
  {
    name: 'Notification Email (Simple)',
    component: (
      <NotificationEmail
        title="Reminder"
        message="This is a simple notification message without any action buttons."
        userName="Jane Smith"
      />
    ),
  },
];