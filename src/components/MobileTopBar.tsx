import React from 'react';
import { Menu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileTopBarProps {
  title: string;
  onOpenMenu: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({ title, onOpenMenu }) => {
  return (
    <header
      className="md:hidden sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border pt-safe"
      role="banner"
    >
      <div className="flex items-center gap-2 px-3 h-14">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMenu}
          aria-label="Mở menu"
          className="shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <h1 className="text-base font-semibold truncate">{title}</h1>
        </div>
      </div>
    </header>
  );
};
