-- Insert default admin user
insert into auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) values (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'tho@myphamphap.com',
    crypt('123456', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"ten_nhan_vien":"Tho"}',
    false,
    'authenticated'
);

-- Insert admin staff profile
insert into public.staff (
    id,
    email,
    ten_nhan_vien,
    created_at,
    updated_at
) values (
    '00000000-0000-0000-0000-000000000000',
    'tho@myphamphap.com',
    'Tho',
    now(),
    now()
);

-- Create admin role and grant permissions
create role admin;
grant usage on schema public to admin;
grant all on all tables in schema public to admin;
grant all on all sequences in schema public to admin;

-- Grant admin role to the default admin user
grant admin to authenticated; 