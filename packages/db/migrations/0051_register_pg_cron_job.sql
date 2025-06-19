-- TAM-199: enable pg_cron and schedule job to enqueue due emails every minute
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- function to enqueue due emails into pg-boss
CREATE OR REPLACE FUNCTION enqueue_due_emails() RETURNS void AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT * FROM scheduled_emails WHERE scheduled_at <= now() AND status = 'pending' LOOP
    -- Insert a job directly into pg-boss job table
    INSERT INTO pgboss.job (
      name, 
      data, 
      priority, 
      state, 
      createdon
    ) VALUES (
      'send-email',
      json_build_object(
        'to', rec.to_address,
        'componentName', rec.component_name,
        'props', rec.props
      ),
      0,
      'created',
      now()
    );
    -- mark as enqueued
    UPDATE scheduled_emails SET status = 'queued' WHERE id = rec.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- schedule cron job if not exists (runs every minute)
SELECT cron.schedule('enqueue_due_emails', '* * * * *', $$SELECT enqueue_due_emails();$$)
WHERE NOT EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'enqueue_due_emails'
);
