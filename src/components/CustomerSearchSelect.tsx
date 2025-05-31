
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, Search } from 'lucide-react';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { AddCustomerDialog } from './AddCustomerDialog';

interface CustomerSearchSelectProps {
  selectedCustomerId: number | null;
  onCustomerSelect: (customerId: number | null) => void;
}

export const CustomerSearchSelect: React.FC<CustomerSearchSelectProps> = ({
  selectedCustomerId,
  onCustomerSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const { data: customers } = useCustomers();

  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);

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
              className="w-full justify-between"
            >
              {selectedCustomer 
                ? `${selectedCustomer.ten_khach_hang} (${selectedCustomer.ma_khach_hang})`
                : "Khách lẻ"
              }
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Tìm kiếm khách hàng..." />
              <CommandList>
                <CommandEmpty>Không tìm thấy khách hàng</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      onCustomerSelect(null);
                      setOpen(false);
                    }}
                  >
                    Khách lẻ
                  </CommandItem>
                  {customers?.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      onSelect={() => {
                        onCustomerSelect(customer.id);
                        setOpen(false);
                      }}
                    >
                      {customer.ten_khach_hang} ({customer.ma_khach_hang})
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
              <div className="p-2 border-t">
                <Button
                  size="sm"
                  className="w-full"
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
