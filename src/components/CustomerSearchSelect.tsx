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
    if (!debouncedSearch) {
      return customers.slice(0, ITEMS_PER_PAGE);
    }
    
    const searchLower = debouncedSearch.toLowerCase();
    return customers
      .filter(customer =>
        customer.ten_khach_hang.toLowerCase().includes(searchLower) ||
        (customer.dien_thoai && customer.dien_thoai.replace(/\s+/g, '').includes(searchLower.replace(/\s+/g, '')))
      )
      .slice(0, ITEMS_PER_PAGE);
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
          <PopoverContent className="w-full p-0 bg-white border-blue-200" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Tìm kiếm khách hàng..."
                value={searchQuery}
                onValueChange={handleSearch}
              />
              <CommandList className="max-h-[300px] overflow-y-auto">
                <CommandEmpty>Không tìm thấy khách hàng</CommandEmpty>
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
          </PopoverContent>
        </Popover>
      </div>

      <AddCustomerDialog
        open={addCustomerOpen}
        onOpenChange={setAddCustomerOpen}
      />
    </>
  );
};
