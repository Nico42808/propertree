/**
 * MainLayout - Main application layout with Navbar and Footer
 */
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  // Footer links open real subpages. Always start a newly opened route at the top
  // instead of keeping the scroll position from the bottom of the previous page.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

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
