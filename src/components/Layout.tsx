
import React from 'react';
import Header from './header/Header';
import Footer from './Footer';
import { SkipLinks } from './ui/skip-links';
import { TrialNudge } from './trial/TrialNudge';
import "../styles/production.css"; // This ensures the production CSS is loaded

interface LayoutProps {
  children: React.ReactNode;
  isLoggedIn?: boolean;
  user?: {
    name: string;
    avatarUrl?: string;
    unimogModel?: string;
    vehiclePhotoUrl?: string;
    useVehiclePhotoAsProfile?: boolean;
  };
}

const Layout = ({ children, isLoggedIn, user }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <SkipLinks />
      <Header isLoggedIn={isLoggedIn} user={user} />
      <TrialNudge />
      <main id="main-content" className="flex-1" role="main">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
