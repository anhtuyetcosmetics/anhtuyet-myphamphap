-- Add policy to allow checking username existence in staff table
create policy "Allow username check for login"
    on public.staff for select
    using (true)
    with check (false); 