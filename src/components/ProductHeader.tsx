
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ProductHeaderProps {
  onAddProduct: () => void;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({ onAddProduct }) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-gray-900">Sản phẩm</h1>
      <Button 
        className="bg-blue-600 hover:bg-blue-700"
        onClick={onAddProduct}
      >
        <Plus className="h-4 w-4 mr-2" />
        Thêm sản phẩm
      </Button>
    </div>
  );
};
