CREATE EXTENSION if not exists pgcrypto;

-- Generate a custom ID with a prefix and a random part, for use as a unique identifier
CREATE OR REPLACE FUNCTION generate_custom_id(
    prefix TEXT,
    random_length INT DEFAULT 8
) RETURNS TEXT AS $$
DECLARE
    random_part TEXT;
    signature TEXT;
    secret_key TEXT := current_setting('custom.custom_id_secret_key');
BEGIN
    IF random_length <= 0 THEN
        RAISE EXCEPTION 'random_length must be greater than 0';
    END IF;

    -- Generate a random byte string and encode it as Base64
    random_part := encode(gen_random_bytes((random_length * 3 + 3) / 4), 'base64');
    random_part := regexp_replace(random_part, '[^a-zA-Z0-9]', '', 'g'); -- Remove non-alphanumeric characters
    random_part := substring(random_part FROM 1 FOR random_length);

    -- Compute the signature using HMAC with SHA-256
    signature := encode(hmac(random_part, secret_key, 'sha256'), 'hex');
    signature := substring(signature FROM 1 FOR 6); -- Shorten for brevity

    -- Combine prefix, random part, and signature
    RETURN prefix || random_part || '.' || signature;
END;
$$ LANGUAGE plpgsql;
