-- Teacher Space - Phase B hardening follow-up.
--
-- The security advisor run after 0005_community.sql surfaced two findings,
-- both closed here. Neither changes any RLS policy or app-visible
-- behavior - RLS was already correctly blocking anon on every
-- community_* table (verified: `set local role anon; select count(*)
-- from community_posts` returned 0). This tightens the privilege grants
-- themselves so guests have zero standing access, not just an RLS denial,
-- and removes the anon/authenticated PostgREST RPC exposure of the
-- internal trigger functions.
--
-- 1. New tables in this project inherit broad default privileges
--    (SELECT/INSERT/UPDATE/DELETE) for `anon`, same as the pre-existing
--    `profiles` table. Per the explicit requirement that guests must not
--    be able to browse Teacher Space at all, revoke every privilege from
--    `anon` on all 7 community_* tables outright.
revoke all on public.community_profiles from anon;
revoke all on public.community_posts from anon;
revoke all on public.community_likes from anon;
revoke all on public.community_saves from anon;
revoke all on public.community_comments from anon;
revoke all on public.community_follows from anon;
revoke all on public.community_reports from anon;

-- 2. The 5 counter-sync trigger functions are SECURITY DEFINER and, by
--    Postgres default, EXECUTE is granted to PUBLIC. They are only ever
--    meant to run as AFTER INSERT/DELETE triggers (trigger firing does not
--    require EXECUTE privilege on the trigger function for the invoking
--    role), so revoke direct EXECUTE from anon/authenticated/public,
--    mirroring how public.is_admin() is already locked down.
revoke all on function public.community_likes_count_sync() from public, anon, authenticated;
revoke all on function public.community_saves_count_sync() from public, anon, authenticated;
revoke all on function public.community_comments_count_sync() from public, anon, authenticated;
revoke all on function public.community_posts_count_sync() from public, anon, authenticated;
revoke all on function public.community_follows_count_sync() from public, anon, authenticated;
