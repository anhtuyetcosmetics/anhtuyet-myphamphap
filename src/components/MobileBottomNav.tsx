import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Item {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const items: Item[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'sales', label: 'Bán', icon: ShoppingCart },
  { id: 'products', label: 'Sản phẩm', icon: Package },
  { id: 'inventory', label: 'Kho', icon: Boxes },
  { id: 'customers', label: 'Khách', icon: Users },
];

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border pb-safe"
      role="navigation"
      aria-label="Điều hướng chính"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'relative w-full flex flex-col items-center justify-center gap-0.5 py-2 px-1 text-[11px] transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <span
                  className={cn(
                    'flex items-center justify-center h-9 w-9 rounded-full transition-all',
                    active && 'bg-primary/10 scale-105'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className={cn('truncate max-w-full', active && 'font-semibold')}>
                  {item.label}
                </span>
                {active && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
