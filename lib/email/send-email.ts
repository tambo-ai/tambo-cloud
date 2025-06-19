import { Resend } from 'resend';
import { render } from '@react-email/render';
import { ReactElement } from 'react';
import { getDb, schema } from '@tambo-ai-cloud/db';
import { eq } from 'drizzle-orm';
import { SendEmailOptions, EmailJobData } from './types';
import { addEmailJob } from './queue';

const resend = new Resend(process.env.RESEND_API_KEY);

// Get database instance
const db = getDb(process.env.DATABASE_URL!);
const { emailEvents, scheduledEmails } = schema;

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const {
    to,
    component,
    props = {},
    subject,
    from = 'tambo-ai <noreply@updates.tambo.co>',
    scheduledFor
  } = options;

  // Get template name from component type
  const templateName = component.type?.displayName || component.type?.name || 'UnknownTemplate';
  
  // Convert recipients to array
  const recipients = Array.isArray(to) ? to : [to];

  // If scheduled, add to scheduled_emails table and queue
  if (scheduledFor) {
    for (const recipient of recipients) {
      const [scheduledEmail] = await db.insert(scheduledEmails).values({
        to: recipient,
        from,
        subject: subject || 'Email from tambo',
        templateName,
        templateProps: props,
        scheduledFor,
      }).returning();

      // Add to pg-boss queue for future processing
      await addEmailJob({
        to: recipient,
        from,
        subject: subject || 'Email from tambo',
        templateName,
        templateProps: props,
        scheduledEmailId: scheduledEmail.id,
      }, { delay: Math.max(0, scheduledFor.getTime() - Date.now()) });
    }
    return;
  }

  // Send immediately
  for (const recipient of recipients) {
    try {
      // Create email event record
      const [emailEvent] = await db.insert(emailEvents).values({
        to: recipient,
        from,
        subject: subject || 'Email from tambo',
        templateName,
        templateProps: props,
        status: 'pending',
      }).returning();

      // Render the React component to HTML
      const html = render(component);

      // Send via Resend
      const result = await resend.emails.send({
        from,
        to: recipient,
        subject: subject || 'Email from tambo',
        html,
      });

      // Update email event with success
      await db.update(emailEvents)
        .set({
          status: 'sent',
          resendId: result.data?.id,
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailEvents.id, emailEvent.id));

    } catch (error) {
      // Update email event with error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await db.update(emailEvents)
        .set({
          status: 'failed',
          error: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(emailEvents.id, emailEvent.id));

      throw error;
    }
  }
}

export async function sendEmailJob(job: EmailJobData): Promise<void> {
  const { to, from, subject, templateName, templateProps, scheduledEmailId } = job;

  try {
    // Create email event record
    const [emailEvent] = await db.insert(emailEvents).values({
      to,
      from,
      subject,
      templateName,
      templateProps,
      status: 'pending',
    }).returning();

    // If this was a scheduled email, mark it as processed
    if (scheduledEmailId) {
      await db.update(scheduledEmails)
        .set({
          processed: true,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(scheduledEmails.id, scheduledEmailId));
    }

    // Get the template component - this would need to be implemented based on your template system
    // For now, we'll send a basic HTML email
    const html = `
      <h1>Email from tambo</h1>
      <p>Template: ${templateName}</p>
      <pre>${JSON.stringify(templateProps, null, 2)}</pre>
    `;

    // Send via Resend
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    // Update email event with success
    await db.update(emailEvents)
      .set({
        status: 'sent',
        resendId: result.data?.id,
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(emailEvents.id, emailEvent.id));

  } catch (error) {
    // Update email event with error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await db.update(emailEvents)
      .set({
        status: 'failed',
        error: errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(emailEvents.id, emailEvent.id));

    throw error;
  }
}