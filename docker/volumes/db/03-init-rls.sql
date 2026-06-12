-- WoWSQL Self-Hosted: RLS Helper Functions
-- These functions let you write Row Level Security policies easily
--
-- Example RLS policy using these helpers:
--   CREATE POLICY "Users can read own data"
--     ON public.profiles FOR SELECT
--     USING (user_id = auth.uid());

-- auth.uid() — returns the current user's UUID from the JWT
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claim.sub', true),
    ''
  )::UUID;
$$ LANGUAGE SQL STABLE;

-- auth.role() — returns the current role (anon, authenticated, service_role)
CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    'anon'
  );
$$ LANGUAGE SQL STABLE;

-- auth.jwt() — returns the full JWT claims as JSONB
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS JSONB AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true),
    '{}'
  )::JSONB;
$$ LANGUAGE SQL STABLE;

-- ══════════════════════════════════════════════════════════
-- EXAMPLE: Sample "todos" table with RLS enabled
-- ══════════════════════════════════════════════════════════
-- This demonstrates how RLS works with WoWSQL roles.
-- Delete this section if you don't need it.

CREATE TABLE IF NOT EXISTS public.todos (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    completed   BOOLEAN NOT NULL DEFAULT FALSE,
    user_id     UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Anyone can read todos
CREATE POLICY "Public read access" ON public.todos
    FOR SELECT TO anon USING (true);

-- Authenticated users can read their own + unassigned todos
CREATE POLICY "Authenticated read own" ON public.todos
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Authenticated users can create todos
CREATE POLICY "Authenticated insert" ON public.todos
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Authenticated users can update their own todos
CREATE POLICY "Authenticated update own" ON public.todos
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Authenticated users can delete their own todos
CREATE POLICY "Authenticated delete own" ON public.todos
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

DO $$ BEGIN RAISE NOTICE 'WoWSQL: RLS helpers and example table ready'; END $$;
