-- Create pg_cron extension if not exists
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create schema for pg-boss if not exists
CREATE SCHEMA IF NOT EXISTS pgboss;

-- Create function to process scheduled emails
CREATE OR REPLACE FUNCTION process_scheduled_emails()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  email_record RECORD;
BEGIN
  -- Find all unprocessed emails that are due
  FOR email_record IN
    SELECT id, to_email, from_email, subject, template_name, template_props
    FROM scheduled_emails
    WHERE processed = false
      AND scheduled_for <= NOW()
    ORDER BY scheduled_for ASC
    LIMIT 100  -- Process in batches
  LOOP
    -- Insert into pg-boss job queue
    INSERT INTO pgboss.job (name, data, state, createdon, startafter)
    VALUES (
      'send-email',
      json_build_object(
        'to', email_record.to_email,
        'from', email_record.from_email,
        'subject', email_record.subject,
        'templateName', email_record.template_name,
        'templateProps', email_record.template_props,
        'scheduledEmailId', email_record.id
      ),
      'created',
      NOW(),
      NOW()
    );
    
    -- Mark as processed
    UPDATE scheduled_emails
    SET processed = true, processed_at = NOW(), updated_at = NOW()
    WHERE id = email_record.id;
  END LOOP;
  
  RAISE NOTICE 'Processed scheduled emails';
END;
$$;

-- Schedule the cron job to run every minute
SELECT cron.schedule(
  'process-scheduled-emails',
  '* * * * *',  -- Every minute
  'SELECT process_scheduled_emails();'
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA pgboss TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA pgboss TO postgres;