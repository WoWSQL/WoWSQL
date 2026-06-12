"""
WoWSQL Self-Hosted — Mini Backend
Handles dashboard authentication and database operations.
All data operations are done via direct PostgreSQL queries.
"""

import os
import json
import math
import time
import asyncio
from typing import Optional, List

import asyncpg
import bcrypt
import jwt
from fastapi import FastAPI, Request, Response, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Config ────────────────────────────────────────────────────────────────────

DB_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@db:5432/postgres")
JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-production-32-chars!!")
COOKIE_DOMAIN = os.environ.get("COOKIE_DOMAIN", None)
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"
ACCESS_TOKEN_EXPIRY = 3600
REFRESH_TOKEN_EXPIRY = 86400 * 7
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")


def _generate_api_key(role: str) -> str:
    """Generate a JWT API key for a given role, valid for 10 years."""
    payload = {
        "role": role,
        "iss": "wowsql-self-hosted",
        "iat": int(time.time()),
        "exp": int(time.time()) + 86400 * 365 * 10,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


ANON_KEY = ""
SERVICE_ROLE_KEY = ""

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="WoWSQL Self-Hosted Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pool: Optional[asyncpg.Pool] = None


# ── Lifecycle ─────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    global pool, ANON_KEY, SERVICE_ROLE_KEY
    for attempt in range(10):
        try:
            pool = await asyncpg.create_pool(DB_URL, min_size=2, max_size=10)
            await _ensure_admin_table()
            # Load or create persistent API keys
            async with pool.acquire() as conn:
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS public._wowsql_api_keys (
                        role TEXT PRIMARY KEY,
                        key TEXT NOT NULL,
                        created_at TIMESTAMPTZ DEFAULT NOW()
                    )
                """)
                anon_row = await conn.fetchval("SELECT key FROM _wowsql_api_keys WHERE role = 'anon'")
                service_row = await conn.fetchval("SELECT key FROM _wowsql_api_keys WHERE role = 'service_role'")
                if not anon_row:
                    anon_row = _generate_api_key("anon")
                    await conn.execute("INSERT INTO _wowsql_api_keys (role, key) VALUES ('anon', $1)", anon_row)
                if not service_row:
                    service_row = _generate_api_key("service_role")
                    await conn.execute("INSERT INTO _wowsql_api_keys (role, key) VALUES ('service_role', $1)", service_row)
                ANON_KEY = anon_row
                SERVICE_ROLE_KEY = service_row
            print(f"[Backend] Connected to database successfully")
            print(f"[Backend] Anon key: {ANON_KEY[:50]}...")
            print(f"[Backend] Service key: {SERVICE_ROLE_KEY[:50]}...")
            # Sync JWT secret into auth.config
            try:
                async with pool.acquire() as conn:
                    await conn.execute("""
                        UPDATE auth.config SET jwt_secret = $1 WHERE project_id = 'default'
                    """, JWT_SECRET)
            except Exception:
                pass
            return
        except Exception as e:
            print(f"[Backend] DB connection attempt {attempt+1}/10 failed: {e}")
            await asyncio.sleep(2)
    raise RuntimeError("Cannot connect to database")


@app.on_event("shutdown")
async def shutdown():
    if pool:
        await pool.close()


async def _ensure_admin_table():
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS _wowsql_admins (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        # Sync JWT_SECRET into auth.config for the auth service (if table exists)
        try:
            await conn.execute("""
                UPDATE auth.config SET jwt_secret = $1 WHERE project_id = 'default'
            """, JWT_SECRET)
        except Exception:
            pass


# ── Models ────────────────────────────────────────────────────────────────────

class AuthRequest(BaseModel):
    email: str
    password: str

class ExecuteRequest(BaseModel):
    query: Optional[str] = None
    queries: Optional[List[str]] = None
    schema_name: Optional[str] = Field(default="public", alias="schema")

    class Config:
        populate_by_name = True

class QueryRequest(BaseModel):
    filters: Optional[list] = None
    sort_column: Optional[str] = None
    sort_direction: Optional[str] = "asc"
    limit: Optional[int] = 100
    offset: Optional[int] = 0


# ── JWT Helpers ───────────────────────────────────────────────────────────────

def _create_token(user_id: int, email: str, expiry: int) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": int(time.time()),
        "exp": int(time.time()) + expiry,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def _set_auth_cookies(response: Response, user_id: int, email: str):
    access = _create_token(user_id, email, ACCESS_TOKEN_EXPIRY)
    refresh = _create_token(user_id, email, REFRESH_TOKEN_EXPIRY)
    response.set_cookie(
        "access_token", access,
        httponly=True, secure=COOKIE_SECURE,
        samesite="lax", max_age=ACCESS_TOKEN_EXPIRY,
        domain=COOKIE_DOMAIN, path="/",
    )
    response.set_cookie(
        "refresh_token", refresh,
        httponly=True, secure=COOKIE_SECURE,
        samesite="lax", max_age=REFRESH_TOKEN_EXPIRY,
        domain=COOKIE_DOMAIN, path="/",
    )


def _get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return _decode_token(token)


# ── Auth Routes ───────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "wowsql-self-hosted-backend"}


@app.post("/api/v1/auth/register")
async def register(body: AuthRequest, response: Response):
    async with pool.acquire() as conn:
        existing = await conn.fetchval("SELECT COUNT(*) FROM _wowsql_admins")
        if existing > 0:
            raise HTTPException(status_code=403, detail="Admin already registered. Only one admin allowed in self-hosted mode.")
        pw_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
        row = await conn.fetchrow(
            "INSERT INTO _wowsql_admins (email, password_hash) VALUES ($1, $2) RETURNING id, email",
            body.email, pw_hash
        )
    _set_auth_cookies(response, row["id"], row["email"])
    return {"id": row["id"], "email": row["email"], "message": "Admin registered successfully"}


@app.post("/api/v1/auth/login")
async def login(body: AuthRequest, response: Response):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email, password_hash FROM _wowsql_admins WHERE email = $1",
            body.email
        )
    if not row or not bcrypt.checkpw(body.password.encode(), row["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    _set_auth_cookies(response, row["id"], row["email"])
    return {"id": row["id"], "email": row["email"]}


@app.get("/api/v1/auth/me")
async def me(request: Request):
    user = _get_current_user(request)
    return {"id": int(user["sub"]), "email": user["email"]}


@app.post("/api/v1/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    payload = _decode_token(token)
    _set_auth_cookies(response, int(payload["sub"]), payload["email"])
    return {"message": "Refreshed"}


@app.post("/api/v1/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/", domain=COOKIE_DOMAIN)
    response.delete_cookie("refresh_token", path="/", domain=COOKIE_DOMAIN)
    return {"message": "Logged out"}


@app.get("/api/v1/auth/setup-status")
async def setup_status():
    async with pool.acquire() as conn:
        count = await conn.fetchval("SELECT COUNT(*) FROM _wowsql_admins")
    return {"registered": count > 0}


# ── Project Routes (Static — single project mode) ────────────────────────────

@app.get("/api/v1/projects/{slug}")
async def get_project(slug: str, request: Request):
    _get_current_user(request)
    return {
        "id": 1,
        "name": "My Database",
        "slug": slug,
        "description": "Self-hosted WoWSQL project",
        "api_endpoint": FRONTEND_URL.replace(":3000", ":8080"),
        "owner_id": 1,
        "created_at": "2024-01-01T00:00:00Z",
        "settings": {},
        "deployment_type": "self-hosted",
        "infrastructure_type": "local",
    }


@app.get("/api/v1/projects/{slug}/api-keys")
async def get_api_keys(slug: str, request: Request):
    _get_current_user(request)
    return {
        "anon_key": ANON_KEY,
        "service_role_key": SERVICE_ROLE_KEY,
    }


@app.get("/api/v1/projects/{slug}/database-details")
async def get_database_details(slug: str, request: Request):
    _get_current_user(request)
    return {
        "host": "localhost",
        "port": 5432,
        "database": "postgres",
        "user": "postgres",
        "connection_string": DB_URL.replace("db:5432", "localhost:5432"),
    }


# ── Database Operations ───────────────────────────────────────────────────────

@app.get("/api/v1/db/schemas")
async def list_schemas(request: Request):
    _get_current_user(request)
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT s.schema_name as name,
                   COUNT(t.table_name)::int as table_count
            FROM information_schema.schemata s
            LEFT JOIN information_schema.tables t 
                ON t.table_schema = s.schema_name AND t.table_type = 'BASE TABLE'
                AND (s.schema_name != 'public' OR t.table_name NOT LIKE '_wowsql_%')
            WHERE s.schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
            GROUP BY s.schema_name
            ORDER BY CASE s.schema_name 
                WHEN 'public' THEN 0 
                WHEN 'auth' THEN 1 
                WHEN 'storage' THEN 2 
                WHEN 'realtime' THEN 3 
                ELSE 4 END
        """)
    return [{"name": r["name"], "table_count": r["table_count"]} for r in rows]


@app.get("/api/v1/db/tables")
async def list_tables(request: Request, schema: str = "public"):
    _get_current_user(request)
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = $1 AND table_type = 'BASE TABLE'
            AND ($2 != 'public' OR table_name NOT LIKE '_wowsql_%')
            ORDER BY table_name
        """, schema, schema)
    return [r["table_name"] for r in rows]


@app.get("/api/v1/db/tables/{table_name}")
async def get_table(
    table_name: str,
    request: Request,
    schema: str = "public",
    limit: int = 100,
    offset: int = 0,
    sort_column: Optional[str] = None,
    sort_direction: Optional[str] = "asc",
):
    _get_current_user(request)
    async with pool.acquire() as conn:
        # Get columns
        col_rows = await conn.fetch("""
            SELECT column_name, data_type, is_nullable, column_default,
                   character_maximum_length, numeric_precision, numeric_scale,
                   udt_name
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = $2
            ORDER BY ordinal_position
        """, schema, table_name)

        columns = []
        for c in col_rows:
            columns.append({
                "name": c["column_name"],
                "type": c["udt_name"] or c["data_type"],
                "null": c["is_nullable"],
                "is_nullable": c["is_nullable"] == "YES",
                "default": c["column_default"],
                "max_length": c["character_maximum_length"],
            })

        # Get primary key columns
        pk_rows = await conn.fetch("""
            SELECT a.attname
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = ($1 || '.' || $2)::regclass AND i.indisprimary
        """, schema, table_name)
        pk_columns = [r["attname"] for r in pk_rows]

        # Mark primary key in columns
        for col in columns:
            if col["name"] in pk_columns:
                col["key"] = "PRI"

        # Get total count
        total = await conn.fetchval(
            f'SELECT COUNT(*) FROM "{schema}"."{table_name}"'
        )

        # Get data
        order_clause = ""
        if sort_column:
            direction = "DESC" if sort_direction and sort_direction.lower() == "desc" else "ASC"
            order_clause = f'ORDER BY "{sort_column}" {direction}'

        rows = await conn.fetch(
            f'SELECT * FROM "{schema}"."{table_name}" {order_clause} LIMIT $1 OFFSET $2',
            limit, offset
        )

        data = [dict(r) for r in rows]
        # Convert non-serializable types to strings
        for row in data:
            for key, val in row.items():
                if val is not None and not isinstance(val, (str, int, float, bool)):
                    row[key] = str(val)

    return {
        "columns": columns,
        "primary_key_columns": pk_columns,
        "data": data,
        "total": total,
    }


@app.post("/api/v1/db/tables/{table_name}/query")
async def query_table(table_name: str, body: QueryRequest, request: Request, schema: str = "public"):
    _get_current_user(request)

    where_clauses = []
    params = []
    param_idx = 1

    if body.filters:
        for f in body.filters:
            col = f.get("column", "")
            op = f.get("operator", "equals")
            val = f.get("value", "")

            if op == "equals":
                where_clauses.append(f'"{col}" = ${param_idx}')
                params.append(val)
            elif op == "not_equals":
                where_clauses.append(f'"{col}" != ${param_idx}')
                params.append(val)
            elif op == "greater":
                where_clauses.append(f'"{col}" > ${param_idx}')
                params.append(val)
            elif op == "less":
                where_clauses.append(f'"{col}" < ${param_idx}')
                params.append(val)
            elif op == "like":
                where_clauses.append(f'"{col}" ILIKE ${param_idx}')
                params.append(f"%{val}%")
            elif op == "is_null":
                where_clauses.append(f'"{col}" IS NULL')
                continue
            elif op == "is_not_null":
                where_clauses.append(f'"{col}" IS NOT NULL')
                continue
            param_idx += 1

    where_sql = " AND ".join(where_clauses) if where_clauses else "TRUE"
    order_clause = ""
    if body.sort_column:
        direction = "DESC" if body.sort_direction == "desc" else "ASC"
        order_clause = f'ORDER BY "{body.sort_column}" {direction}'

    async with pool.acquire() as conn:
        total = await conn.fetchval(
            f'SELECT COUNT(*) FROM "{schema}"."{table_name}" WHERE {where_sql}',
            *params
        )
        rows = await conn.fetch(
            f'SELECT * FROM "{schema}"."{table_name}" WHERE {where_sql} {order_clause} LIMIT ${{param_idx}} OFFSET ${{param_idx + 1}}'.format(param_idx=param_idx, **{}),
            *params, body.limit or 100, body.offset or 0
        )

        data = [dict(r) for r in rows]
        for row in data:
            for key, val in row.items():
                if val is not None and not isinstance(val, (str, int, float, bool)):
                    row[key] = str(val)

    return {
        "data": data,
        "total": total,
    }


@app.post("/api/v1/db/execute")
async def execute_sql(body: ExecuteRequest, request: Request):
    _get_current_user(request)

    results = []
    queries = body.queries if body.queries else ([body.query] if body.query else [])

    if not queries:
        raise HTTPException(status_code=400, detail="No query provided")

    async with pool.acquire() as conn:
        for query in queries:
            q = query.strip()
            if not q:
                continue
            try:
                # Set search path
                if body.schema_name and body.schema_name != "public":
                    await conn.execute(f'SET search_path TO "{body.schema_name}", public')
                else:
                    await conn.execute('SET search_path TO public')

                upper_q = q.upper().lstrip()
                if upper_q.startswith("SELECT") or upper_q.startswith("WITH") or upper_q.startswith("EXPLAIN"):
                    rows = await conn.fetch(q)
                    data = [dict(r) for r in rows]
                    for row in data:
                        for key, val in row.items():
                            if val is not None and not isinstance(val, (str, int, float, bool)):
                                row[key] = str(val)
                    columns = list(data[0].keys()) if data else []
                    results.append({
                        "success": True,
                        "data": data,
                        "columns": columns,
                        "rowCount": len(data),
                        "command": "SELECT",
                    })
                else:
                    status = await conn.execute(q)
                    row_count = 0
                    if status:
                        parts = status.split()
                        if len(parts) >= 2 and parts[-1].isdigit():
                            row_count = int(parts[-1])
                    results.append({
                        "success": True,
                        "data": [],
                        "columns": [],
                        "rowCount": row_count,
                        "command": status.split()[0] if status else "OK",
                    })
            except Exception as e:
                results.append({
                    "success": False,
                    "error": str(e),
                    "data": [],
                    "columns": [],
                    "rowCount": 0,
                })

    if len(results) == 1:
        return results[0]
    return results


@app.delete("/api/v1/db/tables/{table_name}")
async def drop_table(table_name: str, request: Request, schema: str = "public", cascade: bool = False):
    _get_current_user(request)
    cascade_sql = "CASCADE" if cascade else ""
    async with pool.acquire() as conn:
        await conn.execute(f'DROP TABLE "{schema}"."{table_name}" {cascade_sql}')
    return {"message": f"Table {table_name} dropped"}


# ── Data Types endpoint (used by table editor) ────────────────────────────────

@app.get("/api/v1/db/data-types")
async def get_data_types(request: Request):
    _get_current_user(request)
    def t(value: str, needs_params: bool = False, param_label: str = "", example: str = ""):
        r = {"value": value, "needs_params": needs_params}
        if param_label:
            r["param_label"] = param_label
        if example:
            r["example"] = example
        return r

    return {
        "numeric": [
            t("int2"), t("int4"), t("int8"), t("float4"), t("float8"),
            t("numeric", True, "precision,scale", "10,2"),
            t("serial"), t("bigserial"), t("smallserial"),
        ],
        "string": [
            t("text"), t("varchar", True, "length", "255"),
            t("char", True, "length", "1"), t("name"), t("citext"),
        ],
        "datetime": [
            t("timestamp"), t("timestamptz"), t("date"), t("time"), t("timetz"), t("interval"),
        ],
        "json": [
            t("json"), t("jsonb"),
        ],
        "extension": [
            t("uuid"), t("vector", True, "dimensions", "1536"),
        ],
        "spatial": [
            t("point"), t("line"), t("lseg"), t("box"), t("path"), t("polygon"), t("circle"),
        ],
        "other": [
            t("bool"), t("bytea"), t("inet"), t("cidr"), t("macaddr"),
            t("int4range"), t("int8range"), t("tsrange"), t("tstzrange"), t("daterange"),
            t("tsvector"), t("tsquery"), t("xml"), t("money"),
            t("int4[]"), t("text[]"), t("bool[]"), t("jsonb[]"), t("uuid[]"),
        ],
    }


# ── Auth Users Management ─────────────────────────────────────────────────────

@app.get("/api/v1/projects/{slug}/auth/users")
async def list_auth_users(
    slug: str, request: Request,
    page: int = 1, per_page: int = 20,
    search: Optional[str] = None, status: Optional[str] = None,
):
    _get_current_user(request)
    offset = (page - 1) * per_page

    where_clauses = ["deleted_at IS NULL"]
    params = []
    idx = 1

    if search:
        where_clauses.append(f"(email ILIKE ${idx} OR full_name ILIKE ${idx})")
        params.append(f"%{search}%")
        idx += 1

    if status == "verified":
        where_clauses.append("email_verified = true")
    elif status == "unverified":
        where_clauses.append("email_verified = false")
    elif status == "banned":
        where_clauses.append("is_banned = true")

    where_sql = " AND ".join(where_clauses) if where_clauses else "TRUE"

    async with pool.acquire() as conn:
        # Ensure auth.users table exists
        exists = await conn.fetchval("""
            SELECT EXISTS(
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'auth' AND table_name = 'users'
            )
        """)
        if not exists:
            return {"users": [], "total": 0, "page": page, "total_pages": 0}

        total = await conn.fetchval(f"SELECT COUNT(*) FROM auth.users WHERE project_id = 'default' AND {where_sql}", *params)
        rows = await conn.fetch(
            f"""SELECT id, email, phone, full_name, auth_provider, email_verified,
                       is_banned, banned_reason, created_at, last_login_at,
                       login_count, user_metadata, app_metadata,
                       CASE WHEN is_banned THEN false ELSE true END as is_active
                FROM auth.users WHERE project_id = 'default' AND {where_sql}
                ORDER BY created_at DESC
                LIMIT ${idx} OFFSET ${idx + 1}""",
            *params, per_page, offset
        )

        users = []
        for r in rows:
            users.append({
                "id": str(r["id"]),
                "email": r["email"],
                "phone": r["phone"],
                "full_name": r["full_name"],
                "auth_provider": r["auth_provider"] or "email",
                "email_verified": r["email_verified"],
                "is_banned": r["is_banned"],
                "is_active": r["is_active"],
                "banned_reason": r["banned_reason"],
                "created_at": str(r["created_at"]) if r["created_at"] else None,
                "last_login_at": str(r["last_login_at"]) if r["last_login_at"] else None,
                "login_count": r["login_count"] or 0,
                "user_metadata": r["user_metadata"] if isinstance(r["user_metadata"], dict) else (json.loads(r["user_metadata"]) if r["user_metadata"] else {}),
                "app_metadata": r["app_metadata"] if isinstance(r["app_metadata"], dict) else (json.loads(r["app_metadata"]) if r["app_metadata"] else {}),
            })

    total_pages = math.ceil(total / per_page) if total > 0 else 0
    return {"users": users, "total": total, "page": page, "total_pages": total_pages}


@app.post("/api/v1/projects/{slug}/auth/users")
async def create_auth_user(slug: str, request: Request, body: dict = {}):
    _get_current_user(request)
    email = body.get("email", "")
    password = body.get("password", "")
    full_name = body.get("full_name", "")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow("""
                INSERT INTO auth.users (project_id, email, password_hash, full_name, auth_provider, email_verified)
                VALUES ('default', $1, $2, $3, 'email', true)
                RETURNING id, email, created_at
            """, email, pw_hash, full_name or None)
            return {"id": str(row["id"]), "email": row["email"], "created_at": str(row["created_at"])}
        except Exception as e:
            if "duplicate" in str(e).lower():
                raise HTTPException(status_code=409, detail="User already exists")
            raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/v1/projects/{slug}/auth/users/{user_id}")
async def update_auth_user(slug: str, user_id: str, request: Request, body: dict = {}):
    _get_current_user(request)
    async with pool.acquire() as conn:
        if "is_banned" in body:
            reason = body.get("banned_reason", None)
            await conn.execute(
                "UPDATE auth.users SET is_banned = $1, banned_reason = $2 WHERE id = $3",
                body["is_banned"], reason, user_id
            )
    return {"success": True}


@app.post("/api/v1/projects/{slug}/auth/users/{user_id}/verify")
async def verify_auth_user(slug: str, user_id: str, request: Request):
    _get_current_user(request)
    async with pool.acquire() as conn:
        await conn.execute("UPDATE auth.users SET email_verified = true WHERE id = $1", user_id)
    return {"success": True}


@app.delete("/api/v1/projects/{slug}/auth/users/{user_id}")
async def delete_auth_user(slug: str, user_id: str, request: Request):
    _get_current_user(request)
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM auth.users WHERE id = $1", user_id)
    return {"success": True}


# ── Settings / Connection Info ────────────────────────────────────────────────

@app.get("/api/v1/projects/{slug}/settings")
async def get_settings(slug: str, request: Request):
    _get_current_user(request)
    return {
        "project": {
            "name": "My Database",
            "slug": slug,
        },
        "database": {
            "host": "localhost",
            "port": 5432,
            "name": "postgres",
            "user": "postgres",
            "connection_string": DB_URL.replace("db:5432", "localhost:5432"),
        },
        "api": {
            "url": FRONTEND_URL.replace(":3000", ":8080"),
            "anon_key": ANON_KEY,
            "service_role_key": SERVICE_ROLE_KEY,
            "jwt_secret": JWT_SECRET[:8] + "..." if len(JWT_SECRET) > 8 else "***",
        },
    }


@app.post("/api/v1/projects/{slug}/reset-db-password")
async def reset_db_password(slug: str, request: Request, body: dict = {}):
    _get_current_user(request)
    new_password = body.get("password", "")
    if not new_password or len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    async with pool.acquire() as conn:
        await conn.execute(f"ALTER USER postgres PASSWORD '{new_password}'")
    return {"success": True, "message": "Database password updated. Update your .env file and restart containers."}


@app.post("/api/v1/projects/{slug}/regenerate-keys")
async def regenerate_keys(slug: str, request: Request):
    global ANON_KEY, SERVICE_ROLE_KEY
    _get_current_user(request)
    ANON_KEY = _generate_api_key("anon")
    SERVICE_ROLE_KEY = _generate_api_key("service_role")
    async with pool.acquire() as conn:
        await conn.execute("UPDATE _wowsql_api_keys SET key = $1, created_at = NOW() WHERE role = 'anon'", ANON_KEY)
        await conn.execute("UPDATE _wowsql_api_keys SET key = $1, created_at = NOW() WHERE role = 'service_role'", SERVICE_ROLE_KEY)
    return {
        "success": True,
        "anon_key": ANON_KEY,
        "service_role_key": SERVICE_ROLE_KEY,
        "message": "API keys regenerated. Update your client applications with the new keys."
    }


# ── Realtime Endpoints ────────────────────────────────────────────────────────

@app.get("/api/v1/realtime/tables")
async def get_realtime_tables(request: Request):
    _get_current_user(request)
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS public._wowsql_realtime_tables (
                schema_name TEXT NOT NULL DEFAULT 'public',
                table_name TEXT NOT NULL,
                enabled_at TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (schema_name, table_name)
            )
        """)
        rows = await conn.fetch("SELECT schema_name, table_name FROM _wowsql_realtime_tables")
        return {"tables": [{"schema": r["schema_name"], "table": r["table_name"]} for r in rows]}


@app.get("/api/v1/realtime/stats")
async def get_realtime_stats(request: Request):
    _get_current_user(request)
    async with pool.acquire() as conn:
        count = await conn.fetchval("SELECT COUNT(*) FROM _wowsql_realtime_tables") or 0
        return {"enabled_tables": count, "active_connections": 0, "messages_per_second": 0}


@app.post("/api/v1/realtime/enable")
async def enable_realtime(request: Request, schema: str = "public", table: str = ""):
    _get_current_user(request)
    if not table:
        raise HTTPException(status_code=400, detail="Table name is required")
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO _wowsql_realtime_tables (schema_name, table_name)
            VALUES ($1, $2) ON CONFLICT DO NOTHING
        """, schema, table)
        await conn.execute(f'ALTER TABLE "{schema}"."{table}" REPLICA IDENTITY FULL')
    return {"success": True, "message": f"Realtime enabled for {schema}.{table}"}


@app.post("/api/v1/realtime/disable")
async def disable_realtime(request: Request, schema: str = "public", table: str = ""):
    _get_current_user(request)
    if not table:
        raise HTTPException(status_code=400, detail="Table name is required")
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM _wowsql_realtime_tables WHERE schema_name = $1 AND table_name = $2",
            schema, table
        )
    return {"success": True, "message": f"Realtime disabled for {schema}.{table}"}


# ── Auth Config & Status Endpoints ────────────────────────────────────────────

@app.get("/api/v1/projects/{slug}/auth/status")
async def get_auth_status(slug: str, request: Request):
    _get_current_user(request)
    async with pool.acquire() as conn:
        exists = await conn.fetchval("""
            SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'config')
        """)
        if not exists:
            return {"enabled": False}
        row = await conn.fetchrow("SELECT enable_signup FROM auth.config WHERE project_id = 'default'")
        return {"enabled": row is not None}


@app.get("/api/v1/projects/{slug}/auth/config")
async def get_auth_config(slug: str, request: Request):
    _get_current_user(request)
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT enable_signup, email_password_enabled, email_confirmation_required,
                   jwt_expiry_hours, refresh_token_expiry_days, site_url, auth_service_name
            FROM auth.config WHERE project_id = 'default'
        """)
        if not row:
            return {
                "enable_signup": True,
                "email_password_enabled": True,
                "email_confirmation_required": False,
                "jwt_expiry_hours": 24,
                "refresh_token_expiry_days": 7,
                "site_url": "http://localhost:8080",
                "auth_service_name": "WoWSQL Auth",
                "redirect_urls": "",
            }
        return {
            "enable_signup": row["enable_signup"],
            "email_password_enabled": row["email_password_enabled"],
            "email_confirmation_required": row["email_confirmation_required"],
            "jwt_expiry_hours": row["jwt_expiry_hours"],
            "refresh_token_expiry_days": row["refresh_token_expiry_days"],
            "site_url": row["site_url"] or "http://localhost:8080",
            "auth_service_name": row["auth_service_name"] or "WoWSQL Auth",
            "redirect_urls": "",
        }


@app.put("/api/v1/projects/{slug}/auth/config")
async def update_auth_config(slug: str, request: Request, body: dict = {}):
    _get_current_user(request)
    async with pool.acquire() as conn:
        await conn.execute("""
            UPDATE auth.config SET
                enable_signup = COALESCE($1, enable_signup),
                email_password_enabled = COALESCE($2, email_password_enabled),
                email_confirmation_required = COALESCE($3, email_confirmation_required),
                jwt_expiry_hours = COALESCE($4, jwt_expiry_hours),
                refresh_token_expiry_days = COALESCE($5, refresh_token_expiry_days),
                site_url = COALESCE($6, site_url),
                auth_service_name = COALESCE($7, auth_service_name),
                updated_at = NOW()
            WHERE project_id = 'default'
        """,
            body.get("enable_signup"),
            body.get("email_password_enabled"),
            body.get("email_confirmation_required"),
            body.get("jwt_expiry_hours"),
            body.get("refresh_token_expiry_days"),
            body.get("site_url"),
            body.get("auth_service_name"),
        )
    return {"success": True}


@app.get("/api/v1/projects/{slug}/auth/providers")
async def get_auth_providers(slug: str, request: Request):
    _get_current_user(request)
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT email_password_enabled, anonymous_enabled,
                   google_enabled, google_client_id, google_client_secret,
                   github_enabled, github_client_id, github_client_secret
            FROM auth.config WHERE project_id = 'default'
        """)
        if not row:
            return {
                "email_enabled": True, "anonymous_enabled": False,
                "google_enabled": False, "google_client_id": "", "google_client_secret": "",
                "github_enabled": False, "github_client_id": "", "github_client_secret": "",
            }
        return {
            "email_enabled": row["email_password_enabled"],
            "anonymous_enabled": row["anonymous_enabled"] or False,
            "google_enabled": row["google_enabled"] or False,
            "google_client_id": row["google_client_id"] or "",
            "google_client_secret": row["google_client_secret"] or "",
            "github_enabled": row["github_enabled"] or False,
            "github_client_id": row["github_client_id"] or "",
            "github_client_secret": row["github_client_secret"] or "",
        }


@app.put("/api/v1/projects/{slug}/auth/providers")
async def update_auth_providers(slug: str, request: Request, body: dict = {}):
    _get_current_user(request)
    async with pool.acquire() as conn:
        updates = []
        params = []
        idx = 1
        field_map = {
            "email_enabled": "email_password_enabled",
            "anonymous_enabled": "anonymous_enabled",
            "google_enabled": "google_enabled",
            "google_client_id": "google_client_id",
            "google_client_secret": "google_client_secret",
            "github_enabled": "github_enabled",
            "github_client_id": "github_client_id",
            "github_client_secret": "github_client_secret",
        }
        for body_key, col_name in field_map.items():
            if body_key in body:
                updates.append(f"{col_name} = ${idx}")
                params.append(body[body_key])
                idx += 1
        if updates:
            params.append("default")
            query = f"UPDATE auth.config SET {', '.join(updates)}, updated_at = NOW() WHERE project_id = ${idx}"
            await conn.execute(query, *params)
    return {"success": True}


@app.get("/api/v1/projects/{slug}/auth/audit-logs")
async def get_auth_audit_logs(slug: str, request: Request, limit: int = 50):
    _get_current_user(request)
    async with pool.acquire() as conn:
        exists = await conn.fetchval("""
            SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'audit_logs')
        """)
        if not exists:
            return {"logs": []}
        rows = await conn.fetch("""
            SELECT id, user_id, event_type, event_status, ip_address, created_at
            FROM auth.audit_logs WHERE project_id = 'default'
            ORDER BY created_at DESC LIMIT $1
        """, limit)
        return {"logs": [
            {
                "id": str(r["id"]),
                "user_id": str(r["user_id"]) if r["user_id"] else None,
                "event_type": r["event_type"],
                "event_status": r["event_status"] or "success",
                "ip_address": r["ip_address"],
                "created_at": str(r["created_at"]),
            }
            for r in rows
        ]}


