-- WoWSQL Self-Hosted: Auth, Storage, and Realtime Schemas
-- Sets up the internal schemas that power WoWSQL services

-- ══════════════════════════════════════════════════════════
-- AUTH SCHEMA
-- ══════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.config (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id                  VARCHAR(255) NOT NULL,
    jwt_secret                  VARCHAR(255) NOT NULL,
    jwt_expiry_hours            INT NOT NULL DEFAULT 24,
    refresh_token_expiry_days   INT NOT NULL DEFAULT 7,
    auth_service_name           VARCHAR(255) DEFAULT 'WoWSQL Auth',
    email_provider              VARCHAR(50) DEFAULT 'none',
    email_from_address          VARCHAR(255) DEFAULT 'noreply@localhost',
    email_from_name             VARCHAR(255) DEFAULT 'WoWSQL Auth',
    smtp_host                   VARCHAR(255),
    smtp_port                   INT DEFAULT 587,
    smtp_user                   VARCHAR(255),
    smtp_pass                   VARCHAR(255),
    smtp_secure                 VARCHAR(10) DEFAULT 'tls',
    site_url                    VARCHAR(512) DEFAULT 'http://localhost:8080',
    enable_signup               BOOLEAN NOT NULL DEFAULT TRUE,
    email_password_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    email_confirmation_required BOOLEAN NOT NULL DEFAULT FALSE,
    allow_signup                BOOLEAN DEFAULT TRUE,
    manual_linking_enabled      BOOLEAN DEFAULT FALSE,
    email_redirect_url          VARCHAR(500) DEFAULT NULL,
    anonymous_enabled           BOOLEAN DEFAULT FALSE,
    google_enabled              BOOLEAN DEFAULT FALSE,
    google_client_id            VARCHAR(500) DEFAULT '',
    google_client_secret        VARCHAR(500) DEFAULT '',
    github_enabled              BOOLEAN DEFAULT FALSE,
    github_client_id            VARCHAR(500) DEFAULT '',
    github_client_secret        VARCHAR(500) DEFAULT '',
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth.users (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id             VARCHAR(255) NOT NULL,
    email                  VARCHAR(255),
    password_hash          VARCHAR(255),
    full_name              VARCHAR(255),
    username               VARCHAR(255),
    avatar_url             TEXT,
    user_metadata          JSONB DEFAULT '{}',
    app_metadata           JSONB DEFAULT '{}',
    email_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    phone                  VARCHAR(50),
    phone_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    auth_provider          VARCHAR(50) NOT NULL DEFAULT 'email',
    provider_user_id       VARCHAR(255),
    is_active              BOOLEAN NOT NULL DEFAULT TRUE,
    is_banned              BOOLEAN NOT NULL DEFAULT FALSE,
    is_anonymous           BOOLEAN NOT NULL DEFAULT FALSE,
    banned_reason          TEXT DEFAULT NULL,
    banned_at              TIMESTAMPTZ DEFAULT NULL,
    banned_by              UUID DEFAULT NULL,
    email_confirmed_at     TIMESTAMPTZ DEFAULT NULL,
    phone_confirmed_at     TIMESTAMPTZ DEFAULT NULL,
    mfa_enabled            BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret             VARCHAR(255) DEFAULT NULL,
    backup_codes           JSONB DEFAULT NULL,
    locked_until           TIMESTAMPTZ,
    failed_login_attempts  INT NOT NULL DEFAULT 0,
    login_count            INT NOT NULL DEFAULT 0,
    last_login_at          TIMESTAMPTZ,
    last_login_ip          VARCHAR(50),
    password_changed_at    TIMESTAMPTZ,
    deleted_at             TIMESTAMPTZ,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth.sessions (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id               VARCHAR(255) NOT NULL,
    user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token             TEXT NOT NULL,
    refresh_token            TEXT,
    access_token_expires_at  TIMESTAMPTZ,
    refresh_token_expires_at TIMESTAMPTZ,
    is_active                BOOLEAN NOT NULL DEFAULT TRUE,
    ip_address               VARCHAR(50),
    user_agent               TEXT,
    revoked_at               TIMESTAMPTZ,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth.verification_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  VARCHAR(255) NOT NULL,
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL,
    token_type  VARCHAR(50) NOT NULL DEFAULT 'email_verification',
    email       VARCHAR(255),
    is_used     BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth.audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      VARCHAR(255) NOT NULL,
    user_id         UUID,
    event_type      VARCHAR(100) NOT NULL,
    event_status    VARCHAR(50) DEFAULT 'success',
    event_category  VARCHAR(50) DEFAULT NULL,
    ip_address      VARCHAR(50),
    user_agent      TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(project_id, email);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth.sessions(project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth.sessions(access_token);
CREATE INDEX IF NOT EXISTS idx_auth_audit ON auth.audit_logs(project_id, created_at);

-- Seed auth config for default project (jwt_secret will be updated by backend on startup)
INSERT INTO auth.config (project_id, jwt_secret, site_url)
VALUES ('default', 'placeholder-will-be-set-by-backend', 'http://localhost:8080')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════
-- STORAGE SCHEMA
-- ══════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS storage.buckets (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name               VARCHAR(255) NOT NULL UNIQUE,
    public             BOOLEAN NOT NULL DEFAULT FALSE,
    file_size_limit    BIGINT,
    allowed_mime_types TEXT[],
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storage.objects (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id    UUID NOT NULL REFERENCES storage.buckets(id) ON DELETE CASCADE,
    name         VARCHAR(512) NOT NULL,
    path         VARCHAR(1024) NOT NULL,
    mime_type    VARCHAR(255),
    size         BIGINT NOT NULL DEFAULT 0,
    metadata     JSONB DEFAULT '{}',
    data         BYTEA,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(bucket_id, path)
);

CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket ON storage.objects(bucket_id);
CREATE INDEX IF NOT EXISTS idx_storage_objects_path ON storage.objects(path);

-- ══════════════════════════════════════════════════════════
-- REALTIME SCHEMA
-- ══════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS realtime;

CREATE TABLE IF NOT EXISTS realtime.enabled_tables (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schema_name   VARCHAR(255) NOT NULL DEFAULT 'public',
    table_name    VARCHAR(255) NOT NULL,
    event_types   TEXT[] NOT NULL DEFAULT '{INSERT,UPDATE,DELETE}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(schema_name, table_name)
);

CREATE TABLE IF NOT EXISTS realtime.subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id   VARCHAR(255) NOT NULL,
    schema_name     VARCHAR(255) NOT NULL DEFAULT 'public',
    table_name      VARCHAR(255) NOT NULL,
    event_types     TEXT[] NOT NULL DEFAULT '{INSERT,UPDATE,DELETE}',
    filters         JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rt_subs_conn ON realtime.subscriptions(connection_id);
CREATE INDEX IF NOT EXISTS idx_rt_subs_table ON realtime.subscriptions(schema_name, table_name);

-- Realtime trigger function (broadcasts changes via pg_notify)
CREATE OR REPLACE FUNCTION realtime.broadcast_changes()
RETURNS trigger AS $$
DECLARE
    payload JSONB;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        payload := jsonb_build_object('type', 'INSERT', 'schema', TG_TABLE_SCHEMA, 'table', TG_TABLE_NAME, 'new', row_to_json(NEW)::jsonb);
    ELSIF (TG_OP = 'UPDATE') THEN
        payload := jsonb_build_object('type', 'UPDATE', 'schema', TG_TABLE_SCHEMA, 'table', TG_TABLE_NAME, 'new', row_to_json(NEW)::jsonb, 'old', row_to_json(OLD)::jsonb);
    ELSIF (TG_OP = 'DELETE') THEN
        payload := jsonb_build_object('type', 'DELETE', 'schema', TG_TABLE_SCHEMA, 'table', TG_TABLE_NAME, 'old', row_to_json(OLD)::jsonb);
    END IF;

    PERFORM pg_notify('realtime_changes', payload::text);

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════
-- PERMISSIONS
-- ══════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticated;

GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA storage TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA storage TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA storage TO authenticated;

GRANT USAGE ON SCHEMA realtime TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA realtime TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA realtime TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

DO $$ BEGIN RAISE NOTICE 'WoWSQL: All schemas initialized'; END $$;
