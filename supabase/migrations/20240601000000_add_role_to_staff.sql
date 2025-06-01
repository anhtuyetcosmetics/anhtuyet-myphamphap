-- Thêm cột role vào bảng staff
alter table public.staff add column if not exists role text not null default 'user';

-- Cập nhật user 'Tho' thành admin (dựa vào email hoặc username)
update public.staff set role = 'admin' where username ilike 'tho' or email ilike 'tho@myphamphap.com';

-- Thêm cột giam_gia_loai
ALTER TABLE sales
ADD COLUMN giam_gia_loai text CHECK (giam_gia_loai IN ('percentage', 'fixed'));

-- Thêm cột giam_gia_gia_tri
ALTER TABLE sales
ADD COLUMN giam_gia_gia_tri numeric;

-- Thêm cột giam_gia_so_tien
ALTER TABLE sales
ADD COLUMN giam_gia_so_tien numeric;

-- Thêm cột thanh_tien
ALTER TABLE sales
ADD COLUMN thanh_tien numeric NOT NULL DEFAULT 0;

-- Thêm các cột mới cho tính năng giảm giá
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS giam_gia_loai text CHECK (giam_gia_loai IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS giam_gia_gia_tri numeric,
ADD COLUMN IF NOT EXISTS giam_gia_so_tien numeric,
ADD COLUMN IF NOT EXISTS thanh_tien numeric NOT NULL DEFAULT 0;

-- Cập nhật giá trị thanh_tien cho các đơn hàng cũ
UPDATE sales
SET thanh_tien = tong_tien
WHERE thanh_tien = 0; 