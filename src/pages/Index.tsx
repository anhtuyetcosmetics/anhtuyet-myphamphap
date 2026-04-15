import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { MobileTopBar } from '@/components/MobileTopBar';
import { Dashboard } from '@/components/Dashboard';
import { ProductManager } from '@/components/ProductManager';
import { Inventory } from '@/components/Inventory';
import { Sales } from '@/components/Sales';
import { Customers } from '@/components/Customers';
import { Analytics } from '@/components/Analytics';
import { UserManagement } from '@/components/UserManagement';
import { ProfileForm } from '@/components/ProfileForm';

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Tổng quan',
  products: 'Sản phẩm',
  inventory: 'Kho hàng',
  sales: 'Bán hàng',
  customers: 'Khách hàng',
  analytics: 'Báo cáo',
  users: 'Quản lý users',
  profile: 'Hồ sơ cá nhân',
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':  return <Dashboard />;
      case 'products':   return <ProductManager />;
      case 'inventory':  return <Inventory />;
      case 'sales':      return <Sales />;
      case 'customers':  return <Customers />;
      case 'analytics':  return <Analytics />;
      case 'users':      return <UserManagement />;
      case 'profile':    return <ProfileForm />;
      default:           return <Dashboard />;
    }
  };

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />
      <main className="flex-1 min-w-0 flex flex-col">
        <MobileTopBar
          title={TAB_TITLES[activeTab] ?? 'Ánh Tuyết Cosmetics'}
          onOpenMenu={() => setMobileMenuOpen(true)}
        />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {renderContent()}
        </div>
        <MobileBottomNav activeTab={activeTab} setActiveTab={handleSelectTab} />
      </main>
    </div>
  );
};

export default Index;
