/**
 * MainLayout - Main application layout with Navbar and Footer
 */
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="flex min-h-screen flex-col bg-white text-propertree-dark">
      <Navbar />
      <main className={`flex-grow ${isLanding ? '' : 'propertree-subpage'}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
