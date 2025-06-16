import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Package,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Calendar,
  Loader2
} from 'lucide-react';
import { useInventoryTransactions } from '@/hooks/useInventory';
import { AddInventoryDialog } from '@/components/AddInventoryDialog';
import { useToast } from '@/hooks/use-toast';

export const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('Tất cả');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: transactions, isLoading, error } = useInventoryTransactions();
  const { toast } = useToast();

  useEffect(() => {
    // Focus sur l'input au montage du composant
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'nhap': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'xuat': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'dieu_chinh': return <RotateCcw className="h-4 w-4 text-blue-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionText = (type: string) => {
    switch (type) {
      case 'nhap': return 'Nhập kho';
      case 'xuat': return 'Xuất kho';
      case 'dieu_chinh': return 'Điều chỉnh';
      default: return type;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'nhap': return 'bg-green-100 text-green-800';
      case 'xuat': return 'bg-red-100 text-red-800';
      case 'dieu_chinh': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        Có lỗi xảy ra khi tải dữ liệu giao dịch kho
      </div>
    );
  }

  const transactionTypes = ['Tất cả', 'nhap', 'xuat', 'dieu_chinh'];
  
  const filteredTransactions = transactions?.filter(transaction =>
    (transaction.products?.ten_hang.toLowerCase().includes(searchTerm.toLowerCase()) ||
     transaction.products?.ma_hang.toLowerCase().includes(searchTerm.toLowerCase()) ||
     transaction.ghi_chu?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedType === 'Tất cả' || transaction.loai_giao_dich === selectedType)
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Kho hàng</h1>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm giao dịch
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                ref={inputRef}
                placeholder="Tìm kiếm theo tên hoặc mã sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {transactionTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'Tất cả' ? type : getTransactionText(type)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.map((transaction) => (
          <Card key={transaction.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getTransactionIcon(transaction.loai_giao_dich)}
                    <Badge className={getTransactionColor(transaction.loai_giao_dich)}>
                      {getTransactionText(transaction.loai_giao_dich)}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {transaction.products?.ten_hang}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Mã: {transaction.products?.ma_hang}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {transaction.loai_giao_dich === 'xuat' ? '-' : '+'}{transaction.so_luong}
                    </p>
                    <p className="text-sm text-gray-500">Số lượng</p>
                  </div>

                  {transaction.gia_tri && (
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {transaction.gia_tri.toLocaleString('vi-VN')} ₫
                      </p>
                      <p className="text-sm text-gray-500">Giá trị</p>
                    </div>
                  )}

                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {transaction.ngay_giao_dich 
                          ? new Date(transaction.ngay_giao_dich).toLocaleDateString('vi-VN')
                          : 'N/A'
                        }
                      </span>
                    </div>
                    {transaction.nguoi_thuc_hien && (
                      <p className="text-sm text-gray-500 mt-1">
                        {transaction.nguoi_thuc_hien}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {transaction.ghi_chu && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">{transaction.ghi_chu}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy giao dịch</h3>
            <p className="text-gray-500">Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc.</p>
          </CardContent>
        </Card>
      )}

      <AddInventoryDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
      />
    </div>
  );
};
