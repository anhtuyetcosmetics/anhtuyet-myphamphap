-- Thêm cột role vào bảng staff
alter table public.staff add column if not exists role text not null default 'user';

-- Cập nhật user 'Tho' thành admin (dựa vào email hoặc username)
update public.staff set role = 'admin' where username ilike 'tho' or email ilike 'tho@myphamphap.com'; 