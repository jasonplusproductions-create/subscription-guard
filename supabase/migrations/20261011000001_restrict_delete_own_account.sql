-- Security advisor fix: delete_own_account() is SECURITY DEFINER and must
-- only be callable by signed-in users, never the anon role.
-- Apply with: supabase db push
revoke execute on function public.delete_own_account() from public;
revoke execute on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;
