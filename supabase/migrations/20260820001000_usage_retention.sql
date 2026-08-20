create extension if not exists pg_cron with schema pg_catalog;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'gear-x-usage-retention') then
    perform cron.schedule(
      'gear-x-usage-retention',
      '17 3 * * *',
      'select public.delete_expired_gear_x_backend_usage()'
    );
  end if;
end;
$$;

