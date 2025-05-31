
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Calendar, 
  DollarSign, 
  Package,
  FileText
} from 'lucide-react';
import { SaleWithDetails } from '@/hooks/useSales';

interface SaleDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: SaleWithDetails | null;
}

export const SaleDetailDialog: React.FC<SaleDetailDialogProps> = ({
  open,
  onOpenChange,
  sale,
}) => {
  if (!sale) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Chi tiết đơn hàng #{sale.ma_don_hang}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Khách hàng:</span>
                  <span className="font-medium">
                    {sale.customers?.ten_khach_hang || 'Khách lẻ'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Ngày bán:</span>
                  <span className="font-medium">
                    {sale.ngay_ban ? new Date(sale.ngay_ban).toLocaleDateString('vi-VN') : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Tổng tiền:</span>
                  <span className="font-bold text-lg text-blue-600">
                    {sale.tong_tien.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Trạng thái:</span>
                  <Badge className={getStatusColor(sale.trang_thai)}>
                    {getStatusText(sale.trang_thai)}
                  </Badge>
                </div>
              </div>
              
              {sale.ghi_chu && (
                <div className="pt-4 border-t">
                  <span className="text-sm text-gray-600">Ghi chú:</span>
                  <p className="mt-1 text-gray-900">{sale.ghi_chu}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Sản phẩm ({sale.sale_items?.length || 0} món)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sale.sale_items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {item.products?.ten_hang || 'Sản phẩm không xác định'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Mã: {item.products?.ma_hang || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {item.so_luong} x {item.gia_ban.toLocaleString('vi-VN')} ₫
                      </p>
                      <p className="font-medium text-gray-900">
                        {(item.thanh_tien || item.so_luong * item.gia_ban).toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-lg font-medium">Tổng cộng:</span>
                <span className="text-xl font-bold text-blue-600">
                  {sale.tong_tien.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
