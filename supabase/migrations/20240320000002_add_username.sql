-- Add username column to staff table
alter table public.staff add column username text unique;

-- Update admin user with username
update public.staff set username = 'tho' where email = 'tho@myphamphap.com';

-- Make username required
alter table public.staff alter column username set not null;

-- Update RLS policies to include username
create policy "Staff can view their own profile by username"
    on public.staff for select
    using (auth.uid() = id);

create policy "Staff can update their own profile by username"
    on public.staff for update
    using (auth.uid() = id);

-- Update the handle_new_user function to include username
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.staff (id, email, ten_nhan_vien, username)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'ten_nhan_vien', new.email),
        coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
    );
    return new;
end;
$$ language plpgsql security definer; 