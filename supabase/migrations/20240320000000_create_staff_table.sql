-- Create staff table
create table if not exists public.staff (
    id uuid references auth.users on delete cascade not null primary key,
    email text not null,
    ten_nhan_vien text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.staff enable row level security;

-- Create policies
create policy "Staff can view their own profile"
    on public.staff for select
    using (auth.uid() = id);

create policy "Staff can update their own profile"
    on public.staff for update
    using (auth.uid() = id);

-- Create function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.staff (id, email, ten_nhan_vien)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'ten_nhan_vien', new.email)
    );
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user(); 