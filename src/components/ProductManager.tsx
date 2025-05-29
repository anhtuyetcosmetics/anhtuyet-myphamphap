
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
  Package,
  DollarSign,
  BarChart3
} from 'lucide-react';

const mockProducts = [
  { id: 1, name: 'Hạt cà phê cao cấp', category: 'Đồ uống', price: 249000, stock: 150, status: 'Còn hàng' },
  { id: 2, name: 'Bộ sưu tập trà hữu cơ', category: 'Đồ uống', price: 185000, stock: 8, status: 'Sắp hết' },
  { id: 3, name: 'Thanh chocolate thủ công', category: 'Kẹo', price: 129000, stock: 0, status: 'Hết hàng' },
  { id: 4, name: 'Bánh croissant tươi', category: 'Bánh kẹo', price: 35000, stock: 45, status: 'Còn hàng' },
  { id: 5, name: 'Bánh sandwich cao cấp', category: 'Thức ăn', price: 89000, stock: 23, status: 'Còn hàng' },
];

export const ProductManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Còn hàng': return 'bg-emerald-100 text-emerald-800';
      case 'Sắp hết': return 'bg-amber-100 text-amber-800';
      case 'Hết hàng': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === 'Tất cả' || product.category === selectedCategory)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Thêm sản phẩm
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Tất cả">Tất cả danh mục</option>
              <option value="Đồ uống">Đồ uống</option>
              <option value="Kẹo">Kẹo</option>
              <option value="Bánh kẹo">Bánh kẹo</option>
              <option value="Thức ăn">Thức ăn</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">{product.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{product.category}</p>
                </div>
                <Badge className={getStatusColor(product.status)}>
                  {product.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-lg font-bold text-gray-900">{product.price.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{product.stock} sản phẩm</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-3 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Sửa
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Thống kê
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
            <p className="text-gray-500">Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
