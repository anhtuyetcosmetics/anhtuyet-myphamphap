
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  onEditProduct, 
  onDeleteProduct 
}) => {
  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
          <p className="text-gray-500">Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEditProduct}
          onDelete={onDeleteProduct}
        />
      ))}
    </div>
  );
};
