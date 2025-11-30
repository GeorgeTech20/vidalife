import { ReactNode } from 'react';

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

const MobileLayout = ({ children, showNav = true }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md relative min-h-screen bg-background overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default MobileLayout;
