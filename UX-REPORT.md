# Báo cáo phân tích UX/UI — Ánh Tuyết Cosmetics

**Người dùng chính:** Chị chủ cửa hàng — dùng hằng ngày để bán hàng và quản lý
**Thiết bị:** Điện thoại + máy tính (PWA / Capacitor)
**Tác vụ ưu tiên cao nhất:** Bán hàng / lập đơn
**Pain points đã ghi nhận:** Thỉnh thoảng màn hình trắng phải đóng-mở app · Hiển thị chưa tối ưu

Báo cáo này được tổ chức theo mức độ ưu tiên: **P0** (chặn công việc / mất dữ liệu), **P1** (gây khó chịu hằng ngày), **P2** (nhỏ nhưng nên sửa). Mỗi mục có file:line cụ thể để khi sửa không cần dò lại.

---

## A. P0 — Vấn đề chặn công việc, gây mất dữ liệu hoặc trắng màn hình

### A1. Toàn bộ app KHÔNG có Error Boundary → bất kỳ lỗi nhỏ trong 1 component cũng làm trắng màn hình toàn bộ

**File:** `src/App.tsx` (dòng 31–63), `src/main.tsx`

App đang dùng `<StrictMode>` → `<QueryClientProvider>` → `<AuthProvider>` → ... mà không có một `<ErrorBoundary>` nào ở bất kỳ tầng nào. Khi một component con throw (ví dụ `sale.tong_tien.toLocaleString()` mà `tong_tien` là `null`, hoặc `new Date(null)` rồi `.getDay()`), React sẽ unmount toàn bộ cây component và để lại trang trắng. Đây gần như chắc chắn là nguyên nhân chị nhà phải "đóng và mở lại app".

**Đề xuất:**
- Bọc `<Index />` bằng `<ErrorBoundary>` riêng, có UI fallback bằng tiếng Việt: "Đã xảy ra lỗi — bấm Tải lại". Nút "Tải lại" gọi `window.location.reload()`.
- Bọc thêm `<ErrorBoundary>` cấp nhỏ hơn quanh từng module (Sales, Dashboard, Inventory, Customers, Analytics) để khi một tab lỗi thì chỉ tab đó hỏng, các tab khác vẫn dùng được.
- Trong fallback, log lỗi qua `console.error` kèm `componentStack` để sau này điều tra.

**Lý do quan trọng:** Đây là cách rẻ nhất để loại bỏ 90% trường hợp trắng màn hình. Cần làm trước tiên.

---

### A2. PWA `autoUpdate` + cache `NetworkFirst` cho Supabase = nguy cơ trắng màn hình sau khi deploy bản mới

**File:** `vite.config.ts` (dòng 24, 75–122)

`registerType: 'autoUpdate'` khiến service worker tự động cập nhật bản mới nền sau, nhưng các tab đang mở vẫn chạy bản cũ. Nếu bản mới đổi tên file JS chunk, browser lấy cache HTML cũ trỏ tới chunk JS không còn tồn tại → trắng màn hình.

Đồng thời `PWAStatus.tsx` chỉ hiển thị toast "New Version Available" — bằng tiếng Anh và dễ bị bỏ qua.

**Đề xuất:**
1. Đổi `registerType` thành `'prompt'`, hoặc giữ `autoUpdate` nhưng force reload toàn bộ tab khi có bản mới: trong `usePWA.ts`, sau khi `updateServiceWorker(true)` resolve thì `window.location.reload()`.
2. Sửa `PWAStatus.tsx` (dòng 32) sang tiếng Việt: "Có phiên bản mới — Bấm để cập nhật ngay" với nút lớn dễ thấy.
3. Khi bắt được lỗi `ChunkLoadError` trong Error Boundary, tự động reload trang một lần.
4. Thêm meta tag `<meta http-equiv="cache-control" content="no-cache">` cho `index.html` để bản HTML luôn fresh.

---

### A3. Console.log lộ thông tin nhạy cảm + log SQL query trong production

**File:** `src/lib/auth-context.tsx` (dòng 43, 50, 56–60, 73, 81–85, 88–98, 108, 121, 130, 139, 146)

Toàn bộ luồng đăng nhập đang log username, email, dữ liệu staff, thậm chí log **chuỗi SQL** (dòng 84, 97, 124). Đây vừa là rò rỉ thông tin (mở DevTools là thấy hết), vừa làm chậm app, vừa là dấu hiệu code chưa "production-ready".

**Đề xuất:**
- Xoá toàn bộ `console.log` trong nhánh production. Có thể bọc bằng helper `debugLog()` chỉ chạy khi `import.meta.env.DEV`.
- Tương tự cho `useProducts.ts` (dòng 47, 50) và `useSales.ts` (dòng 59, 79, 102): gỡ console.log dữ liệu.

---

### A4. Tạo đơn → tạo `inventory_transactions` không có error handling, dễ tạo đơn mà không trừ kho

**File:** `src/hooks/useSales.ts` (dòng 107–115)

Sau khi `insert sale_items` thành công, code chạy thêm `supabase.from('inventory_transactions').insert(...)` **không await error check**. Nếu insert kho fail (RLS, constraint, mất mạng...), `useAddSaleItem` vẫn báo thành công → đơn hàng đã có nhưng tồn kho không trừ. Sau vài tuần con số tồn kho lệch hẳn so với thực tế.

**Đề xuất:**
- Lý tưởng: viết một stored procedure / RPC trên Supabase tạo cả `sale`, `sale_items`, `inventory_transactions` trong một transaction.
- Tạm thời (chi phí thấp): đổi thành `const { error: invError } = await supabase.from(...).insert(...)`. Nếu lỗi, throw để mutation fail và toast hiện "Lỗi cập nhật kho — đơn chưa được lưu hoàn chỉnh". Có thể kèm gọi rollback xóa sale_items vừa tạo.

---

### A5. Lưu trạng thái đơn hàng = mutate trực tiếp object trong cache React Query

**File:** `src/components/SaleDetailDialog.tsx` (dòng 54)

```
if (sale) sale.trang_thai = status;
```

Đây là mutate object đang nằm trong cache của React Query. Hành vi không xác định — có thể vẫn hiển thị đúng, có thể không hiển thị được (vì React không thấy reference đổi → không re-render). Trong nhiều case còn gây "phantom data" lúc cache invalidate.

Ngoài ra cập nhật xong xong cũng không gọi `queryClient.invalidateQueries(['sales'])`, nên list ngoài Sales.tsx vẫn hiển thị trạng thái cũ tới khi reload.

**Đề xuất:** Dùng mutation:
```ts
const updateStatus = useMutation({
  mutationFn: ({id, trang_thai}) => supabase.from('sales').update({trang_thai}).eq('id', id),
  onSuccess: () => queryClient.invalidateQueries({queryKey: ['sales']}),
});
```
Bỏ dòng `sale.trang_thai = status`.

---

### A6. `useSales` SELECT * có thể quá nặng khi nhiều đơn hàng — gây lag và crash trên mobile

**File:** `src/hooks/useSales.ts` (dòng 42–66)

Query đang fetch **toàn bộ** sales, kèm nested customers + sale_items + products. Sau 6 tháng bán hàng có thể vài nghìn đơn → payload vài MB → JSON.parse chậm → mobile out-of-memory → trắng màn hình.

**Đề xuất:**
- Thêm `.range(0, 49)` hoặc `.limit(50)` mặc định, pagination phía client (ví dụ "Tải thêm 50 đơn" hoặc lọc theo ngày).
- Tab Sales chỉ cần list tóm tắt; chi tiết items lazy load khi user mở SaleDetailDialog (gọi 1 query riêng `sale_items` theo `sale_id`).
- Dashboard tính tổng doanh thu nên dùng RPC `select sum(thanh_tien) from sales where trang_thai != 'cancelled'` thay vì fetch hết về client để cộng.

---

### A7. `useProducts` fetch toàn bộ sản phẩm, sort phía client, concat O(n²)

**File:** `src/hooks/useProducts.ts` (dòng 21–55)

Loop `while (hasMore)` và mỗi vòng `allProducts = [...allProducts, ...data]` là O(n²) — với 4000 sản phẩm tốn 8 triệu phép copy. `pageSize: 2000` cũng nghĩa là một query duy nhất trả 2000 row, dễ time-out trên 3G/4G yếu.

**Đề xuất ngắn hạn:** đổi thành `allProducts.push(...data)` để là O(n).

**Đề xuất dài hạn:** Không fetch toàn bộ. Thay bằng:
- Search server-side: nhập từ khóa → debounce → query Supabase với `.ilike('ten_hang', '%kw%')` + `.limit(50)`. ProductSearchDialog (luồng bán hàng) cần đổi theo cách này — hiện tại nó cũng fetch toàn bộ và filter client.
- Sort tên trên server: thêm cột `ten_hang_normalized` + index, hoặc dùng `order('ten_hang')` trong Postgres.

Đây cũng là một nguyên nhân tiềm tàng của trắng màn hình trên điện thoại cũ.

---

## B. P1 — Vấn đề UX gây khó chịu hằng ngày, đặc biệt luồng bán hàng

Luồng bán hàng (`Sales.tsx` + `CreateSaleDialog.tsx` + `ProductSearchDialog.tsx`) là việc chị nhà làm nhiều nhất. Em đánh giá luồng hiện tại đã làm khá tốt (có quét mã vạch, có giảm giá, có sticky footer tổng tiền) nhưng vẫn có nhiều điểm tinh chỉnh được.

### B1. ProductSearchDialog tìm sản phẩm còn rất đơn giản, thiếu thông tin quyết định

**File:** `src/components/ProductSearchDialog.tsx`

- **Dòng 76 — Không virtualize danh sách.** Nếu cửa hàng có 2000+ sản phẩm và search rỗng, dialog render hết 2000 div → kéo scroll giật. Nên dùng `react-window` hoặc giới hạn `slice(0, 50)` khi không có search.
- **Dòng 89–95 — Mỗi item chỉ hiển thị tên / mã / giá.** Không thấy **tồn kho** → bán xong mới biết hết hàng. Đề xuất hiện thêm: tồn kho (badge "Còn 5"/"Hết hàng" giống ProductCard), nhóm hàng, optionally hình thumbnail.
- **Dòng 86 — `onClick` không có "Thêm" / "Xem", chỉ click cả ô.** OK với mobile, nhưng trên desktop nên có nút "+ Thêm" rõ ràng để hover thấy.
- **Không hỗ trợ phím Enter để chọn item đầu tiên.** Hiện tại gõ xong vẫn phải click. Cải thiện: arrow up/down chọn item, Enter để Thêm — rất quan trọng cho desktop bán hàng nhanh.
- **Không hỗ trợ "thêm liên tiếp".** Mỗi lần chọn 1 sản phẩm dialog đóng (dòng 57). Khi bán 1 đơn 5 món, chị nhà phải mở dialog 5 lần, gõ search 5 lần. Đề xuất: thêm checkbox "Giữ dialog mở để chọn nhiều món" hoặc đơn giản là **không tự đóng** sau khi thêm — user tự đóng khi xong.
- **Không filter theo nhóm hàng.** Cửa hàng mỹ phẩm có nhiều dòng (skincare, makeup, nước hoa...) — thêm tab nhóm hàng phía trên ô search sẽ rút ngắn rất nhiều thao tác.

### B2. CreateSaleDialog — số lượng và giá khó nhập trên điện thoại

**File:** `src/components/CreateSaleDialog.tsx`

- **Dòng 291–300 (input số lượng).** `<input type="number">` tự nhiên cho phép gõ số âm + dấu phẩy + e+10. `min={1}` bị nhiều browser trên mobile bỏ qua. Trên iOS, `type="number"` còn không có nút "Done" trên numeric keypad. Đề xuất: dùng `inputMode="numeric"` + `pattern="[0-9]*"` thay cho `type="number"`, validate manual.
- **Dòng 313–322 (giá bán).** Mỗi line item lại có ô input giá → dễ bấm nhầm khi cuộn. Nhu cầu sửa giá tại điểm bán không nhiều — đề xuất: ẩn ô giá mặc định, chỉ hiện khi tap vào "Sửa giá" (tránh tai nạn).
- **Dòng 252–334 — line item chiếm nhiều chiều cao.** Mỗi món ~96px (tên 2 dòng + mã + qty + giá + thành tiền). Đơn 8 món thì cuộn lên cuộn xuống mệt. Đề xuất: thu gọn item — 1 dòng tên + qty stepper + thành tiền cùng hàng; tap vào để bung sửa giá / xóa.
- **Dòng 273–277 (nút Trash xoá item).** Chỉ là icon nhỏ, dễ bấm nhầm. Đề xuất: vuốt sang trái để xoá (như Mail iOS) hoặc nút lớn hơn 44px.
- **Dòng 271–274 — Bấm Trash không có confirm.** Nếu chị nhà bấm nhầm, cả line item biến mất. Nên có toast "Đã xoá X — Hoàn tác" với nút Hoàn tác trong 5 giây (Sonner toast hỗ trợ sẵn).
- **Dòng 338–346 — "Thêm khách hàng, giảm giá, ghi chú…" mặc định ẩn.** Bán cho khách quen thì cần chọn khách rất thường xuyên. Nên đưa ô chọn khách hàng lên trên (cạnh nút Quét mã vạch / Tìm sản phẩm), không ẩn đi.
- **Dòng 447–469 — Không có bước xác nhận trước khi tạo đơn.** Bấm "Tạo đơn hàng" là tạo luôn. Nếu lỡ tay tạo đơn sai trạng thái thì phải vào sửa lại. Đề xuất: nếu trạng thái = "Hoàn thành" (đã thanh toán) thì hiện confirm "Tạo đơn X ₫?" với 2 nút.
- **Sau khi tạo đơn xong, không in hoá đơn ngay.** Dòng 190–193 toast "Thành công" rồi đóng dialog. Luồng tự nhiên hơn: hiện màn hình "Đơn hàng đã tạo — In hoá đơn / Đơn mới / Đóng". Tránh việc chị nhà phải tìm đơn vừa tạo trong list để in.
- **Không tính tiền khách đưa / tiền thừa.** Một thanh toán tiền mặt rất hay cần. Đề xuất ô "Khách đưa" → tự tính "Tiền thừa".

### B3. Sales list (`Sales.tsx`) — thiếu lọc, thiếu pagination, mobile chưa tối ưu

**File:** `src/components/Sales.tsx`

- **Dòng 138–219 — Render TẤT CẢ đơn hàng.** Tương tự useSales fetch hết, không pagination → 500 đơn đã bắt đầu lag.
- **Dòng 104–107 — Search chỉ tìm theo `ma_don_hang` và `ten_khach_hang`.** Không tìm theo ngày, theo trạng thái, theo sản phẩm → khó tra cứu. Đề xuất thêm filter: ngày (date range picker), trạng thái (chip pending/completed/cancelled), khoảng tiền.
- **Dòng 138 — `grid-cols-1 lg:grid-cols-2`.** Trên iPad ngang vẫn chỉ 2 cột; trên desktop rộng cũng 2 cột. Có thể tận dụng `xl:grid-cols-3`. Trên mobile, card hơi cao do nhiều thông tin (3 sản phẩm + ghi chú + 2 nút) → nên thu gọn thành "list compact" với 1 hàng tóm tắt + bấm để xem chi tiết.
- **Dòng 197–205 (nút "Chi tiết" / "In hoá đơn" cùng cấp).** Trong tab Sales thì OK, nhưng SaleDetailDialog không có nút In → user phải back ra list rồi tìm đơn rồi bấm In. Đề xuất: Trong SaleDetailDialog cũng có nút "In hoá đơn".
- **Không có "Đơn hôm nay" / "Đơn tuần này" mặc định.** Khi chị nhà mở tab Bán hàng, 90% là muốn xem đơn hôm nay — không cần phải search. Đề xuất: filter mặc định "Hôm nay", có chip "Hôm nay / 7 ngày / 30 ngày / Tất cả".

### B4. SaleDetailDialog — trộn lẫn `<select>` native và `<Button>` shadcn

**File:** `src/components/SaleDetailDialog.tsx`

- **Dòng 148–157, 158–165** dùng `<select>` và `<button>` thuần CSS, không phải Radix. Style không khớp với phần còn lại → trông rời rạc.
- **Dòng 116** `grid grid-cols-2` không có `sm:grid-cols-1` → trên điện thoại nhỏ (iPhone SE), 2 cột chen chúc, tên khách bị cắt.
- **Dòng 147–168** — UI status update có 3 thành phần (select + Lưu + badge) chen trên 1 dòng → trên mobile xuống dòng vỡ layout.

**Đề xuất:** Thay `<select>` bằng `<Select>` của shadcn, `<button>` bằng `<Button>`. Đổi grid sang `sm:grid-cols-1 md:grid-cols-2`. Khối status update để riêng 1 hàng.

### B5. PrintInvoice — cứng width 8cm, không xử lý popup-blocked

**File:** `src/components/PrintInvoice.tsx`

- **Dòng 12 `window.open()` có thể trả `null`** nếu browser chặn popup. Code không check → `printWindow.document.write(...)` ném `Cannot read properties of null` → crash component.
- **Dòng 56 width 302px** — phù hợp giấy nhiệt 80mm. Nếu cửa hàng có lúc cần in A5/A4 (ví dụ in cho khách lấy về làm chứng từ), không có tuỳ chọn.
- **Dòng 20 `printWindow.close()` ngay sau `print()`** — trên một số browser, dialog in chưa kịp hiện thì window đã đóng. Đề xuất: `printWindow.onafterprint = () => printWindow.close()`.

### B6. BarcodeScanner — không timeout cho camera, có thể treo UI

**File:** `src/components/BarcodeScanner.tsx`

- Promise `video.onloadedmetadata` không có timeout. Nếu user từ chối quyền camera (hoặc OS chặn), promise treo → BarcodeScanner đè full màn hình mãi → user phải force quit. Đề xuất: race với `setTimeout(reject, 8000)` và hiện UI fallback "Không truy cập được camera, dùng nhập mã thủ công".
- Nút "Đóng" cần size tối thiểu 44x44px và đặt vị trí dễ với một tay (top-right hoặc top-left tuỳ thuận tay).

### B7. Tìm khách hàng (CustomerSearchSelect) chưa quick-add

**File:** `src/components/CustomerSearchSelect.tsx`

Khi gặp khách mới, phải đóng dialog đơn → vào tab Khách hàng → Thêm → quay lại tạo đơn = mất khoảng 8 thao tác. Đề xuất: ngay trong CustomerSearchSelect, khi search không ra kết quả, hiện "+ Thêm khách hàng mới «<từ khóa vừa gõ>»" → mở dialog tạo nhanh (chỉ tên + SĐT) → tạo xong tự chọn vào đơn.

---

## C. P1 — Tab khác (Dashboard, Inventory, Customers, Products, Analytics)

### C1. Dashboard — biểu đồ "Doanh số theo tuần" KHÔNG đúng tuần, mà gộp tất cả thời gian

**File:** `src/components/Dashboard.tsx` (dòng 39–49, 52–62)

`reduce` chỉ group theo `getDay()` (CN/T2…T7), không chú ý đến tuần nào. Đơn của T2 tuần này, T2 tuần trước, T2 năm ngoái — đều cộng vào cùng 1 cột "T2". Tương tự `revenueData` group theo `getMonth()` không có năm → T1/2024 + T1/2025 + T1/2026 cộng cùng cột "T1".

Hậu quả: chị nhà nhìn biểu đồ thấy "T2 doanh thu 50tr" nhưng thực tế là tổng dồn nhiều năm.

**Đề xuất:**
- "Doanh số theo tuần": chỉ lấy đơn trong **7 ngày gần nhất**, group theo từng ngày trong khoảng đó.
- "Xu hướng doanh thu": chỉ lấy đơn trong **12 tháng gần nhất**, group theo `YYYY-MM`.
- Lý tưởng: filter `ngay_ban` trên server (khi paginate sales) thay vì lọc client.

### C2. Dashboard — "Hoạt động gần đây" hiển thị "X phút trước" cho đơn cách đây nhiều ngày

**File:** `src/components/Dashboard.tsx` (dòng 68)

`Math.floor((Date.now() - date) / (1000 * 60))` luôn đổi ra phút → đơn 3 ngày trước hiển thị "4320 phút trước". Đề xuất: dùng `formatDistanceToNow` của `date-fns` (đã cài sẵn trong package.json) với `locale: vi` → "3 ngày trước".

### C3. Dashboard — `new Date(sale.ngay_ban)` nhưng `ngay_ban` có thể null

**File:** `src/components/Dashboard.tsx` (dòng 40, 53), `useSales.ts` interface dòng 8

Type cho phép null. Khi null, `new Date(null)` = `1970-01-01` → đơn trở thành "T5 1970" hoặc "phút trước = một số tỷ phút". Không crash nhưng sai. Đề xuất: filter bỏ những sale không có `ngay_ban` trước khi reduce.

### C4. Dashboard — chờ tất cả 4 query xong mới render bất cứ thứ gì

**File:** `src/components/Dashboard.tsx` (dòng 24, 72–78)

`isLoading = salesLoading || productsLoading || customersLoading || inventoryLoading` → nếu 1 trong 4 chậm, dashboard trắng đến khi hết. Trên 3G điều này có thể 8–15 giây.

**Đề xuất:** mỗi card tự kiểm tra query của riêng nó và hiện skeleton riêng. Card "Tổng doanh thu" load trước thì hiện trước, không chờ inventory.

### C5. ProductCard — nút "Thống kê" là dead button, nút "Xoá" không có confirm

**File:** `src/components/ProductCard.tsx` (dòng 73–76, 77–84)

- Dòng 73: `<Button>Thống kê</Button>` không có `onClick`. Bấm vào không xảy ra gì → user nghĩ app lỗi.
- Dòng 77–84: nút Trash xoá ngay, không AlertDialog confirm. Lỡ tay = mất sản phẩm khỏi catalog.

**Đề xuất:** xoá nút "Thống kê" (hoặc implement chức năng), thêm `<AlertDialog>` confirm cho xoá.

### C6. ProductCard — "N/A ₫" trông kỳ

**File:** `src/components/ProductCard.tsx` (dòng 53–55)

```jsx
{product.gia_ban?.toLocaleString('vi-VN') || 'N/A'} ₫
```
Khi `gia_ban` null → hiện "N/A ₫". Đề xuất: nếu null thì hiện chỉ "Chưa có giá" (không có ký hiệu ₫), và badge cảnh báo "Chưa có giá".

### C7. Toast PWA bằng tiếng Anh giữa app tiếng Việt

**File:** `src/components/PWAStatus.tsx` (dòng 13–16, 23–26, 32–33, 40)

"Offline Mode", "Ready for Offline", "New Version Available", "Update Now" — chị nhà có thể không hiểu. Dịch hết sang tiếng Việt.

### C8. Customers list — không có pagination cho khách (đã có) nhưng giới hạn cứng

**File:** `src/components/Customers.tsx` (dòng 87–104)

Pagination phía client OK. Nhưng vẫn fetch toàn bộ khách hàng về client. Cùng một lúc cải thiện: server-side pagination + search server-side.

---

## D. P2 — Đánh bóng / nhỏ nhưng nên sửa

### D1. Branding & màu sắc không nhất quán

- File `Sales.tsx` dòng 114 dùng class hard-code `bg-blue-600 hover:bg-blue-700`.
- File `CreateSaleDialog.tsx` dòng 230 lại dùng `bg-brand-gradient`.
- File `Inventory.tsx` dòng 107 lại `bg-blue-600`.
- Dashboard vừa có màu xanh (`text-blue-600`) vừa đỏ (`text-red-600`) chen lẫn không rõ ý nghĩa.

→ Thống nhất màu primary qua `bg-primary` / `bg-brand-gradient` (đã có trong `index.css`). Xanh dương = tích cực, đỏ = nguy hiểm/giảm giá. Bỏ các hard-code Tailwind color.

### D2. Touch target chưa đủ 44px ở nhiều nơi

- ProductCard nút "Sửa" / "Thống kê" / Trash: `size="sm"` → 32px cao. Trên mobile khó bấm chính xác.
- Sales list nút "Chi tiết" / "In hoá đơn": `size="sm"`.
- SaleDetailDialog nút "Lưu" status: `py-1` → ~28px.

→ Trên mobile nên dùng `size="default"` hoặc `h-11` (44px). Có thể tách 2 file: bản mobile + bản desktop hoặc dùng class responsive `h-9 md:h-8`.

### D3. Thiếu skeleton — chỉ có spinner

Sales/Inventory/Dashboard đều `Loader2 animate-spin` ở giữa màn hình. Chuyển sang skeleton (đã có `Skeleton` component) sẽ cảm giác load nhanh hơn nhiều.

### D4. Dialog focus trap & autofocus chưa nhất quán

- ProductSearchDialog có autofocus đúng (dòng 30–40).
- CreateSaleDialog tắt autofocus (dòng 207 `onOpenAutoFocus={(e) => e.preventDefault()}`) → trên desktop, mở dialog xong vẫn phải click "Quét mã vạch" hoặc "Tìm sản phẩm" thay vì tự nhảy vào ô search.
- SaleDetailDialog không có autofocus cho select trạng thái.

### D5. Empty states còn generic

- "Không tìm thấy đơn hàng — Thử điều chỉnh từ khóa tìm kiếm." → thiếu nút CTA "Tạo đơn hàng".
- "Chưa có hoạt động nào" trong Dashboard → không có CTA.
- ProductSearchDialog "Không tìm thấy sản phẩm" → nên có nút "Thêm sản phẩm mới '<từ khóa>'".

### D6. EditProductDialog reset form khi product prop đổi → user mất dữ liệu đã nhập

**File:** `src/components/EditProductDialog.tsx` (useEffect setValue khi product đổi)

Nếu user mở Edit, nhập một nửa, rồi list sản phẩm refetch (5 phút staleTime hoặc invalidate sau khi tạo đơn) → product object đổi reference → useEffect chạy → form bị reset. Đề xuất: chỉ setValue khi `product.id` đổi, không phải reference.

### D7. Form validate quá đơn giản

- Customer email không validate format (EditCustomerDialog).
- Customer SĐT không format (chấp nhận chữ).
- Product giá có thể âm.

→ Dùng `zod` (đã cài) cộng với `@hookform/resolvers` để validate strict.

### D8. Không có "Unsaved changes" warning khi đóng dialog

CreateSaleDialog có 5 món trong giỏ + ghi chú dài, lỡ tay bấm Cancel → mất hết. Nên có confirm "Bạn có chắc muốn huỷ đơn?".

### D9. Không có offline mode đúng nghĩa

Dù là PWA, hiện tại offline là không làm gì được vì mọi action đều gọi Supabase. Một số nhà bán mất sóng 4G vẫn cần bán hàng. Cải thiện dài hạn: dùng IndexedDB queue offline writes, sync khi có mạng. Việc này lớn — chỉ làm khi cần.

### D10. Không có quick action / floating action button

Trên mobile, để tạo đơn user phải vào tab Bán hàng (1 click) rồi bấm "Tạo đơn hàng" (1 click). Có thể thêm FAB (`+`) ở góc dưới phải mọi tab → tạo đơn ngay, đỡ 1 thao tác hằng ngày × hàng chục lần/ngày.

### D11. Inventory list không pagination, scroll vô hạn không có anchor

Khi danh sách giao dịch dài, scroll xuống đọc giữa rồi quay lên không nhớ vị trí. Pagination 50/trang sẽ giải quyết, hoặc grouping theo ngày (sticky header "Hôm nay" / "Hôm qua" / "21/04/2026").

### D12. Không có shortcut / quick search global

Trên desktop, một global search (Cmd+K → mở `Command` của shadcn — đã có sẵn dependency) tìm đơn / sản phẩm / khách → hữu ích cho cửa hàng có nhân viên thao tác trên máy.

---

## E. Tổng hợp ưu tiên sửa & ước lượng

Thứ tự đề xuất sửa theo ROI (giá trị/công sửa):

| # | Sửa | Mức | Công | Tác động |
|---|---|---|---|---|
| 1 | Thêm ErrorBoundary toàn app + theo tab (A1) | P0 | 2h | Loại 80% trắng màn hình |
| 2 | PWA prompt update + reload trên ChunkLoadError + Việt hoá toast (A2, C7) | P0 | 2h | Loại trắng màn hình sau deploy |
| 3 | Gỡ console.log auth + log SQL (A3) | P0 | 30m | Bảo mật + nhanh hơn |
| 4 | Sửa SaleDetailDialog dùng mutation + invalidate (A5) | P0 | 1h | Đồng bộ dữ liệu |
| 5 | useSales + useProducts thêm pagination / lazy / search server (A6, A7) | P0 | 4h | Chống lag khi data lớn |
| 6 | Inventory transaction error handling (A4) | P0 | 1h | Tồn kho khớp đơn |
| 7 | Dashboard fix biểu đồ tuần/tháng (C1, C2, C3) | P1 | 2h | Biểu đồ đúng = quyết định đúng |
| 8 | CreateSaleDialog: chọn nhiều món không đóng dialog, thêm khách quick-add, line item gọn, xác nhận tạo đơn (B1, B2, B7) | P1 | 6h | Bán nhanh hơn rất nhiều |
| 9 | Sales list filter ngày + status, default "Hôm nay" + pagination (B3) | P1 | 3h | Tra cứu nhanh hơn |
| 10 | ProductCard: bỏ nút Thống kê dead, thêm confirm xoá (C5) | P1 | 30m | Tránh mất dữ liệu |
| 11 | SaleDetailDialog: dùng shadcn Select/Button, thêm In hoá đơn, mobile responsive (B4) | P1 | 2h | Đồng nhất UI |
| 12 | PrintInvoice: handle popup blocked, có A4 option (B5) | P1 | 1h | Không crash khi in |
| 13 | BarcodeScanner: timeout camera (B6) | P1 | 30m | Không treo UI |
| 14 | Touch target 44px + skeleton + empty state CTA + branding nhất quán (D1, D2, D3, D5) | P2 | 4h | Cảm giác mượt và pro hơn |
| 15 | FAB tạo đơn nhanh + global search Cmd+K (D10, D12) | P2 | 3h | Tăng tốc thao tác |

**Tổng:** P0 ≈ 10h, P1 ≈ 15h, P2 ≈ 7h.

---

## F. Khuyến nghị thực thi

1. **Đợt 1 (1 ngày):** Làm hết P0 — không thêm tính năng, chỉ chống trắng màn hình & mất dữ liệu. Sau đợt này chị nhà sẽ ít bị "đóng-mở app" hẳn.
2. **Đợt 2 (2–3 ngày):** Tập trung vào luồng bán hàng (B1, B2, B3) — đây là nơi tiết kiệm thời gian nhiều nhất hằng ngày.
3. **Đợt 3 (1–2 ngày):** Đánh bóng — branding, skeleton, FAB, touch target.

Trước khi bắt tay sửa code, anh em có thể xem chị nhà thao tác ~30 phút (record màn hình hoặc ngồi cạnh) để xác nhận đâu là đau nhất thực tế. Báo cáo này dựa trên phân tích code; quan sát thực tế có thể thay đổi thứ tự ưu tiên.

---

## G. Phát hiện bổ sung từ ảnh chụp màn hình thực tế

Sau khi xem ảnh app đang chạy, em phát hiện thêm các lỗi sau (nhiều cái không thấy được khi chỉ đọc code):

### G1. **P0 — Đơn hàng hiển thị giảm giá 3.760.300.562.185 đ (3,7 NGHÌN TỶ)** 

Ảnh 1, đơn `#DH35907603` ngày 16/6/2025 hiển thị:
> `% 3.760.300.562.185 đ (-3.760.300.562.185 đ)` rồi `$ 0 đ`

Đây là một đơn hàng dữ liệu hỏng — hoặc giảm giá fixed đã nhập sai (ai đó gõ phải cả số), hoặc giảm giá phần trăm bị tính sai (ví dụ subtotal=1tỷ đ × 3760300% = số trên). Hậu quả:

- **Layout vỡ:** số 16 chữ số đè lên cột thành tiền bên phải, phá vỡ card.
- **Tổng: "0 đ" hiển thị màu đậm như đơn bình thường** — nhìn vào vẫn nghĩ đơn này hợp lệ. Không có dấu hiệu cảnh báo.
- **Chị nhà có thể không biết đơn này hỏng** — nó nằm chung với đơn thường, status "Đang xử lý" như mọi đơn khác.

**Đề xuất:**
- **Sửa data ngay** — vào Supabase tìm đơn này, set `giam_gia_so_tien` và `giam_gia_gia_tri` về 0 (hoặc xoá đơn nếu là test).
- **Chống tái diễn ở `CreateSaleDialog.tsx` dòng 397–410**: thêm sanity check — nếu `discount.value > subtotal × 10` → cảnh báo "Giảm giá lớn bất thường, kiểm tra lại".
- **Thêm validation ở DB** — `CHECK (giam_gia_so_tien <= tong_tien)` để DB từ chối insert sai.
- **Sửa hiển thị `Sales.tsx` dòng 65–86:** giới hạn `max-w` cho khối renderSaleAmount, cắt bằng `truncate` để dù số lớn không vỡ layout. Đồng thời nếu `giam_gia_so_tien > tong_tien` → đổi card sang nền đỏ nhạt + icon cảnh báo "Đơn cần kiểm tra".

### G2. **P0 — Layout trang Bán hàng vỡ trên mobile**

Ảnh 1: tiêu đề **"Bán hàng" sát mép trái màn hình** (không có padding ngang), nút **"Tạo đơn hàng" tràn sát mép phải**, thậm chí chữ "h" của "hàng" gần như đụng cạnh.

**Nguyên nhân:**
- `src/pages/Index.tsx` dòng 61: `<div className="flex-1 overflow-y-auto pb-20 md:pb-0">` — không có padding ngang cho content.
- `src/components/Sales.tsx` dòng 110: `<div className="space-y-6">` — không có `p-4` riêng (Dashboard.tsx dòng 81 có `p-4 lg:p-6`, nhưng Sales/Inventory/Customers/Analytics/Products đều thiếu).

**Đề xuất:** thêm `className="p-4 lg:p-6"` vào wrapper của TẤT CẢ tab (Sales, Inventory, Customers, Analytics, ProductManager) cho đồng nhất với Dashboard. Hoặc thêm `px-4 py-4 md:px-6 md:py-6` vào Index.tsx dòng 61 để áp 1 lần cho tất cả.

### G3. **P1 — Tiêu đề "Bán hàng" hiển thị 2 lần trên mobile**

Ảnh 1: phía trên là `MobileTopBar` ghi "Bán hàng" với icon Sparkles, ngay dưới lại có `<h1>Bán hàng</h1>` từ `Sales.tsx` dòng 112. Trùng lặp, tốn không gian quý.

**Đề xuất:** Trên mobile (`md:hidden`), ẩn `<h1>` của từng tab vì `MobileTopBar` đã có title:
```jsx
<h1 className="hidden md:block text-3xl font-bold ...">Bán hàng</h1>
```
Áp tương tự cho Inventory, Customers, Products, Analytics. Mobile sẽ rộng rãi hơn nhiều, có thêm chỗ cho filter chips ở vị trí đó.

### G4. **P1 — Bottom nav active indicator quá lớn, mất cân đối**

Ảnh 1: nút "Bán" đang active có **vòng tròn hồng/đỏ to choáng cả icon**, nổi bật quá mức so với 4 mục còn lại. Nhìn không cân đối — như nút "đang được bấm" hơn là "tab hiện tại".

**File:** `src/components/MobileBottomNav.tsx` dòng 53–60:
```jsx
className={cn(
  'flex items-center justify-center h-9 w-9 rounded-full transition-all',
  active && 'bg-primary/10 scale-105'
)}
```

`bg-primary/10` ở dạng pink primary hiện ra quá đậm, thêm `scale-105` làm icon to thêm. Cộng với gạch đỏ phía trên (dòng 64–66) → 3 lớp chỉ báo (color + bg + bar) là quá nhiều.

**Đề xuất:** chọn 1 trong 3, không cần cả 3:
- Bỏ `scale-105` (icon to ra giật).
- Đổi `bg-primary/10` → `bg-primary/5` (nhạt hơn nhiều) hoặc bỏ hẳn.
- Giữ lại gạch đỏ trên cùng + đổi màu icon + chữ là đủ.

### G5. **P1 — Card đơn hàng tiếp theo bị che một phần bởi bottom nav**

Ảnh 1: dưới cùng thấy "Đơn hàng #DH78929140 — Đang xử lý" **bị cắt ngang** bởi bottom nav.

**File:** `src/pages/Index.tsx` dòng 61: `pb-20 md:pb-0`. Bottom nav cao ~64px + safe area iOS ~34px → cần `pb-24` hoặc `pb-28` cho iPhone có notch.

**Đề xuất:** đổi sang `pb-[calc(theme(spacing.20)+env(safe-area-inset-bottom))]` hoặc đơn giản `pb-28 md:pb-0`. Test trên iPhone có Dynamic Island để chắc chắn.

### G6. ~~Search khách hàng hiển thị sai kết quả~~ — **CHƯA XÁC NHẬN, để sau**

> *Phản hồi từ Tho:* "Trong video là anh thao tác thử cho em xem, anh nhập 1 số tên để thử phần tìm kiếm chứ không phải tìm kiếm bị sai, đừng động đến đoạn ấy vội".

Em đã suy diễn quá vội. Việc list không khớp với từ khoá có thể chỉ vì debounce 300ms chưa fire trong lúc Tho gõ test — không phải lỗi thật sự. Để verify khi có pain point thật từ chị nhà rồi mới đụng vào CustomerSearchSelect.

Phần debounce thực tế CÓ điểm cần cải thiện (giảm 300ms xuống 100ms để user thấy phản hồi sớm hơn) nhưng KHÔNG phải bug nghiêm trọng. Để vào P2 nếu cần.

### G7. **P1 — Khách hàng trùng tên không phân biệt được — cần thêm thông tin nhận dạng (KHÔNG phải block tạo mới)**

> *Phản hồi từ Tho:* "Nếu SĐT khác nhau có thể là 2 người khác nhau mà trùng tên thôi" — đúng. Em sửa lại đề xuất.

Ảnh 2 + video xác nhận: có 2 "Bé Trang" (SĐT khác), **3 "Alice Pham"** với 3 SĐT + 3 địa chỉ khác nhau (frame 30–31), nhiều "An Trang", "Anh Long" với phụ chú trong ngoặc... Tên Việt trùng là chuyện bình thường, không phải lỗi nhập.

**Vấn đề thực sự không phải duplicate, mà là phân biệt:** Khi chị nhà search "Trang" hoặc nhìn list, không có cách nào nhanh để biết "Bé Trang nào?". Hiện tại CustomerSearchSelect chỉ hiển thị tên + SĐT (`CustomerSearchSelect.tsx` dòng 107–110).

**Đề xuất sửa lại:**
- **Chỉ check duplicate theo SĐT** trong `AddCustomerDialog` — nếu user nhập SĐT đã có, cảnh báo "SĐT này đã thuộc về khách 'Tên cũ' — bạn muốn cập nhật khách cũ hay thực sự tạo mới?". KHÔNG check theo tên.
- **Trong CustomerSearchSelect**, hiển thị thêm địa chỉ rút gọn (15 ký tự) sau SĐT để phân biệt: `Bé Trang • 0904577350 • Cát Dài` vs `Bé Trang • 0977121102 • Hai Bà Trưng`.
- **Trong list khách hàng (`Customers.tsx`)**, sort hoặc filter có thể group theo tên trùng để chị nhà rà soát thủ công nếu muốn — nhưng không bắt buộc gộp.

### G8. **P1 — Label "Khách hàng" lặp 2 lần trong CreateSaleDialog**

Ảnh 2 (background dialog phần "Khách hàng"): có header section "Khách hàng" rồi ngay dưới `<Label>Khách hàng</Label>` của CustomerSearchSelect → chữ "Khách hàng" hiện 2 lần liên tiếp.

**File:** 
- `CreateSaleDialog.tsx` dòng 351: `<Label className="text-xs">Khách hàng</Label>`
- `CustomerSearchSelect.tsx` dòng 135: `<Label>Khách hàng</Label>` (lặp lại)

**Đề xuất:** xoá `<Label>` ở dòng 351 của CreateSaleDialog (vì CustomerSearchSelect đã có). Hoặc xoá ở CustomerSearchSelect và để parent quyết định.

### G9. **P1 — Drawer khách hàng làm dialog phía sau quá tối, khó ngữ cảnh**

Ảnh 2: khi mở drawer search khách, `CreateSaleDialog` phía sau bị làm tối → không còn nhìn được cart. Nếu đang chọn khách giữa chừng đơn hàng, mất luôn ngữ cảnh.

**Đề xuất:** dùng độ mờ nhẹ hơn (drawer của Vaul mặc định opacity ~60%, có thể giảm xuống 30% hoặc bỏ hoàn toàn — Vaul hỗ trợ `shouldScaleBackground={true}` cho hiệu ứng nhẹ hơn). Hoặc đổi cách hiển thị: thay vì drawer toàn màn, dùng inline expandable section trong dialog.

### G10. **P2 — Nút "Thêm khách hàng mới" màu đỏ trong drawer search**

Ảnh 2 (drawer dưới cùng): nút **"+ Thêm khách hàng mới"** dùng màu đỏ tươi (`bg-red-600 hover:bg-red-700` — `CustomerSearchSelect.tsx` dòng 119). Đỏ thường dùng cho action nguy hiểm (xoá, huỷ). Action tích cực như "Thêm" nên dùng màu primary.

**Đề xuất:** đổi sang `bg-primary` hoặc `bg-brand-gradient` để nhất quán với "Tạo đơn hàng".

### G11. Tổng quan từ ảnh chụp

Nhìn 2 ảnh, em thấy app đã có hình hài khá tốt — mobile bottom nav, drawer search khách, line item cart. Nhưng có những lỗi nhìn-1-cái-là-thấy:
- Layout vỡ ở Sales (G2)
- Đơn hàng có dữ liệu rác hiển thị nguyên hàm (G1)
- Search không phản hồi đúng (G6)
- Title trùng + bottom nav che card (G3, G5)

**Mấy cái này nếu sửa được trong 1 buổi sẽ làm cảm giác app khác hẳn.**

---

*Tác giả: phân tích bởi Claude theo yêu cầu của Tho — ngày 04/05/2026.*
*Cập nhật G1–G11 sau khi xem ảnh chụp app thực tế.*

---

## H. Phát hiện từ video screen recording (5 phút thao tác thực)

Sau khi xem 31 frame trích từ video chị thao tác app (5 phút bao quát Tổng quan, Bán hàng, Sản phẩm, Kho, Khách hàng), em phát hiện thêm các vấn đề chưa nêu — nhiều cái KHÁ NẶNG về dữ liệu và biểu đồ.

### H1. **P0 — Tồn kho có thể ÂM, không có ràng buộc DB**

**Frame 9 + 20 + 22:** thấy nhiều sản phẩm có tồn kho âm:
- Cushion phấn bột Dior màu Light: `-1 sản phẩm` (badge "Sắp hết")
- Active Serum Is Clinical 60ml: `-4 sản phẩm` (badge "Sắp hết")
- B5 Hydra Cool Serum IS CLINICAL 30ml: `-2 sản phẩm` (badge "Sắp hết")

Nguyên nhân: `inventory_transactions` ghi "xuất" mà không có CHECK contraint `ton_kho >= 0`. Khi bán hàng nhanh, nếu sản phẩm chưa nhập kho hoặc nhập sai, vẫn xuất được → âm. Cộng thêm bug A4 (insert inventory không error-check), số liệu kho dần lệch.

Hậu quả:
- Báo cáo doanh thu / tồn kho sai → không quản trị được lãi/lỗ.
- Status badge `< 10 → "Sắp hết"` áp dụng cho cả số âm — không cảnh báo lỗi dữ liệu.

**Đề xuất:**
1. **DB:** thêm `CHECK (ton_kho >= 0)` cho cột `products.ton_kho`. Hoặc dùng trigger từ chối insert `inventory_transactions` nếu sẽ làm `ton_kho < 0`.
2. **`ProductCard.tsx` dòng 22–32:** thêm trường hợp `stock < 0` → badge đỏ đậm "⚠️ Lỗi tồn kho". Show số `-4 sản phẩm` đỏ kèm tooltip "Tồn kho âm — cần kiểm tra".
3. **Tool sửa thủ công:** thêm tab/chức năng "Kiểm kê" cho phép set lại `ton_kho` thực tế cho từng sản phẩm (gen `inventory_transactions` loại `dieu_chinh`).

### H2. **P0 — Y-axis biểu đồ Dashboard hiển thị "000000" lặp đi lặp lại — vô nghĩa**

**Frame 2 + 3:** cả 2 biểu đồ "Doanh số theo tuần" và "Xu hướng doanh thu" có Y-axis hiển thị `000000`, `000000`, `000000`... — chữ số bị cắt do giá trị quá lớn (hàng triệu) và recharts không format được.

**File:** `src/components/Dashboard.tsx` dòng 158, 178 — `<YAxis tick={{ fill: '#6b7280' }} />` không có `tickFormatter`.

**Đề xuất:** thêm `tickFormatter={(v) => v >= 1e6 ? (v/1e6).toFixed(0) + 'tr' : v.toLocaleString('vi-VN')}`. Ví dụ 50tr, 100tr — gọn và chị nhà đọc được.

### H3. **P0 — "Cảnh báo hết hàng: 989 sản phẩm" — useless metric**

**Frame 3:** Dashboard hiển thị "Cảnh báo hết hàng: **989** sản phẩm — Sản phẩm dưới 10 món". Trên tổng 2057 sản phẩm → ~48% sản phẩm bị flag là "sắp hết". Con số này không thể dùng được — không thể gọi 989 sản phẩm là "cần nhập kho".

Nguyên nhân: ngưỡng cứng `< 10` (Dashboard.tsx dòng 36 + ProductCard.tsx dòng 24) áp cho mọi sản phẩm. Trong khi mỹ phẩm có loại bán nhanh (kem chống nắng) cần dự trữ 50+, có loại mỗi tháng bán 1 chai (nước hoa cao cấp) — ngưỡng 10 không phù hợp tất cả.

Đồng thời, do bug H1, nhiều sản phẩm bị âm cũng tính vào "989" → con số càng vô nghĩa.

**Đề xuất:**
1. Mỗi sản phẩm có **ngưỡng riêng** (`muc_canh_bao` mặc định = 5, user sửa được trong Edit). Dashboard đếm `ton_kho < muc_canh_bao`.
2. Trên Dashboard, click vào card "Cảnh báo hết hàng" → chuyển sang Sản phẩm tab có filter "Hết hàng" sẵn → chị xem được danh sách cụ thể, không chỉ con số.
3. Loại trừ sản phẩm đã ngưng bán khỏi cảnh báo (cần thêm cột `ngung_ban` hoặc tag).

### H4. **P0 — `AddInventoryDialog` dùng native `<select>` cho 2057 sản phẩm**

**Frame 26:** chị bấm "Thêm giao dịch" trong tab Kho hàng → modal mở → ô "Sản phẩm" là native `<select>` xổ xuống danh sách 2057 sản phẩm thẳng đứng, KHÔNG có search bên trong, KHÔNG cuộn được mượt, **vượt khỏi modal** — text các option bắt đầu từ x=0 (mép trái viewport) chứ không nằm trong khung modal.

Đây là pain point nặng. Để chọn 1 sản phẩm trong 2057, chị nhà phải scroll điên cuồng (hoặc gõ ký tự đầu rồi browser tự nhảy — nhưng với tiếng Việt có dấu, hành vi này không nhất quán).

**File:** `src/components/AddInventoryDialog.tsx` (em chưa đọc trực tiếp nhưng frame xác nhận là native `<select>`).

**Đề xuất:** thay native select bằng `ProductSearchDialog`/`ProductSearchSelect` đã có sẵn (cmdk Combobox). Chị gõ tên / mã vạch → 1 click chọn. Trải nghiệm sẽ khác hẳn.

### H5. ~~Customer search BROKEN~~ — **HUỶ. Tho đang demo, không phải lỗi thật**

> *Phản hồi từ Tho:* video là anh demo cho em xem, gõ tên thử phần tìm kiếm — không phải search bị sai. Đừng động đến đoạn này vội.

Em rút lại toàn bộ kết luận về CustomerSearchSelect — chưa có bằng chứng từ chị nhà thật. Khi nào chị nhà phản hồi gặp khó tìm khách thì mới điều tra.

### H6. **P1 — Order code hiển thị 2 dạng khác nhau, không tham chiếu được nhau**

**Frame 22:** Inventory log ghi "Bán hàng - Đơn 19" trong khi Sales list (frame 1) hiển thị `#DH19991273`, `#DH35907603`, `#DH78929140`...

Đây là bug A4-ngụ ý: ghi chú trong `inventory_transactions` dùng `sale_id` (PK của bảng) thay vì `ma_don_hang` (mã hiển thị). Khi chị xem Kho hàng thấy "Đơn 19" → muốn tra ngược về đơn nào → không có cách.

**File:** `src/hooks/useSales.ts` dòng 114: `ghi_chu: 'Bán hàng - Đơn ${saleItem.sale_id}'` → đổi thành `${ma_don_hang}` (cần truyền xuống).

### H7. **P1 — Inventory list layout cramped — cột "Số lượng" và "Giá trị" wrap text**

**Frame 22 + 24:** mỗi item kho có badge "Xuất kho" + tên SP + số lượng + giá trị + ngày — nhưng **các tiêu đề cột bị wrap thành 2 dòng** ("Số\nlượng", "Giá\ntrị"). Cùng với số "-2" / "-1" làm cột bị nén → text xếp lộn xộn, khó đọc nhanh.

**Đề xuất:** redesign card thành 1 row chính (badge + tên + số lượng) + 1 row phụ (mã + giá trị + ngày). Hoặc bỏ text "Số lượng" / "Giá trị" — chỉ dùng icon + số.

### H8. **P1 — Khi chị duyệt list khách, địa chỉ dài bị tràn / wrap xấu**

**Frame 28:** Ai Minh có địa chỉ "1547 Nguyễn Duy Trinh Phường Trường Thạnh Tp Thủ Đức" — xuống dòng 2 lần, làm card cao bất thường.
**Frame 7:** customer name "662 trần nhân tông" — chứng tỏ có người đã nhập **cả địa chỉ vào trường tên**. Có thể do form không rõ ràng, hoặc vì chị đang vội.

**Đề xuất:**
- Truncate địa chỉ ở list (dùng `line-clamp-1`), full text hiện trong hover/detail.
- Trong AddCustomerDialog, đặt placeholder rõ: tên = "Nguyễn Văn A", địa chỉ = "Số nhà, đường, phường, quận"; thêm helper text.

### H9. **P2 — Pagination nút "Trang trước / Trang sau" thiếu chỉ số trang**

**Frame 31:** dưới list khách, thấy 2 nút "Trang trước" / "Trang sau" nhưng KHÔNG hiển thị "Trang 1/12" hay tương tự. Chị không biết đang ở đâu trong list, còn bao nhiêu trang. Tương tự chắc cũng có ở Sản phẩm tab (cần verify).

**Đề xuất:** giữa 2 nút thêm "Trang 3 / 27" hoặc selector số trang. shadcn `<Pagination>` có sẵn pattern này.

### H10. **P2 — User dùng print PDF native browser thay vì PrintInvoice của app**

**Frame 6:** dialog Print của Chrome xuất hiện (Save as PDF, Portrait, Cancel/Save). Đây là **dialog native của browser**, không phải PrintInvoice component. Có khả năng chị bấm Cmd+P thay vì nút "In hoá đơn" trong app — hoặc PrintInvoice component đang gọi `window.print()` trên trang chính khiến cả page in luôn.

Khả năng cao 2: PrintInvoice.tsx dòng 12 mở `window.open()` rồi gọi `printWindow.print()` → nhưng nếu popup bị block hoặc gọi sai context, browser fall back về print main page. Cần verify thực tế.

**Đề xuất:** thử in từ một đơn → nếu kết quả là "in toàn bộ trang Sales chứ không phải hoá đơn riêng" → fix PrintInvoice gấp.

### H11. **P2 — Có duplicate sản phẩm thật trong catalog**

**Frame 26 (dropdown):** thấy "Bàn chải đánh răng Oral B 700" hiện 2 lần liên tiếp — có thể là 2 mã vạch khác nhau cho cùng 1 sản phẩm, hoặc duplicate thật. Có sản phẩm dùng mã T-prefix (T0140), có sản phẩm SP-prefix (SP000XXX), có sản phẩm dùng mã vạch GS1 (4210201124092) — quy ước mã không nhất quán.

**Đề xuất:** bonus task — tool gộp sản phẩm trùng (chọn 2 sản phẩm → "Gộp thành 1" → cộng tồn kho, gộp inventory_transactions, xóa item dư).

### H12. **P2 — "phút trước" hiển thị 477.343 phút trước (= ~331 ngày)**

**Frame 2:** "Hoạt động gần đây" hiển thị các đơn từ 438.105 đến 477.343 phút trước — confirm C2, không có gì mới. Nhưng VIDEO cho thấy đây không phải edge case — chị nhà đối mặt con số 6 chữ số mỗi lần mở Tổng quan. Đáng đẩy lên P1.

Sửa nhanh: dùng `formatDistanceToNow(new Date(sale.ngay_ban), { locale: vi, addSuffix: true })` của date-fns đã có. → "1 năm trước", "3 ngày trước".

### H13. ~~Chị thao tác chậm ở đoạn nào?~~ — **HUỶ. Đây là Tho demo, không phải chị nhà**

Em đã suy diễn sai — video là Tho thao tác để show app cho em, không phải observer chị nhà thật. Mọi kết luận về "user behavior" / "pain point thực tế" trong section này không có giá trị. Em rút lại.

Để biết chị nhà thật sự đau ở đâu, cần record màn hình chị làm việc thật, hoặc hỏi trực tiếp chị, hoặc bật heatmap/session replay (PostHog/Hotjar) trong production.

### H14. Tổng hợp — ưu tiên sửa từ video (đã cập nhật)

Bỏ H5 và H13. Ưu tiên xếp lại dựa trên các vấn đề **thực sự thấy được** trong code/data (không cần dựa vào thao tác user):

| Ưu tiên | Vấn đề | Tại sao gấp |
|---|---|---|
| #1 | A1 ErrorBoundary | Loại bỏ trắng màn hình — pain point chị nhà ĐÃ xác nhận |
| #2 | G1 đơn hàng giảm giá 3.7 nghìn tỷ + sanity check discount | Dữ liệu hỏng, hiển thị vỡ layout |
| #3 | H1 chống tồn kho âm (DB constraint + sửa data hiện tại) | Sai số liệu kinh doanh, sai cảnh báo |
| #4 | G2 padding ngang cho tất cả tab | Layout mọi tab vỡ trên mobile |
| #5 | H4 đổi `<select>` ở AddInventoryDialog sang Combobox | 2057 sản phẩm scroll qua native select rất khó |
| #6 | H2 + H3 fix Dashboard (Y-axis format, ngưỡng cảnh báo) | Dashboard hiện tại không đáng tin khi ra quyết định |

**Lưu ý:** các vấn đề liên quan tới search hoặc luồng thao tác thực tế (CustomerSearchSelect, line item cart...) cần xác minh với chị nhà trước khi sửa — không suy diễn từ video demo.

---

*Cập nhật H1–H14 ngày 04/05/2026 sau khi xem video chị nhà thao tác thực tế.*
