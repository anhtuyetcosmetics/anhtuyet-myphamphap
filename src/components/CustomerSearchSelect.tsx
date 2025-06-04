import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, Search } from 'lucide-react';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { AddCustomerDialog } from './AddCustomerDialog';
import { useDebounce } from '@/hooks/use-debounce';
import * as Portal from '@radix-ui/react-portal';

interface CustomerSearchSelectProps {
  selectedCustomerId: number | null;
  onCustomerSelect: (customerId: number | null) => void;
}

const ITEMS_PER_PAGE = 5; // Giảm xuống 5 khách hàng

export const CustomerSearchSelect: React.FC<CustomerSearchSelectProps> = ({
  selectedCustomerId,
  onCustomerSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { data: customerResult } = useCustomers();
  const customers = customerResult?.data || [];

  const selectedCustomer = useMemo(() => 
    customers.find(c => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const filteredCustomers = useMemo(() => {
    let filtered = customers;
    
    // Sắp xếp theo ngày mua gần nhất (giả sử có trường ngay_mua_gan_nhat)
    filtered = [...filtered].sort((a, b) => {
      const dateA = a.ngay_mua_gan_nhat ? new Date(a.ngay_mua_gan_nhat).getTime() : 0;
      const dateB = b.ngay_mua_gan_nhat ? new Date(b.ngay_mua_gan_nhat).getTime() : 0;
      return dateB - dateA; // Sắp xếp giảm dần
    });

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.ten_khach_hang.toLowerCase().includes(searchLower) ||
        (customer.dien_thoai && customer.dien_thoai.replace(/\s+/g, '').includes(searchLower.replace(/\s+/g, '')))
      );
    }
    
    return filtered.slice(0, ITEMS_PER_PAGE);
  }, [customers, debouncedSearch]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  return (
    <>
      <div className="space-y-2">
        <Label>Khách hàng</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-white border-blue-200 hover:border-blue-400 text-sm sm:text-base"
            >
              <span className="truncate">
                {selectedCustomer 
                  ? `${selectedCustomer.ten_khach_hang}${selectedCustomer.dien_thoai ? ` (${selectedCustomer.dien_thoai})` : ''}`
                  : "Khách lẻ"
                }
              </span>
              <Search className="ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          {open && (
            <Portal.Root>
              <div 
                className="fixed inset-0 z-50"
                onClick={() => setOpen(false)}
              >
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-white border-t border-blue-200 shadow-lg"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="max-h-[50vh] overflow-hidden flex flex-col">
                    <Command shouldFilter={false} className="flex-1">
                      <CommandInput 
                        placeholder="Tìm kiếm khách hàng..." 
                        value={searchQuery}
                        onValueChange={handleSearch}
                        className="text-sm sm:text-base"
                      />
                      <CommandList className="flex-1 overflow-y-auto">
                        <CommandEmpty>Không tìm thấy khách hàng</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              onCustomerSelect(null);
                              setOpen(false);
                            }}
                            className="hover:bg-blue-50 text-sm sm:text-base"
                          >
                            Khách lẻ
                          </CommandItem>
                          {filteredCustomers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              onSelect={() => {
                                onCustomerSelect(customer.id);
                                setOpen(false);
                              }}
                              className="hover:bg-blue-50"
                            >
                              <div className="flex flex-col w-full">
                                <span className="font-medium text-sm sm:text-base">{customer.ten_khach_hang}</span>
                                {customer.dien_thoai && (
                                  <span className="text-xs sm:text-sm text-gray-500">📞 {customer.dien_thoai}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                    <div className="p-2 border-t border-blue-100">
                      <Button
                        size="sm"
                        className="w-full bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base"
                        onClick={() => {
                          setAddCustomerOpen(true);
                          setOpen(false);
                        }}
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Thêm khách hàng mới
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Portal.Root>
          )}
        </Popover>
      </div>

      <AddCustomerDialog
        open={addCustomerOpen}
        onOpenChange={setAddCustomerOpen}
      />
    </>
  );
};
