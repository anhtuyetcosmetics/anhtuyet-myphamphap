
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  TrendingDown, 
  Package, 
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react';

const inventoryData = [
  { id: 1, name: 'Hạt cà phê cao cấp', currentStock: 150, minStock: 50, maxStock: 300, status: 'Tốt', lastUpdated: '2024-01-15' },
  { id: 2, name: 'Bộ sưu tập trà hữu cơ', currentStock: 8, minStock: 20, maxStock: 100, status: 'Thấp', lastUpdated: '2024-01-14' },
  { id: 3, name: 'Thanh chocolate thủ công', currentStock: 0, minStock: 10, maxStock: 80, status: 'Hết', lastUpdated: '2024-01-10' },
  { id: 4, name: 'Bánh croissant tươi', currentStock: 45, minStock: 30, maxStock: 120, status: 'Tốt', lastUpdated: '2024-01-15' },
  { id: 5, name: 'Bánh sandwich cao cấp', currentStock: 23, minStock: 15, maxStock: 60, status: 'Tốt', lastUpdated: '2024-01-15' },
];

export const Inventory = () => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Tốt': return { color: 'bg-emerald-100 text-emerald-800', icon: Package };
      case 'Thấp': return { color: 'bg-amber-100 text-amber-800', icon: AlertTriangle };
      case 'Hết': return { color: 'bg-red-100 text-red-800', icon: TrendingDown };
      default: return { color: 'bg-gray-100 text-gray-800', icon: Package };
    }
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý kho hàng</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <RefreshCw className="h-4 w-4 mr-2" />
          Đồng bộ kho
        </Button>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tổng sản phẩm</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">226</div>
            <p className="text-xs text-gray-600 mt-1">Trên tất cả sản phẩm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sản phẩm sắp hết</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">1</div>
            <p className="text-xs text-amber-600 mt-1">Cần nhập thêm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Hết hàng</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">1</div>
            <p className="text-xs text-red-600 mt-1">Cần xử lý ngay</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Mức tồn kho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Sản phẩm</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Tồn kho hiện tại</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Mức tồn</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Cập nhật cuối</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((item) => {
                  const statusInfo = getStatusInfo(item.status);
                  const StatusIcon = statusInfo.icon;
                  const stockPercentage = getStockPercentage(item.currentStock, item.maxStock);
                  
                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{item.name}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-900">{item.currentStock} sản phẩm</div>
                        <div className="text-xs text-gray-500">Tối thiểu: {item.minStock}, Tối đa: {item.maxStock}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              stockPercentage > 50 ? 'bg-emerald-600' :
                              stockPercentage > 20 ? 'bg-amber-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${stockPercentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{stockPercentage.toFixed(0)}% công suất</div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">
                        {new Date(item.lastUpdated).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
