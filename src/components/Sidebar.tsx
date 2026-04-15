import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  LogOut,
  User,
  X,
  UserIcon,
  Boxes,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab, mobileOpen, onMobileOpenChange }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const navigate = useNavigate();

  const isControlled = mobileOpen !== undefined && onMobileOpenChange !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const openMobile = isControlled ? mobileOpen! : internalOpen;
  const setOpenMobile = (v: boolean) => {
    if (isControlled) onMobileOpenChange!(v);
    else setInternalOpen(v);
  };

  React.useEffect(() => {
    if (user) {
      (async () => {
        const { data } = await supabase
          .from('staff')
          .select('role')
          .eq('id', user.id)
          .single();
        setIsAdmin(data?.role === 'admin');
      })();
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Lỗi đăng xuất',
        description: 'Không thể đăng xuất. Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'sales', label: 'Bán hàng', icon: ShoppingCart },
    { id: 'products', label: 'Sản phẩm', icon: Package },
    { id: 'inventory', label: 'Kho hàng', icon: Boxes },
    { id: 'customers', label: 'Khách hàng', icon: Users },
    { id: 'analytics', label: 'Báo cáo', icon: BarChart3 },
    ...(isAdmin ? [{ id: 'users', label: 'Quản lý users', icon: User }] : []),
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: UserIcon },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Brand */}
      <div className="p-5 pt-safe">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-brand-gradient grid place-items-center shadow-pop">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-brand-gradient leading-tight truncate">
              Ánh Tuyết Cosmetics
            </h1>
            <p className="text-[11px] text-sidebar-foreground/60 leading-tight">
              Quản lý cửa hàng
            </p>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-sidebar-accent">
          <div className="h-9 w-9 rounded-full bg-sidebar-primary grid place-items-center shrink-0">
            <User className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.user_metadata?.ten_nhan_vien || user?.email}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 py-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setOpenMobile(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow-pop font-semibold'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      <div className="p-3 pb-safe">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:block h-screen sticky top-0 w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {openMobile && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex md:hidden"
          onClick={() => setOpenMobile(false)}
        >
          <div
            className="relative h-full w-72 bg-sidebar border-r border-sidebar-border animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 z-50 bg-background/80 rounded-full p-1.5 shadow border border-border"
              onClick={() => setOpenMobile(false)}
              aria-label="Đóng menu"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
