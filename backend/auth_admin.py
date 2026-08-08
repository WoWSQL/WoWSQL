"""
Self-hosted auth admin APIs — cloud-compatible shapes for the Studio auth UI.
Operates on local Postgres `auth` schema (project_id = 'default').
"""

from __future__ import annotations

import json
import math
import smtplib
from email.mime.text import MIMEText
from typing import Any, Dict, List, Optional

import os

from fastapi import APIRouter, Body, HTTPException, Request

PROJECT_ID = "default"
ENV_JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production-32-chars!!")

# Columns the live Studio PATCH /auth/config may send
ALLOWED_CONFIG_FIELDS = {
    "frontend_url",
    "site_url",  # self-host alias → frontend_url + site_url
    "email_password_enabled",
    "magic_link_enabled",
    "phone_otp_enabled",
    "email_otp_enabled",
    "anonymous_auth_enabled",
    "anonymous_enabled",  # legacy alias
    "email_confirmation_required",
    "jwt_expiry_hours",
    "refresh_token_expiry_days",
    "min_password_length",
    "max_password_length",
    "require_uppercase",
    "require_lowercase",
    "require_number",
    "require_special_char",
    "max_login_attempts",
    "login_lockout_duration_minutes",
    "session_timeout_hours",
    "mfa_enabled",
    "mfa_required",
    "rate_limit_per_hour",
    "rate_limit_per_day",
    "webhook_url",
    "webhook_events",
    "webhook_secret",
    "email_provider",
    "email_from_address",
    "email_from_name",
    "smtp_host",
    "smtp_port",
    "smtp_user",
    "smtp_pass",
    "smtp_secure",
    "sendgrid_api_key",
    "mailgun_api_key",
    "mailgun_domain",
    "ses_access_key",
    "ses_secret_key",
    "ses_region",
    "email_redirect_url",
    "allow_signup",
    "enable_signup",  # legacy alias → allow_signup
    "manual_linking_enabled",
    "auth_service_name",
    "email_templates",
    "auth_enabled",
}

# Maps request field → DB column
FIELD_ALIASES = {
    "site_url": "frontend_url",
    "enable_signup": "allow_signup",
    "anonymous_enabled": "anonymous_auth_enabled",
}

SCHEMA_ENSURE_SQL = """
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.providers_config (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      VARCHAR(255) NOT NULL,
    provider_name   VARCHAR(50) NOT NULL,
    client_id       VARCHAR(255) NOT NULL,
    client_secret   VARCHAR(255) NOT NULL,
    enabled         BOOLEAN DEFAULT TRUE,
    redirect_uri    VARCHAR(500) DEFAULT NULL,
    scopes          JSONB DEFAULT NULL,
    config          JSONB DEFAULT NULL,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_self_project_provider UNIQUE (project_id, provider_name)
);

DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS auth_enabled BOOLEAN DEFAULT TRUE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS frontend_url VARCHAR(500) DEFAULT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS magic_link_enabled BOOLEAN DEFAULT FALSE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS phone_otp_enabled BOOLEAN DEFAULT FALSE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS email_otp_enabled BOOLEAN DEFAULT TRUE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS anonymous_auth_enabled BOOLEAN DEFAULT FALSE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS allow_signup BOOLEAN DEFAULT TRUE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS manual_linking_enabled BOOLEAN DEFAULT FALSE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS email_redirect_url VARCHAR(500) DEFAULT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS email_templates JSONB DEFAULT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS min_password_length INT DEFAULT 8; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS max_password_length INT DEFAULT 128; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS require_uppercase BOOLEAN DEFAULT FALSE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS require_lowercase BOOLEAN DEFAULT FALSE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS require_number BOOLEAN DEFAULT FALSE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS require_special_char BOOLEAN DEFAULT FALSE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS max_login_attempts INT DEFAULT 5; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS login_lockout_duration_minutes INT DEFAULT 30; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS session_timeout_hours INT DEFAULT 24; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS mfa_required BOOLEAN DEFAULT FALSE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS rate_limit_per_hour INT DEFAULT 100; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS rate_limit_per_day INT DEFAULT 1000; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(500) DEFAULT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS webhook_events JSONB DEFAULT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(255) DEFAULT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS sendgrid_api_key VARCHAR(500) DEFAULT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS mailgun_api_key VARCHAR(500) DEFAULT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS mailgun_domain VARCHAR(255) DEFAULT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS ses_access_key VARCHAR(255) DEFAULT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS ses_secret_key VARCHAR(500) DEFAULT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE auth.config ADD COLUMN IF NOT EXISTS ses_region VARCHAR(50) DEFAULT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Self-host uses project_id = 'default' (text). wowsql-auth migrations may create UUID columns.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'providers_config'
      AND column_name = 'project_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE auth.providers_config
      ALTER COLUMN project_id TYPE VARCHAR(255) USING project_id::text;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Sync legacy columns into cloud-compatible names when present
UPDATE auth.config SET
  allow_signup = COALESCE(allow_signup, enable_signup, TRUE),
  anonymous_auth_enabled = COALESCE(anonymous_auth_enabled, anonymous_enabled, FALSE),
  frontend_url = COALESCE(frontend_url, site_url),
  auth_enabled = COALESCE(auth_enabled, TRUE)
WHERE project_id = 'default';
"""


async def ensure_auth_admin_schema(conn) -> None:
    await conn.execute(SCHEMA_ENSURE_SQL)


def _jsonish(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        return json.dumps(value)
    return value


def _parse_json(value: Any, default=None):
    if value is None:
        return default if default is not None else {}
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return default if default is not None else {}
    return default if default is not None else {}


async def _load_config_row(conn) -> Optional[Dict[str, Any]]:
    row = await conn.fetchrow("SELECT * FROM auth.config WHERE project_id = $1 LIMIT 1", PROJECT_ID)
    return dict(row) if row else None


async def _load_oauth_providers(conn) -> List[Dict[str, Any]]:
    exists = await conn.fetchval("""
        SELECT EXISTS(
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'auth' AND table_name = 'providers_config'
        )
    """)
    if not exists:
        return []
    rows = await conn.fetch(
        """SELECT provider_name, client_id, enabled, redirect_uri, scopes
           FROM auth.providers_config WHERE project_id = $1 ORDER BY provider_name""",
        PROJECT_ID,
    )
    out = []
    for r in rows:
        scopes = _parse_json(r["scopes"], [])
        if isinstance(scopes, str):
            scopes = [s for s in scopes.split(" ") if s]
        out.append({
            "provider_name": r["provider_name"],
            "client_id": r["client_id"],
            "enabled": bool(r["enabled"]),
            "redirect_uri": r["redirect_uri"],
            "scopes": scopes if isinstance(scopes, list) else [],
        })
    return out


def _config_public(row: Dict[str, Any], anon_key: str = "", service_key: str = "") -> Dict[str, Any]:
    frontend = row.get("frontend_url") or row.get("site_url")
    allow_signup = row.get("allow_signup")
    if allow_signup is None:
        allow_signup = row.get("enable_signup", True)
    anon = row.get("anonymous_auth_enabled")
    if anon is None:
        anon = row.get("anonymous_enabled", False)

    return {
        "enabled": row.get("auth_enabled") is not False,
        "jwt_secret_set": bool(row.get("jwt_secret")),
        "jwt_expiry_hours": row.get("jwt_expiry_hours", 24),
        "refresh_token_expiry_days": row.get("refresh_token_expiry_days", 30),
        "email_password_enabled": bool(row.get("email_password_enabled", True)),
        "magic_link_enabled": bool(row.get("magic_link_enabled", False)),
        "phone_otp_enabled": bool(row.get("phone_otp_enabled", False)),
        "email_otp_enabled": bool(row.get("email_otp_enabled", True)) if row.get("email_otp_enabled") is not None else True,
        "anonymous_auth_enabled": bool(anon),
        "email_confirmation_required": bool(row.get("email_confirmation_required", False)),
        "allow_signup": bool(allow_signup),
        "manual_linking_enabled": bool(row.get("manual_linking_enabled", False)),
        "frontend_url": frontend,
        "site_url": frontend or row.get("site_url"),
        "auth_service_name": row.get("auth_service_name") or "WoWSQL Auth",
        "email_provider": row.get("email_provider") or "smtp",
        "email_from_address": row.get("email_from_address"),
        "email_from_name": row.get("email_from_name"),
        "smtp_host": row.get("smtp_host"),
        "smtp_port": row.get("smtp_port") or 587,
        "smtp_user": row.get("smtp_user"),
        "smtp_pass": row.get("smtp_pass"),
        "smtp_secure": row.get("smtp_secure") if row.get("smtp_secure") is not None else "tls",
        "sendgrid_api_key": row.get("sendgrid_api_key"),
        "mailgun_api_key": row.get("mailgun_api_key"),
        "mailgun_domain": row.get("mailgun_domain"),
        "ses_access_key": row.get("ses_access_key"),
        "ses_secret_key": row.get("ses_secret_key"),
        "ses_region": row.get("ses_region"),
        "email_redirect_url": row.get("email_redirect_url"),
        "email_templates": _parse_json(row.get("email_templates"), {}),
        "min_password_length": row.get("min_password_length", 8),
        "max_password_length": row.get("max_password_length", 128),
        "require_uppercase": bool(row.get("require_uppercase", False)),
        "require_lowercase": bool(row.get("require_lowercase", False)),
        "require_number": bool(row.get("require_number", False)),
        "require_special_char": bool(row.get("require_special_char", False)),
        "max_login_attempts": row.get("max_login_attempts", 5),
        "login_lockout_duration_minutes": row.get("login_lockout_duration_minutes", 30),
        "session_timeout_hours": row.get("session_timeout_hours", 24),
        "mfa_enabled": bool(row.get("mfa_enabled", False)),
        "mfa_required": bool(row.get("mfa_required", False)),
        "rate_limit_per_hour": row.get("rate_limit_per_hour", 100),
        "rate_limit_per_day": row.get("rate_limit_per_day", 1000),
        "webhook_url": row.get("webhook_url"),
        "webhook_events": _parse_json(row.get("webhook_events"), []),
        "webhook_secret": row.get("webhook_secret"),
        "public_api_key": anon_key or None,
        "secret_api_key": service_key or None,
        # Keep legacy keys for older self-host settings page
        "enable_signup": bool(allow_signup),
        "redirect_urls": "",
    }


def create_auth_admin_router(get_pool, get_current_user, get_api_keys) -> APIRouter:
    router = APIRouter()

    @router.get("/api/v1/projects/{slug}/auth/status")
    async def get_auth_status(slug: str, request: Request):
        get_current_user(request)
        pool = get_pool()
        async with pool.acquire() as conn:
            await ensure_auth_admin_schema(conn)
            # Cloud parity: auth is "enabled" when auth.config exists (schema provisioned).
            # Soft-disable must not hide Studio auth UI when tables are already present.
            exists = await conn.fetchval("""
                SELECT EXISTS(
                  SELECT 1 FROM information_schema.tables
                  WHERE table_schema = 'auth' AND table_name = 'config'
                )
            """)
            if not exists:
                return {"enabled": False, "message": "Auth schema not found"}

            row = await _load_config_row(conn)
            if not row:
                # Schema/tables exist (e.g. from wowsql-auth migrations) but no config row yet
                try:
                    await conn.execute(
                        """INSERT INTO auth.config (project_id, jwt_secret, auth_enabled, allow_signup, enable_signup)
                           VALUES ($1, $2, TRUE, TRUE, TRUE)""",
                        PROJECT_ID, ENV_JWT_SECRET[:255],
                    )
                except Exception:
                    pass
                row = await _load_config_row(conn)
                if not row:
                    return {"enabled": False, "message": "Auth is not configured"}

            # Heal soft-disable so Studio matches cloud "schema exists" semantics
            if row.get("auth_enabled") is False:
                await conn.execute(
                    """UPDATE auth.config SET auth_enabled = TRUE, updated_at = NOW()
                       WHERE project_id = $1""",
                    PROJECT_ID,
                )
                row = await _load_config_row(conn) or row

            anon_key, service_key = get_api_keys()
            config = _config_public(row, anon_key, service_key)
            try:
                oauth = await _load_oauth_providers(conn)
            except Exception:
                oauth = []
            return {"enabled": True, "config": config, "oauth_providers": oauth}

    @router.get("/api/v1/projects/{slug}/auth/config")
    async def get_auth_config(slug: str, request: Request):
        get_current_user(request)
        pool = get_pool()
        async with pool.acquire() as conn:
            await ensure_auth_admin_schema(conn)
            row = await _load_config_row(conn)
            if not row:
                raise HTTPException(status_code=404, detail="Auth config not found")
            anon_key, service_key = get_api_keys()
            return _config_public(row, anon_key, service_key)

    async def _apply_config_patch(conn, body: dict):
        updates = {}
        for key, value in body.items():
            if key not in ALLOWED_CONFIG_FIELDS:
                continue
            col = FIELD_ALIASES.get(key, key)
            updates[col] = value
            # Keep legacy columns in sync when present
            if col == "frontend_url":
                updates["site_url"] = value
            if col == "allow_signup":
                updates["enable_signup"] = value
            if col == "anonymous_auth_enabled":
                updates["anonymous_enabled"] = value

        if not updates:
            raise HTTPException(status_code=400, detail="No valid fields to update")

        # Drop unknown columns quietly if ALTER hasn't run yet
        cols = await conn.fetch("""
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'auth' AND table_name = 'config'
        """)
        available = {r["column_name"] for r in cols}
        filtered = {k: v for k, v in updates.items() if k in available}
        if not filtered:
            raise HTTPException(status_code=400, detail="No applicable config columns")

        sets = []
        params = []
        for i, (col, val) in enumerate(filtered.items(), start=1):
            if col in ("email_templates", "webhook_events"):
                val = _jsonish(val)
            sets.append(f"{col} = ${i}")
            params.append(val)
        params.append(PROJECT_ID)
        q = f"UPDATE auth.config SET {', '.join(sets)}, updated_at = NOW() WHERE project_id = ${len(params)}"
        await conn.execute(q, *params)

    @router.patch("/api/v1/projects/{slug}/auth/config")
    async def patch_auth_config(slug: str, request: Request, body: dict = {}):
        get_current_user(request)
        pool = get_pool()
        async with pool.acquire() as conn:
            await ensure_auth_admin_schema(conn)
            await _apply_config_patch(conn, body or {})
        return {"success": True}

    @router.put("/api/v1/projects/{slug}/auth/config")
    async def put_auth_config(slug: str, request: Request, body: dict = {}):
        # Keep PUT for older Auth Settings page
        return await patch_auth_config(slug, request, body)

    @router.post("/api/v1/projects/{slug}/auth/enable")
    async def enable_auth(slug: str, request: Request, body: dict = Body(default={})):
        get_current_user(request)
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                await ensure_auth_admin_schema(conn)
                jwt_secret = (body or {}).get("jwt_secret") or ENV_JWT_SECRET
                if not isinstance(jwt_secret, str) or len(jwt_secret) < 32:
                    jwt_secret = ENV_JWT_SECRET if len(ENV_JWT_SECRET) >= 32 else (jwt_secret or ENV_JWT_SECRET)
                jwt_secret = str(jwt_secret)[:255]

                exists = await conn.fetchval("""
                    SELECT EXISTS(
                      SELECT 1 FROM information_schema.tables
                      WHERE table_schema = 'auth' AND table_name = 'config'
                    )
                """)
                if not exists:
                    raise HTTPException(
                        status_code=500,
                        detail="Auth schema is missing. Ensure the auth service has started at least once.",
                    )

                row = await _load_config_row(conn)
                if row:
                    await conn.execute(
                        """UPDATE auth.config SET auth_enabled = TRUE, jwt_secret = $1, updated_at = NOW()
                           WHERE project_id = $2""",
                        jwt_secret, PROJECT_ID,
                    )
                else:
                    await conn.execute(
                        """INSERT INTO auth.config (project_id, jwt_secret, auth_enabled, allow_signup, enable_signup)
                           VALUES ($1, $2, TRUE, TRUE, TRUE)""",
                        PROJECT_ID, jwt_secret,
                    )
            return {"success": True, "message": "Authentication enabled", "auth_config": {"enabled": True}}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to enable authentication: {e}") from e

    @router.post("/api/v1/projects/{slug}/auth/disable")
    async def disable_auth(slug: str, request: Request):
        get_current_user(request)
        pool = get_pool()
        async with pool.acquire() as conn:
            await ensure_auth_admin_schema(conn)
            # Soft-disable — keep data (safer for self-host)
            await conn.execute(
                """UPDATE auth.config SET auth_enabled = FALSE, updated_at = NOW()
                   WHERE project_id = $1""",
                PROJECT_ID,
            )
        return {"success": True, "message": "Authentication disabled", "auth_config": {"enabled": False}}

    @router.post("/api/v1/projects/{slug}/auth/oauth-providers")
    async def upsert_oauth_provider(slug: str, request: Request, body: dict = {}):
        get_current_user(request)
        pool = get_pool()
        name = (body.get("provider_name") or "").lower().strip()
        if not name:
            raise HTTPException(status_code=400, detail="provider_name is required")
        client_id = (body.get("client_id") or "").strip()
        if not client_id:
            raise HTTPException(status_code=400, detail="client_id is required")
        client_secret = body.get("client_secret")
        enabled = body.get("enabled", True)
        redirect_uri = body.get("redirect_uri")
        scopes = body.get("scopes") or []
        async with pool.acquire() as conn:
            await ensure_auth_admin_schema(conn)
            existing = await conn.fetchrow(
                """SELECT client_secret FROM auth.providers_config
                   WHERE project_id = $1 AND provider_name = $2""",
                PROJECT_ID, name,
            )
            if client_secret in (None, "", "___keep_existing___"):
                if not existing:
                    raise HTTPException(status_code=400, detail="client_secret is required for new providers")
                client_secret = existing["client_secret"]
            await conn.execute(
                """INSERT INTO auth.providers_config
                     (project_id, provider_name, client_id, client_secret, enabled, redirect_uri, scopes, updated_at)
                   VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb, NOW())
                   ON CONFLICT (project_id, provider_name) DO UPDATE SET
                     client_id = EXCLUDED.client_id,
                     client_secret = EXCLUDED.client_secret,
                     enabled = EXCLUDED.enabled,
                     redirect_uri = EXCLUDED.redirect_uri,
                     scopes = EXCLUDED.scopes,
                     updated_at = NOW()""",
                PROJECT_ID, name, client_id, client_secret, enabled, redirect_uri, json.dumps(scopes),
            )
            # Keep legacy google_/github_ columns in sync when present
            if name in ("google", "github"):
                cols = await conn.fetch(
                    """SELECT column_name FROM information_schema.columns
                       WHERE table_schema='auth' AND table_name='config'"""
                )
                available = {r["column_name"] for r in cols}
                en_col = f"{name}_enabled"
                id_col = f"{name}_client_id"
                sec_col = f"{name}_client_secret"
                if {en_col, id_col, sec_col}.issubset(available):
                    await conn.execute(
                        f"""UPDATE auth.config SET {en_col}=$1, {id_col}=$2, {sec_col}=$3, updated_at=NOW()
                            WHERE project_id=$4""",
                        enabled, client_id, client_secret, PROJECT_ID,
                    )
        return {"success": True, "message": f"Provider {name} saved", "provider": name, "enabled": enabled}

    @router.delete("/api/v1/projects/{slug}/auth/oauth-providers/{provider_name}")
    async def delete_oauth_provider(slug: str, provider_name: str, request: Request):
        get_current_user(request)
        pool = get_pool()
        name = provider_name.lower().strip()
        async with pool.acquire() as conn:
            await ensure_auth_admin_schema(conn)
            await conn.execute(
                """UPDATE auth.providers_config SET enabled = FALSE, updated_at = NOW()
                   WHERE project_id = $1 AND provider_name = $2""",
                PROJECT_ID, name,
            )
            if name in ("google", "github"):
                cols = await conn.fetch(
                    """SELECT column_name FROM information_schema.columns
                       WHERE table_schema='auth' AND table_name='config'"""
                )
                available = {r["column_name"] for r in cols}
                en_col = f"{name}_enabled"
                if en_col in available:
                    await conn.execute(
                        f"UPDATE auth.config SET {en_col}=FALSE, updated_at=NOW() WHERE project_id=$1",
                        PROJECT_ID,
                    )
        return {"success": True, "message": f"Provider {name} disabled"}

    @router.get("/api/v1/projects/{slug}/auth/providers")
    async def get_legacy_providers(slug: str, request: Request):
        """Legacy flat providers shape used by older self-host pages."""
        status = await get_auth_status(slug, request)
        cfg = status.get("config") or {}
        oauth = {p["provider_name"]: p for p in status.get("oauth_providers") or []}
        google = oauth.get("google") or {}
        github = oauth.get("github") or {}
        return {
            "email_enabled": cfg.get("email_password_enabled", True),
            "anonymous_enabled": cfg.get("anonymous_auth_enabled", False),
            "google_enabled": bool(google.get("enabled")),
            "google_client_id": google.get("client_id") or "",
            "google_client_secret": "",
            "github_enabled": bool(github.get("enabled")),
            "github_client_id": github.get("client_id") or "",
            "github_client_secret": "",
        }

    @router.put("/api/v1/projects/{slug}/auth/providers")
    async def put_legacy_providers(slug: str, request: Request, body: dict = {}):
        mapped = {}
        if "email_enabled" in body:
            mapped["email_password_enabled"] = body["email_enabled"]
        if "anonymous_enabled" in body:
            mapped["anonymous_auth_enabled"] = body["anonymous_enabled"]
        if mapped:
            await patch_auth_config(slug, request, mapped)
        for name in ("google", "github"):
            en = body.get(f"{name}_enabled")
            cid = body.get(f"{name}_client_id")
            csec = body.get(f"{name}_client_secret")
            if en is not None or cid or csec:
                await upsert_oauth_provider(slug, request, {
                    "provider_name": name,
                    "client_id": cid or "pending",
                    "client_secret": csec or "___keep_existing___",
                    "enabled": bool(en) if en is not None else True,
                })
        return {"success": True}

    @router.get("/api/v1/projects/{slug}/auth/sessions")
    async def list_sessions(
        slug: str, request: Request,
        page: int = 1, per_page: int = 20, active_only: bool = False,
    ):
        get_current_user(request)
        pool = get_pool()
        offset = (page - 1) * per_page
        async with pool.acquire() as conn:
            where = ["s.project_id = $1"]
            params: List[Any] = [PROJECT_ID]
            if active_only:
                where.append("s.is_active = TRUE")
            where_sql = " AND ".join(where)
            total = await conn.fetchval(
                f"SELECT COUNT(*) FROM auth.sessions s WHERE {where_sql}", *params
            )
            rows = await conn.fetch(
                f"""SELECT s.id, s.user_id, s.is_active, s.ip_address, s.user_agent,
                           s.created_at, s.revoked_at, s.access_token_expires_at,
                           u.email, u.full_name
                    FROM auth.sessions s
                    LEFT JOIN auth.users u ON u.id = s.user_id
                    WHERE {where_sql}
                    ORDER BY s.created_at DESC
                    LIMIT ${len(params)+1} OFFSET ${len(params)+2}""",
                *params, per_page, offset,
            )
            sessions = [{
                "id": str(r["id"]),
                "user_id": str(r["user_id"]) if r["user_id"] else None,
                "user_email": r["email"],
                "email": r["email"],
                "full_name": r["full_name"],
                "is_active": r["is_active"],
                "ip_address": r["ip_address"],
                "user_agent": r["user_agent"],
                "device_type": None,
                "created_at": str(r["created_at"]) if r["created_at"] else None,
                "revoked_at": str(r["revoked_at"]) if r["revoked_at"] else None,
                "expires_at": str(r["access_token_expires_at"]) if r["access_token_expires_at"] else None,
                "last_activity_at": str(r["created_at"]) if r["created_at"] else None,
            } for r in rows]
        total_pages = math.ceil(total / per_page) if total else 0
        return {"sessions": sessions, "total": total, "page": page, "total_pages": total_pages}

    @router.delete("/api/v1/projects/{slug}/auth/sessions/{session_id}")
    async def revoke_session(slug: str, session_id: str, request: Request):
        get_current_user(request)
        pool = get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """UPDATE auth.sessions SET is_active = FALSE, revoked_at = NOW()
                   WHERE id = $1 AND project_id = $2""",
                session_id, PROJECT_ID,
            )
        return {"success": True}

    @router.delete("/api/v1/projects/{slug}/auth/sessions")
    async def revoke_all_sessions(slug: str, request: Request):
        get_current_user(request)
        pool = get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """UPDATE auth.sessions SET is_active = FALSE, revoked_at = NOW()
                   WHERE project_id = $1 AND is_active = TRUE""",
                PROJECT_ID,
            )
        return {"success": True}

    @router.get("/api/v1/projects/{slug}/auth/stats")
    async def auth_stats(slug: str, request: Request):
        get_current_user(request)
        pool = get_pool()
        async with pool.acquire() as conn:
            users = await conn.fetchval(
                "SELECT COUNT(*) FROM auth.users WHERE project_id=$1 AND deleted_at IS NULL", PROJECT_ID
            ) or 0
            active_sessions = await conn.fetchval(
                "SELECT COUNT(*) FROM auth.sessions WHERE project_id=$1 AND is_active=TRUE", PROJECT_ID
            ) or 0
            verified = await conn.fetchval(
                """SELECT COUNT(*) FROM auth.users
                   WHERE project_id=$1 AND deleted_at IS NULL AND email_verified=TRUE""",
                PROJECT_ID,
            ) or 0
            banned = await conn.fetchval(
                """SELECT COUNT(*) FROM auth.users
                   WHERE project_id=$1 AND deleted_at IS NULL AND is_banned=TRUE""",
                PROJECT_ID,
            ) or 0
        return {
            "total_users": users,
            "verified_users": verified,
            "banned_users": banned,
            "active_sessions": active_sessions,
            "recent_signups": [],
            "signups_24h": 0,
            "logins_24h": 0,
        }

    @router.get("/api/v1/projects/{slug}/auth/audit-logs")
    async def audit_logs(
        slug: str, request: Request,
        page: int = 1, per_page: int = 50, event_type: Optional[str] = None, limit: Optional[int] = None,
    ):
        get_current_user(request)
        pool = get_pool()
        if limit and not per_page:
            per_page = limit
        offset = (page - 1) * per_page
        async with pool.acquire() as conn:
            exists = await conn.fetchval("""
                SELECT EXISTS(SELECT 1 FROM information_schema.tables
                              WHERE table_schema='auth' AND table_name='audit_logs')
            """)
            if not exists:
                return {"logs": [], "total": 0, "page": page, "total_pages": 0}
            where = ["project_id = $1"]
            params: List[Any] = [PROJECT_ID]
            if event_type:
                params.append(event_type)
                where.append(f"event_type = ${len(params)}")
            where_sql = " AND ".join(where)
            total = await conn.fetchval(f"SELECT COUNT(*) FROM auth.audit_logs WHERE {where_sql}", *params)
            # Prefer event_data if present, else metadata
            cols = await conn.fetch(
                """SELECT column_name FROM information_schema.columns
                   WHERE table_schema='auth' AND table_name='audit_logs'"""
            )
            available = {r["column_name"] for r in cols}
            meta_col = "event_data" if "event_data" in available else ("metadata" if "metadata" in available else None)
            select_meta = f", {meta_col} as event_data" if meta_col else ", NULL::jsonb as event_data"
            rows = await conn.fetch(
                f"""SELECT id, user_id, event_type, event_status, ip_address, created_at{select_meta}
                    FROM auth.audit_logs WHERE {where_sql}
                    ORDER BY created_at DESC
                    LIMIT ${len(params)+1} OFFSET ${len(params)+2}""",
                *params, per_page, offset,
            )
            logs = [{
                "id": str(r["id"]),
                "user_id": str(r["user_id"]) if r["user_id"] else None,
                "event_type": r["event_type"],
                "event_status": r["event_status"] or "success",
                "ip_address": r["ip_address"],
                "created_at": str(r["created_at"]) if r["created_at"] else None,
                "event_data": _parse_json(r["event_data"], {}),
                "metadata": _parse_json(r["event_data"], {}),
            } for r in rows]
        total_pages = math.ceil(total / per_page) if total else 0
        return {"logs": logs, "total": total, "page": page, "total_pages": total_pages}

    @router.post("/api/v1/projects/{slug}/auth/test-smtp")
    async def test_smtp(slug: str, request: Request, body: dict = {}):
        get_current_user(request)
        host = body.get("smtp_host")
        port = int(body.get("smtp_port") or 587)
        user = body.get("smtp_user")
        password = body.get("smtp_pass")
        to_addr = body.get("to") or body.get("email_from_address") or user
        if not host or not to_addr:
            raise HTTPException(status_code=400, detail="smtp_host and recipient are required")
        try:
            msg = MIMEText("WoWSQL self-hosted SMTP test message.")
            msg["Subject"] = "WoWSQL SMTP Test"
            msg["From"] = body.get("email_from_address") or user or "noreply@localhost"
            msg["To"] = to_addr
            with smtplib.SMTP(host, port, timeout=15) as smtp:
                smtp.ehlo()
                if body.get("smtp_secure") in (True, "tls", "starttls", "1"):
                    smtp.starttls()
                    smtp.ehlo()
                if user and password:
                    smtp.login(user, password)
                smtp.sendmail(msg["From"], [to_addr], msg.as_string())
            return {"success": True, "message": "Test email sent"}
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"SMTP test failed: {e}")

    return router
