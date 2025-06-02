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
  const lowStockItems = inventory?.filter(item => item.so_luong_hien_tai < 10).length || 0;

  // Tạo dữ liệu biểu đồ từ doanh số thực (chỉ tính các đơn hàng chưa hủy)
  const salesData = activeSales.reduce((acc, sale) => {
    const date = new Date(sale.ngay_ban);
    const dayName = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
    const existing = acc.find(item => item.name === dayName);
    if (existing) {
      existing.sales += sale.thanh_tien;
    } else {
      acc.push({ name: dayName, sales: sale.thanh_tien });
    }
    return acc;
  }, [] as Array<{ name: string; sales: number }>);

  // Dữ liệu xu hướng doanh thu theo tháng (chỉ tính các đơn hàng chưa hủy)
  const revenueData = activeSales.reduce((acc, sale) => {
    const date = new Date(sale.ngay_ban);
    const month = `T${date.getMonth() + 1}`;
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.revenue += sale.thanh_tien;
    } else {
      acc.push({ month, revenue: sale.thanh_tien });
    }
    return acc;
  }, [] as Array<{ month: string; revenue: number }>);

  // Hoạt động gần đây từ dữ liệu thực (chỉ tính các đơn hàng chưa hủy)
  const recentActivities = activeSales.slice(0, 4).map(sale => ({
    action: `Hoàn thành đơn hàng #${sale.ma_don_hang}`,
    amount: `${sale.thanh_tien.toLocaleString('vi-VN')} ₫`,
    time: `${Math.floor((Date.now() - new Date(sale.ngay_ban).getTime()) / (1000 * 60))} phút trước`,
    icon: ShoppingBag
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tổng quan</h1>
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
              {totalRevenue.toLocaleString('vi-VN')} ₫
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
            <div className="text-xl lg:text-2xl font-bold text-gray-900">{totalProducts}</div>
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
            <div className="text-xl lg:text-2xl font-bold text-gray-900">{totalCustomers}</div>
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
            <div className="text-xl lg:text-2xl font-bold text-gray-900">{lowStockItems}</div>
            <p className="text-xs text-red-600 mt-1">
              Sản phẩm dưới 10 món
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Doanh số theo tuần</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
                <YAxis tick={{ fill: '#6b7280' }} />
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
            <CardTitle className="text-lg font-semibold text-gray-900">Xu hướng doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280' }} />
                <YAxis tick={{ fill: '#6b7280' }} />
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
