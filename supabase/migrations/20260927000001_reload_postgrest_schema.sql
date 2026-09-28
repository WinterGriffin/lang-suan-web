-- Make newly introduced MVP 1.6 RPC signatures immediately visible through
-- Supabase's PostgREST API after the additive schema migration.
notify pgrst, 'reload schema';
