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
  Menu,
  X,
  UserIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      // Lấy role từ user metadata hoặc từ bảng staff nếu cần
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
        title: "Lỗi đăng xuất",
        description: "Không thể đăng xuất. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'products', label: 'Sản phẩm', icon: Package },
    { id: 'inventory', label: 'Kho hàng', icon: ShoppingCart },
    { id: 'sales', label: 'Bán hàng', icon: ShoppingCart },
    { id: 'customers', label: 'Khách hàng', icon: Users },
    { id: 'analytics', label: 'Báo cáo', icon: BarChart3 },
    ...(isAdmin ? [{ id: 'users', label: 'Quản lý users', icon: User }] : []),
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: UserIcon },
  ];

  // Sidebar content as a function for reuse
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo and Title */}
      <div className="p-6">
        <h1 className="text-xl font-bold text-sidebar-primary">Ánh Tuyết Cosmetics</h1>
        <p className="text-sm text-sidebar-foreground">Quản lý cửa hàng</p>
      </div>
      <Separator className="bg-sidebar-border" />
      {/* User Info */}
      <div className="p-4">
        <div className="flex items-center space-x-3 p-2 rounded-lg bg-sidebar-accent">
          <div className="p-2 rounded-full bg-sidebar-primary">
            <User className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.user_metadata?.ten_nhan_vien || user?.email}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
      <Separator className="bg-sidebar-border" />
      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className={`w-full justify-start ${
                  activeTab === item.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                onClick={() => {
                  setActiveTab(item.id);
                  setOpenMobile(false);
                }}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </ScrollArea>
      <Separator className="bg-sidebar-border" />
      {/* Logout Button */}
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
      {/* Nút mở sidebar trên mobile */}
      <button
        className="block md:hidden fixed top-4 left-4 z-50 bg-white rounded-full p-2 shadow-lg border border-gray-200"
        onClick={() => setOpenMobile(true)}
        aria-label="Mở menu"
      >
        <Menu className="h-6 w-6 text-gray-700" />
      </button>

      {/* Sidebar cho desktop */}
      <div className="hidden md:block h-full w-64 bg-sidebar-background border-r border-sidebar-border flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Sidebar overlay cho mobile */}
      {openMobile && (
        <div className="fixed inset-0 z-50 bg-black/40 flex">
          <div className="relative h-full w-64 bg-white bg-sidebar-background border-r border-sidebar-border flex-shrink-0 animate-slide-in-left">
            {/* Nút đóng */}
            <button
              className="absolute top-4 right-4 z-50 bg-white rounded-full p-1 shadow border border-gray-200"
              onClick={() => setOpenMobile(false)}
              aria-label="Đóng menu"
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>
            {sidebarContent}
          </div>
          {/* Click ra ngoài để đóng */}
          <div className="flex-1" onClick={() => setOpenMobile(false)} />
        </div>
      )}
    </>
  );
}
