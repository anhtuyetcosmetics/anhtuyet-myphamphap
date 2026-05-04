import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
  ShoppingBag,
  Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { useInventory } from '@/hooks/useInventory';

export const Dashboard = () => {
  const { data: sales, isLoading: salesLoading } = useSales();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: customerResult, isLoading: customersLoading } = useCustomers();
  const { data: inventory, isLoading: inventoryLoading } = useInventory();

  const isLoading = salesLoading || productsLoading || customersLoading || inventoryLoading;

  // Lọc bỏ các đơn hàng đã hủy
  const activeSales = useMemo(() =>
    sales?.filter(sale => sale.trang_thai !== 'cancelled') || [],
    [sales]
  );

  // Tính toán thống kê thực (chỉ tính các đơn hàng chưa hủy)
  const totalRevenue = activeSales.reduce((sum, sale) => sum + sale.thanh_tien, 0);
  const totalProducts = products?.length || 0;
  const totalCustomers = customerResult?.data?.length || 0;
  const lowStockItems = inventory?.filter(item => item.so_luong_hien_tai > 0 && item.so_luong_hien_tai < 10).length || 0;
  const negativeStockItems = inventory?.filter(item => item.so_luong_hien_tai < 0).length || 0;

  // Lấy 7 ngày gần nhất
  const last7Days = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return activeSales.filter(sale => {
      if (!sale.ngay_ban) return false;
      const date = new Date(sale.ngay_ban);
      return date >= sevenDaysAgo;
    });
  }, [activeSales]);

  // Tạo dữ liệu biểu đồ từ 7 ngày gần nhất (chỉ tính các đơn hàng chưa hủy)
  const salesData = useMemo(() => {
    const days = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({
        name: dayNames[d.getDay()],
        date: d.toISOString().slice(0, 10),
        sales: 0,
      });
    }
    last7Days.forEach(sale => {
      if (!sale.ngay_ban) return;
      const dateStr = new Date(sale.ngay_ban).toISOString().slice(0, 10);
      const day = days.find(d => d.date === dateStr);
      if (day) day.sales += sale.thanh_tien;
    });
    return days;
  }, [last7Days]);

  // Dữ liệu xu hướng doanh thu theo 12 tháng gần nhất (chỉ tính các đơn hàng chưa hủy)
  const revenueData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        monthKey,
        month: `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`,
        revenue: 0,
      });
    }
    activeSales.forEach(sale => {
      if (!sale.ngay_ban) return;
      const date = new Date(sale.ngay_ban);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const m = months.find(x => x.monthKey === key);
      if (m) m.revenue += sale.thanh_tien;
    });
    return months;
  }, [activeSales]);

  // Hoạt động gần đây từ dữ liệu thực (chỉ tính các đơn hàng chưa hủy)
  const recentActivities = activeSales.slice(0, 4).map(sale => ({
    action: `Hoàn thành đơn hàng #${sale.ma_don_hang}`,
    amount: `${sale.thanh_tien.toLocaleString('vi-VN')} ₫`,
    time: sale.ngay_ban
      ? formatDistanceToNow(new Date(sale.ngay_ban), { addSuffix: true, locale: vi })
      : '—',
    icon: ShoppingBag
  }));


  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-end md:justify-between">
        <h1 className="hidden md:block text-2xl lg:text-3xl font-bold text-gray-900">Tổng quan</h1>
        <div className="text-sm text-gray-500">
          Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="hover:shadow-lg transition-shadow border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold text-gray-900">
              {salesLoading ? '...' : totalRevenue.toLocaleString('vi-VN') + ' ₫'}
            </div>
            <p className="text-xs text-blue-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Dữ liệu thực từ hệ thống
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tổng sản phẩm</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold text-gray-900">{productsLoading ? '...' : totalProducts}</div>
            <p className="text-xs text-gray-600 mt-1">
              Sản phẩm trong hệ thống
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Khách hàng</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold text-gray-900">{customersLoading ? '...' : totalCustomers}</div>
            <p className="text-xs text-blue-600 mt-1">
              Khách hàng đã đăng ký
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cảnh báo hết hàng</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold text-gray-900">
              {inventoryLoading ? '...' : lowStockItems}
            </div>
            <p className="text-xs text-red-600 mt-1">
              {negativeStockItems > 0 && (
                <>
                  Sắp hết: {lowStockItems} | Lỗi tồn kho: {negativeStockItems}
                </>
              )}
              {negativeStockItems === 0 && 'Sản phẩm dưới 10 món'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Doanh số 7 ngày gần nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
                <YAxis
                  tick={{ fill: '#6b7280' }}
                  tickFormatter={(v: number) => {
                    if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + ' tỷ';
                    if (v >= 1_000_000) return Math.round(v / 1_000_000) + ' tr';
                    if (v >= 1_000) return (v / 1_000).toFixed(0) + ' k';
                    return v.toString();
                  }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString('vi-VN')} ₫`, 'Doanh số']}
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #3b82f6' }}
                />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-red-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Xu hướng doanh thu 12 tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280' }} />
                <YAxis
                  tick={{ fill: '#6b7280' }}
                  tickFormatter={(v: number) => {
                    if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + ' tỷ';
                    if (v >= 1_000_000) return Math.round(v / 1_000_000) + ' tr';
                    if (v >= 1_000) return (v / 1_000).toFixed(0) + ' k';
                    return v.toString();
                  }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString('vi-VN')} ₫`, 'Doanh thu']}
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #dc2626' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#dc2626" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length > 0 ? recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{activity.amount}</span>
                </div>
              );
            }) : (
              <div className="text-center text-gray-500 py-8">
                <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p>Chưa có hoạt động nào</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
