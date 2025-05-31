-- Drop existing policies
drop policy if exists "Staff can view their own profile" on public.staff;
drop policy if exists "Staff can update their own profile" on public.staff;
drop policy if exists "Allow username check for login" on public.staff;
drop policy if exists "Allow email check for password reset" on public.staff;
drop policy if exists "Staff can view their own profile by username" on public.staff;
drop policy if exists "Staff can update their own profile by username" on public.staff;

-- Create new policies
-- Allow anyone to check username/email for login/password reset
create policy "Allow staff lookup for auth"
    on public.staff for select
    using (true);

-- Allow staff to update their own profile
create policy "Allow staff to update own profile"
    on public.staff for update
    using (auth.uid() = id); 