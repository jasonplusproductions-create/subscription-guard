-- Account self-deletion RPC (Day 6)
-- Deletes auth.users row; cascades to profiles, subscriptions, etc. per FK setup.
-- TODO(human): Verify cascade behavior matches expectations before shipping.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
