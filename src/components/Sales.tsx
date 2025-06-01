
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  ShoppingCart,
  User,
  Calendar,
  DollarSign,
  Eye,
  Printer,
  Loader2
} from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useToast } from '@/hooks/use-toast';
import { CreateSaleDialog } from './CreateSaleDialog';
import { SaleDetailDialog } from './SaleDetailDialog';
import { PrintInvoice } from './PrintInvoice';

export const Sales = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [printingSale, setPrintingSale] = useState(null);
  
  const { data: sales, isLoading, error } = useSales();
  const { toast } = useToast();

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Đang xử lý';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  const handleViewDetails = (sale) => {
    setSelectedSale(sale);
    setShowDetailDialog(true);
  };

  const handlePrintInvoice = (sale) => {
    setPrintingSale(sale);
    setTimeout(() => setPrintingSale(null), 1000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Có lỗi xảy ra khi tải dữ liệu bán hàng
      </div>
    );
  }

  const filteredSales = sales?.filter(sale =>
    sale.ma_don_hang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customers?.ten_khach_hang.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Bán hàng</h1>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tạo đơn hàng
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm đơn hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sales Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSales.map((sale) => (
          <Card key={sale.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Đơn hàng #{sale.ma_don_hang}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {sale.customers?.ten_khach_hang || 'Khách lẻ'}
                    </span>
                  </div>
                </div>
                <Badge className={getStatusColor(sale.trang_thai)}>
                  {getStatusText(sale.trang_thai)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {sale.ngay_ban ? new Date(sale.ngay_ban).toLocaleDateString('vi-VN') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-lg font-bold text-gray-900">
                      {sale.tong_tien.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>

                {sale.sale_items && sale.sale_items.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Sản phẩm ({sale.sale_items.length} món):
                    </p>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {sale.sale_items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex justify-between text-xs text-gray-600">
                          <span>{item.products?.ten_hang}</span>
                          <span>{item.so_luong}x</span>
                        </div>
                      ))}
                      {sale.sale_items.length > 3 && (
                        <p className="text-xs text-gray-500">+{sale.sale_items.length - 3} sản phẩm khác</p>
                      )}
                    </div>
                  </div>
                )}

                {sale.ghi_chu && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600">{sale.ghi_chu}</p>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 pt-3 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewDetails(sale)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Chi tiết
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handlePrintInvoice(sale)}
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    In hóa đơn
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSales.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy đơn hàng</h3>
            <p className="text-gray-500">Thử điều chỉnh từ khóa tìm kiếm.</p>
          </CardContent>
        </Card>
      )}

      <CreateSaleDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />

      <SaleDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        sale={selectedSale}
      />

      {printingSale && (
        <PrintInvoice
          sale={printingSale}
          onClose={() => setPrintingSale(null)}
        />
      )}
    </div>
  );
};
