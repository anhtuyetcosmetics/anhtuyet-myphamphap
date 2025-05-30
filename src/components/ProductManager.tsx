
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useProducts, useDeleteProduct } from '@/hooks/useProducts';
import { AddProductDialog } from '@/components/AddProductDialog';
import { EditProductDialog } from '@/components/EditProductDialog';
import { ProductHeader } from '@/components/ProductHeader';
import { ProductSearch } from '@/components/ProductSearch';
import { ProductGrid } from '@/components/ProductGrid';
import { useToast } from '@/hooks/use-toast';

export const ProductManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  const { data: products, isLoading, error } = useProducts();
  const deleteProduct = useDeleteProduct();
  const { toast } = useToast();

  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteProduct.mutateAsync(id);
      toast({
        title: "Thành công",
        description: "Đã xóa sản phẩm thành công",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa sản phẩm",
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
        Có lỗi xảy ra khi tải dữ liệu sản phẩm
      </div>
    );
  }

  const categories = ['Tất cả', ...new Set(products?.map(p => p.nhom_hang).filter(Boolean) || [])];

  const filteredProducts = products?.filter(product =>
    product.ten_hang.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === 'Tất cả' || product.nhom_hang === selectedCategory)
  ) || [];

  return (
    <div className="space-y-6">
      <ProductHeader onAddProduct={() => setIsAddDialogOpen(true)} />

      <ProductSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
      />

      <ProductGrid
        products={filteredProducts}
        onEditProduct={setEditingProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      <AddProductDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
      />

      {editingProduct && (
        <EditProductDialog 
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
        />
      )}
    </div>
  );
};
