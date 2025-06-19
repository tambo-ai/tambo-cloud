import { ReactElement } from 'react';

export interface EmailTemplateProps {
  [key: string]: any;
}

export interface SendEmailOptions {
  to: string | string[];
  component: ReactElement;
  props?: EmailTemplateProps;
  subject?: string;
  from?: string;
  scheduledFor?: Date;
}

export interface EmailJobData {
  to: string;
  from: string;
  subject: string;
  templateName: string;
  templateProps: Record<string, unknown>;
  scheduledEmailId?: string;
}

export type EmailStatus = 'pending' | 'sent' | 'failed' | 'delivered' | 'bounced' | 'complained';

export interface EmailEvent {
  id: string;
  to: string;
  from: string;
  subject: string;
  templateName?: string;
  templateProps?: Record<string, unknown>;
  status: EmailStatus;
  resendId?: string;
  error?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledEmail {
  id: string;
  to: string;
  from: string;
  subject: string;
  templateName: string;
  templateProps?: Record<string, unknown>;
  scheduledFor: Date;
  processed: boolean;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}