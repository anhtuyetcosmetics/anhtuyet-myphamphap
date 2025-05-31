-- Add policy to allow checking email existence in staff table
create policy "Allow email check for password reset"
    on public.staff for select
    using (true)
    with check (false); 