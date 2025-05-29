
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Calendar,
  ShoppingBag,
  Star
} from 'lucide-react';

const mockCustomers = [
  {
    id: 1,
    name: 'Nguyễn Thị Hoa',
    email: 'hoa.nguyen@email.com',
    phone: '+84 901 234 567',
    joinDate: '2024-01-10',
    totalSpent: 2345000,
    visits: 12,
    status: 'VIP',
    lastVisit: '2024-01-14'
  },
  {
    id: 2,
    name: 'Trần Văn Nam',
    email: 'nam.tran@email.com',
    phone: '+84 987 654 321',
    joinDate: '2024-01-05',
    totalSpent: 892500,
    visits: 5,
    status: 'Thường xuyên',
    lastVisit: '2024-01-13'
  },
  {
    id: 3,
    name: 'Lê Thị Mai',
    email: 'mai.le@email.com',
    phone: '+84 456 789 012',
    joinDate: '2023-12-20',
    totalSpent: 4567500,
    visits: 28,
    status: 'VIP',
    lastVisit: '2024-01-15'
  },
  {
    id: 4,
    name: 'Phạm Minh Tuấn',
    email: 'tuan.pham@email.com',
    phone: '+84 321 987 654',
    joinDate: '2024-01-12',
    totalSpent: 325000,
    visits: 2,
    status: 'Mới',
    lastVisit: '2024-01-12'
  }
];

export const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Tất cả');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VIP': return 'bg-purple-100 text-purple-800';
      case 'Thường xuyên': return 'bg-blue-100 text-blue-800';
      case 'Mới': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedStatus === 'Tất cả' || customer.status === selectedStatus)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý khách hàng</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Thêm khách hàng
        </Button>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tổng khách hàng</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">573</div>
            <p className="text-xs text-blue-600 mt-1">+12% tháng này</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Khách VIP</CardTitle>
            <Star className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">89</div>
            <p className="text-xs text-purple-600 mt-1">15.5% tổng số</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Mới tháng này</CardTitle>
            <Calendar className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">24</div>
            <p className="text-xs text-emerald-600 mt-1">+8 so với tháng trước</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Chi tiêu TB</CardTitle>
            <ShoppingBag className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">789.000 ₫</div>
            <p className="text-xs text-amber-600 mt-1">Mỗi khách hàng</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="VIP">VIP</option>
              <option value="Thường xuyên">Thường xuyên</option>
              <option value="Mới">Mới</option>
            </select>
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
                  <CardTitle className="text-lg font-semibold text-gray-900">{customer.name}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getStatusColor(customer.status)}>
                      {customer.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{customer.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Tham gia {new Date(customer.joinDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                <div className="pt-3 border-t space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tổng chi tiêu:</span>
                    <span className="font-semibold text-gray-900">{customer.totalSpent.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Lượt mua:</span>
                    <span className="font-semibold text-gray-900">{customer.visits}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Mua cuối:</span>
                    <span className="text-sm text-gray-900">{new Date(customer.lastVisit).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4">
                  Xem chi tiết
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
