
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User,
  Mail,
  Phone,
  MapPin,
  Loader2
} from 'lucide-react';
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers';
import { AddCustomerDialog } from '@/components/AddCustomerDialog';
import { EditCustomerDialog } from '@/components/EditCustomerDialog';
import { useToast } from '@/hooks/use-toast';

export const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  
  const { data: customers, isLoading, error } = useCustomers();
  const deleteCustomer = useDeleteCustomer();
  const { toast } = useToast();

  const handleDeleteCustomer = async (id: number) => {
    try {
      await deleteCustomer.mutateAsync(id);
      toast({
        title: "Thành công",
        description: "Đã xóa khách hàng thành công",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa khách hàng",
        variant: "destructive",
      });
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
        Có lỗi xảy ra khi tải dữ liệu khách hàng
      </div>
    );
  }

  const filteredCustomers = customers?.filter(customer =>
    customer.ten_khach_hang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.ma_khach_hang.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý khách hàng</h1>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm khách hàng
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">{customer.ten_khach_hang}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Mã: {customer.ma_khach_hang}</p>
                </div>
                <User className="h-8 w-8 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customer.dien_thoai && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{customer.dien_thoai}</span>
                  </div>
                )}
                
                {customer.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{customer.email}</span>
                  </div>
                )}
                
                {customer.dia_chi && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{customer.dia_chi}</span>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      Tổng mua: {customer.tong_mua?.toLocaleString('vi-VN') || 0} ₫
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-3 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setEditingCustomer(customer)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Sửa
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteCustomer(customer.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy khách hàng</h3>
            <p className="text-gray-500">Thử điều chỉnh từ khóa tìm kiếm.</p>
          </CardContent>
        </Card>
      )}

      <AddCustomerDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
      />

      {editingCustomer && (
        <EditCustomerDialog 
          customer={editingCustomer}
          open={!!editingCustomer}
          onOpenChange={(open) => !open && setEditingCustomer(null)}
        />
      )}
    </div>
  );
};
