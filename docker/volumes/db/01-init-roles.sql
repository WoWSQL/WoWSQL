-- WoWSQL Self-Hosted: Database Roles & Extensions
-- Creates the security role hierarchy used by PostgREST

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- PostgREST role hierarchy:
--   authenticator (LOGIN) -> can switch to anon / authenticated / service_role
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'wowsql_auth_pass';
  END IF;
END $$;

GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;

-- Public schema permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT CREATE ON SCHEMA public TO service_role;
REVOKE CREATE ON SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;

-- Auto-grant API roles on CREATE TABLE / SEQUENCE.
-- Grants only — never ENABLE or FORCE RLS. Owners choose RLS per table.
CREATE OR REPLACE FUNCTION public.wowsql_grant_api_roles()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  obj record;
BEGIN
  FOR obj IN
    SELECT object_type, object_identity, schema_name
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'CREATE SEQUENCE')
  LOOP
    IF obj.schema_name IS DISTINCT FROM 'public' THEN
      CONTINUE;
    END IF;
    IF position('_wowsql_' in obj.object_identity) > 0 THEN
      CONTINUE;
    END IF;
    BEGIN
      IF obj.object_type = 'table' THEN
        EXECUTE format(
          'GRANT SELECT, INSERT, UPDATE, DELETE ON %s TO anon, authenticated',
          obj.object_identity
        );
        EXECUTE format('GRANT ALL ON %s TO service_role', obj.object_identity);
      ELSIF obj.object_type = 'sequence' THEN
        EXECUTE format(
          'GRANT USAGE, SELECT ON %s TO anon, authenticated, service_role',
          obj.object_identity
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'wowsql_grant_api_roles failed for %: %',
        obj.object_identity, SQLERRM;
    END;
  END LOOP;
END;
$fn$;

DROP EVENT TRIGGER IF EXISTS wowsql_grant_api_roles_trg;
CREATE EVENT TRIGGER wowsql_grant_api_roles_trg
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'CREATE SEQUENCE')
  EXECUTE FUNCTION public.wowsql_grant_api_roles();

DO $$ BEGIN RAISE NOTICE 'WoWSQL: Roles and extensions initialized'; END $$;
