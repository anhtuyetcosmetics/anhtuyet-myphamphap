import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  DollarSign,
  Loader2
} from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';

// Tông màu cờ Pháp
const FRANCE_COLORS = {
  blue: '#002395',
  white: '#ffffff', 
  red: '#ed2939',
  lightBlue: '#4285f4',
  lightRed: '#ff6b6b',
  gray: '#6b7280'
};

export const Analytics = () => {
  const { data: sales, isLoading: salesLoading } = useSales();
  const { data: products, isLoading: productsLoading } = useProducts();

  const isLoading = salesLoading || productsLoading;

  // Lọc bỏ các đơn hàng đã hủy
  const activeSales = useMemo(() => 
    sales?.filter(sale => sale.trang_thai !== 'cancelled') || [],
    [sales]
  );

  // Tính toán thống kê thực từ dữ liệu (chỉ tính các đơn hàng chưa hủy)
  const totalRevenue = activeSales.reduce((sum, sale) => sum + sale.tong_tien, 0);
  const totalProfit = Math.round(totalRevenue * 0.3); // Giả sử lợi nhuận 30%
  const totalOrders = activeSales.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Dữ liệu doanh số và lợi nhuận theo tháng (chỉ tính các đơn hàng chưa hủy)
  const monthlyData = activeSales.reduce((acc, sale) => {
    const date = new Date(sale.ngay_ban);
    const month = `T${date.getMonth() + 1}`;
    const existing = acc.find(item => item.name === month);
    const revenue = sale.tong_tien;
    const profit = Math.round(revenue * 0.3);
    
    if (existing) {
      existing.sales += revenue;
      existing.profit += profit;
    } else {
      acc.push({ name: month, sales: revenue, profit });
    }
    return acc;
  }, [] as Array<{ name: string; sales: number; profit: number }>);

  // Dữ liệu danh mục sản phẩm từ database
  const categoryData = products?.reduce((acc, product) => {
    const category = product.nhom_hang || 'Khác';
    const existing = acc.find(item => item.name === category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ 
        name: category, 
        value: 1, 
        color: category === 'Đồ uống' ? FRANCE_COLORS.blue :
               category === 'Thức ăn' ? FRANCE_COLORS.red :
               category === 'Bánh kẹo' ? FRANCE_COLORS.lightBlue :
               FRANCE_COLORS.lightRed
      });
    }
    return acc;
  }, [] as Array<{ name: string; value: number; color: string }>) || [];

  // Top sản phẩm bán chạy (chỉ tính các đơn hàng chưa hủy)
  const topProducts = activeSales.reduce((acc, sale) => {
    sale.sale_items?.forEach(item => {
      if (item.products) {
        const existing = acc.find(p => p.name === item.products.ten_hang);
        if (existing) {
          existing.sales += item.so_luong;
          existing.revenue += item.thanh_tien;
        } else {
          acc.push({
            name: item.products.ten_hang,
            sales: item.so_luong,
            revenue: item.thanh_tien
          });
        }
      }
    });
    return acc;
  }, [] as Array<{ name: string; sales: number; revenue: number }>)
    ?.sort((a, b) => b.revenue - a.revenue)
    ?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: FRANCE_COLORS.blue }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Bảng thống kê</h1>
        <div className="flex items-center space-x-2 text-sm" style={{ color: FRANCE_COLORS.gray }}>
          <Calendar className="h-4 w-4" />
          <span>Dữ liệu thời gian thực</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="border" style={{ borderColor: FRANCE_COLORS.blue }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: FRANCE_COLORS.gray }}>Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4" style={{ color: FRANCE_COLORS.blue }} />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold text-gray-900">
              {totalRevenue.toLocaleString('vi-VN')} ₫
            </div>
            <p className="text-xs flex items-center mt-1" style={{ color: FRANCE_COLORS.blue }}>
              <TrendingUp className="h-3 w-3 mr-1" />
              Dữ liệu thực từ hệ thống
            </p>
          </CardContent>
        </Card>

        <Card className="border" style={{ borderColor: FRANCE_COLORS.red }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: FRANCE_COLORS.gray }}>Tổng lợi nhuận</CardTitle>
            <TrendingUp className="h-4 w-4" style={{ color: FRANCE_COLORS.red }} />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold text-gray-900">
              {totalProfit.toLocaleString('vi-VN')} ₫
            </div>
            <p className="text-xs flex items-center mt-1" style={{ color: FRANCE_COLORS.red }}>
              <TrendingUp className="h-3 w-3 mr-1" />
              Ước tính 30% doanh thu
            </p>
          </CardContent>
        </Card>

        <Card className="border" style={{ borderColor: FRANCE_COLORS.lightBlue }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: FRANCE_COLORS.gray }}>Giá trị đơn TB</CardTitle>
            <DollarSign className="h-4 w-4" style={{ color: FRANCE_COLORS.lightBlue }} />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold text-gray-900">
              {avgOrderValue.toLocaleString('vi-VN')} ₫
            </div>
            <p className="text-xs flex items-center mt-1" style={{ color: FRANCE_COLORS.lightBlue }}>
              <TrendingUp className="h-3 w-3 mr-1" />
              Trung bình mỗi đơn
            </p>
          </CardContent>
        </Card>

        <Card className="border" style={{ borderColor: FRANCE_COLORS.lightRed }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: FRANCE_COLORS.gray }}>Tổng đơn hàng</CardTitle>
            <TrendingUp className="h-4 w-4" style={{ color: FRANCE_COLORS.lightRed }} />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold text-gray-900">{totalOrders}</div>
            <p className="text-xs flex items-center mt-1" style={{ color: FRANCE_COLORS.lightRed }}>
              <TrendingUp className="h-3 w-3 mr-1" />
              Đơn hàng đã xử lý
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card className="border" style={{ borderColor: FRANCE_COLORS.blue }}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Xu hướng doanh số & lợi nhuận</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fill: FRANCE_COLORS.gray }} />
                <YAxis tick={{ fill: FRANCE_COLORS.gray }} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString('vi-VN')} ₫`} />
                <Bar dataKey="sales" fill={FRANCE_COLORS.blue} name="Doanh số" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill={FRANCE_COLORS.red} name="Lợi nhuận" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border" style={{ borderColor: FRANCE_COLORS.red }}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Phân bố sản phẩm theo loại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                {categoryData.length > 0 ? (
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Chưa có dữ liệu phân loại
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="border" style={{ borderColor: FRANCE_COLORS.blue }}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Sản phẩm bán chạy nhất</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-4 rounded-lg" 
                     style={{ backgroundColor: index % 2 === 0 ? '#f8fafc' : FRANCE_COLORS.white }}>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm text-white"
                         style={{ backgroundColor: index < 3 ? FRANCE_COLORS.blue : FRANCE_COLORS.red }}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm" style={{ color: FRANCE_COLORS.gray }}>Đã bán {product.sales} sản phẩm</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{product.revenue.toLocaleString('vi-VN')} ₫</div>
                    <div className="text-sm" style={{ color: FRANCE_COLORS.gray }}>Doanh thu</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: FRANCE_COLORS.gray }}>
              <p>Chưa có dữ liệu bán hàng</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
