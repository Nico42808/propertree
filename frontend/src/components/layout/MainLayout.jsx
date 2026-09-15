/**
 * MainLayout - Main application layout with Navbar and Footer
 */
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const marketingPaths = new Set([
  '/',
  '/about',
  '/careers',
  '/blog',
  '/help',
  '/contact',
  '/terms',
  '/privacy',
]);

const MainLayout = () => {
  const location = useLocation();
  const isMarketingPage = marketingPaths.has(location.pathname);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-propertree-dark">
      <Navbar />
      <main className={`flex-grow ${isMarketingPage ? '' : 'propertree-subpage'}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
