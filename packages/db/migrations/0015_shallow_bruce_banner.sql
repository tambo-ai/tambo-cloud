-- make sure role has access to extensions schema, where we use some functions like gen_random_bytes
GRANT USAGE ON SCHEMA extensions TO project_api_key;
Grant EXECUTE on all existing functions in the public and extensions schemas
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT routine_schema, routine_name, specific_name
             FROM information_schema.routines
             WHERE routine_schema IN ('public', 'extensions')
               AND routine_type = 'FUNCTION'
    LOOP
        EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I TO project_api_key', r.routine_schema, r.routine_name);
    END LOOP;
END$$;

-- Set default privileges for future functions in the public and extensions schemas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO project_api_key;
ALTER DEFAULT PRIVILEGES IN SCHEMA extensions GRANT EXECUTE ON FUNCTIONS TO project_api_key;
