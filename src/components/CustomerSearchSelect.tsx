import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, Search } from 'lucide-react';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { AddCustomerDialog } from './AddCustomerDialog';
import { useDebounce } from '@/hooks/use-debounce';
import { removeVietnameseTones } from '@/lib/utils';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  const selectedCustomer = useMemo(() => 
    customers.find(c => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const MAX_RESULTS = 50;

  const filteredCustomers = useMemo(() => {
    if (!debouncedSearch) {
      return customers.slice(0, 5);
    }
    const searchLower = debouncedSearch.toLowerCase();
    const searchNoAccent = removeVietnameseTones(searchLower);
    return customers
      .filter(customer => {
        const nameLower = customer.ten_khach_hang.toLowerCase();
        const nameNoAccent = removeVietnameseTones(nameLower);
        return (
          nameLower.includes(searchLower) ||
          nameNoAccent.includes(searchNoAccent) ||
          (customer.dien_thoai && customer.dien_thoai.replace(/\s+/g, '').includes(searchLower.replace(/\s+/g, '')))
        );
      })
      .slice(0, MAX_RESULTS);
  }, [customers, debouncedSearch]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Tách phần UI CommandList thành 1 biến để dùng cho cả Drawer và Popover
  const customerCommand = (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder="Tìm kiếm khách hàng..."
        value={searchQuery}
        onValueChange={handleSearch}
      />
      <CommandList
        className="max-h-[300px] overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'auto' }}
        tabIndex={0}
        aria-label="Danh sách khách hàng"
      >
        <CommandEmpty>
          {debouncedSearch && filteredCustomers.length >= MAX_RESULTS
            ? "Có quá nhiều kết quả, hãy nhập chi tiết hơn."
            : "Không tìm thấy khách hàng"}
        </CommandEmpty>
        <CommandGroup>
          <CommandItem
            onSelect={() => {
              onCustomerSelect(null);
              setOpen(false);
            }}
            className="hover:bg-blue-50"
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
                <span className="font-medium">{customer.ten_khach_hang}</span>
                {customer.dien_thoai && (
                  <span className="text-sm text-gray-500">📞 {customer.dien_thoai}</span>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="p-2 border-t border-blue-100">
        <Button
          size="sm"
          className="w-full bg-red-600 hover:bg-red-700 text-white"
          onClick={() => {
            setAddCustomerOpen(true);
            setOpen(false);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Thêm khách hàng mới
        </Button>
      </div>
    </Command>
  );

  return (
    <>
      <div className="space-y-2">
        <Label>Khách hàng</Label>
        {isMobile ? (
          <>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-white border-blue-200 hover:border-blue-400"
              onClick={() => setOpen(true)}
            >
              <span className="truncate">
                {selectedCustomer 
                  ? `${selectedCustomer.ten_khach_hang}${selectedCustomer.dien_thoai ? ` (${selectedCustomer.dien_thoai})` : ''}`
                  : "Khách lẻ"
                }
              </span>
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            <Drawer open={open} onOpenChange={setOpen}>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Tìm kiếm khách hàng</DrawerTitle>
                </DrawerHeader>
                <div className="p-2">{customerCommand}</div>
              </DrawerContent>
            </Drawer>
          </>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between bg-white border-blue-200 hover:border-blue-400"
              >
                <span className="truncate">
                  {selectedCustomer 
                    ? `${selectedCustomer.ten_khach_hang}${selectedCustomer.dien_thoai ? ` (${selectedCustomer.dien_thoai})` : ''}`
                    : "Khách lẻ"
                  }
                </span>
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-white border-blue-200 overflow-visible pointer-events-auto" align="start">
              {customerCommand}
            </PopoverContent>
          </Popover>
        )}
      </div>
      <AddCustomerDialog
        open={addCustomerOpen}
        onOpenChange={setAddCustomerOpen}
      />
    </>
  );
};
