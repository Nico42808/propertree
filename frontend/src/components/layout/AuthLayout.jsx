/**
 * AuthLayout - Layout for authentication pages (Login, Register, etc.)
 */
import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="propertree-auth-surface flex min-h-screen flex-col text-propertree-dark">
      <header className="border-b border-gray-100 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Propertree" className="h-8 w-auto object-contain" />
            <span className="text-xl font-semibold tracking-tight text-propertree-dark sm:text-2xl">Propertree</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-grow items-center justify-center px-6 py-14 lg:px-8 lg:py-20">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-5 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; 2026 Propertree. Property management, simplified.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
