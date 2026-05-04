
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Edit,
  Trash2,
  Package,
  DollarSign
} from 'lucide-react';
import { Product } from '@/hooks/useProducts';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete }) => {
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

  const getStatusColor = (stock: number | null) => {
    if (stock && stock < 0) return 'bg-red-100 text-red-800 border border-red-300';
    if (stock === null || stock === 0) return 'bg-red-100 text-red-800';
    if (stock < 10) return 'bg-amber-100 text-amber-800';
    return 'bg-emerald-100 text-emerald-800';
  };

  const getStatusText = (stock: number | null) => {
    if (stock && stock < 0) return '⚠ Lỗi tồn kho';
    if (stock === null || stock === 0) return 'Hết hàng';
    if (stock < 10) return 'Sắp hết';
    return 'Còn hàng';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">{product.ten_hang}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">{product.nhom_hang || 'Chưa phân loại'}</p>
            <p className="text-xs text-gray-400 mt-1">Mã: {product.ma_hang}</p>
          </div>
          <Badge className={getStatusColor(product.ton_kho)}>
            {getStatusText(product.ton_kho)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-lg font-bold text-gray-900">
                {product.gia_ban !== null && product.gia_ban !== undefined
                  ? `${product.gia_ban.toLocaleString('vi-VN')} ₫`
                  : <span className="text-gray-400 italic">Chưa có giá</span>
                }
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span className={`text-sm ${product.ton_kho && product.ton_kho < 0 ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                {product.ton_kho && product.ton_kho < 0
                  ? `${product.ton_kho} sản phẩm (lỗi)`
                  : `${product.ton_kho || 0} sản phẩm`
                }
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(product)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Sửa
            </Button>
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xoá sản phẩm</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc muốn xoá sản phẩm "{product.ten_hang}"? Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex justify-end gap-2">
                  <AlertDialogCancel>Huỷ</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      onDelete(product.id);
                      setDeleteAlertOpen(false);
                    }}
                  >
                    Xoá
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
