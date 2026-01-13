/**
 * Navbar component - Main navigation bar
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks';
import { Avatar, Button, LanguageSwitcher } from '../common';
import { Menu, X, Home, Heart, Calendar, LayoutDashboard, LogOut, User, Wrench, TrendingUp, Activity, Building } from 'lucide-react';

const Navbar = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout, isLandlord, isTenant, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (isLandlord()) return '/landlord/dashboard';
    if (isTenant()) return '/tenant/bookings';
    return '/admin/dashboard';
  };

  return (
    <nav className="bg-white shadow-subtle sticky top-0 z-40 border-b border-propertree-cream-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 gap-3 sm:gap-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <img src="/logo.jpg" alt="Propertree" className="h-8 sm:h-10 w-auto object-contain" />
              <span className="text-base sm:text-lg lg:text-2xl font-bold text-propertree-dark whitespace-nowrap">Propertree</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2 flex-1 min-w-0 justify-end">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-1 lg:space-x-2">
                  {isTenant() && (
                    <>
                      <Link
                        to="/tenant/bookings"
                        className="text-propertree-dark hover:text-propertree-green px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        {t('navbar.myBookings')}
                      </Link>
                      <Link
                        to="/tenant/favorites"
                        className="text-propertree-dark hover:text-propertree-green px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <Heart className="w-4 h-4 flex-shrink-0" />
                        {t('navbar.favorites')}
                      </Link>
                    </>
                  )}

                  {isLandlord() && (
                    <>
                      <Link
                        to="/landlord/dashboard"
                        className="text-propertree-dark hover:text-propertree-green px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                        {t('common.dashboard')}
                      </Link>
                      <Link
                        to="/landlord/properties"
                        className="text-propertree-dark hover:text-propertree-green px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <Building className="w-4 h-4 flex-shrink-0" />
                        {t('navbar.myProperties')}
                      </Link>
                      <Link
                        to="/landlord/bookings"
                        className="text-propertree-dark hover:text-propertree-green px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        {t('navbar.bookings')}
                      </Link>
                      <Link
                        to="/landlord/services"
                        className="text-propertree-dark hover:text-propertree-green px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <Wrench className="w-4 h-4 flex-shrink-0" />
                        {t('navbar.services')}
                      </Link>
                    </>
                  )}

                  {isAdmin() && (
                    <>
                      <Link
                        to="/admin/dashboard"
                        className="text-propertree-dark hover:text-propertree-green px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                        {t('common.dashboard')}
                      </Link>
                      <Link
                        to="/admin/properties"
                        className="text-propertree-dark hover:text-propertree-green px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <Building className="w-4 h-4 flex-shrink-0" />
                        {t('navbar.properties')}
                      </Link>
                      <Link
                        to="/admin/bookings"
                        className="text-propertree-dark hover:text-propertree-green px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        {t('navbar.bookings')}
                      </Link>
                      <Link
                        to="/admin/service-bookings"
                        className="text-propertree-dark hover:text-propertree-green px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <Wrench className="w-4 h-4 flex-shrink-0" />
                        {t('navbar.serviceRequests')}
                      </Link>
                      <Link
                        to="/admin/users"
                        className="text-propertree-dark hover:text-propertree-green px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <User className="w-4 h-4 flex-shrink-0" />
                        {t('navbar.users')}
                      </Link>
                      <Link
                        to="/admin/analytics"
                        className="text-propertree-dark hover:text-propertree-green px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <TrendingUp className="w-4 h-4 flex-shrink-0" />
                        {t('navbar.analytics')}
                      </Link>
                      <Link
                        to="/admin/performance"
                        className="text-propertree-dark hover:text-propertree-green px-2 lg:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <Activity className="w-4 h-4 flex-shrink-0" />
                        {t('navbar.performance')}
                      </Link>
                    </>
                  )}
                </div>

                {/* Language Switcher */}
                <div className="flex-shrink-0 ml-2">
                  <LanguageSwitcher />
                </div>

                {/* Profile Dropdown */}
                <div className="relative flex-shrink-0 ml-2">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <Avatar 
                      src={user?.profile_photo} 
                      name={user?.first_name} 
                      size="sm" 
                    />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-card py-1 border border-propertree-cream-300">
                      <Link
                        to={getDashboardLink()}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        {t('common.dashboard')}
                      </Link>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        {t('common.profile')}
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('common.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 flex-shrink-0">
                <LanguageSwitcher />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  {t('common.login')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  {t('common.signUp')}
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-propertree-dark hover:text-propertree-green hover:bg-propertree-cream-100 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto px-2 pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-gray-700 hover:text-propertree-blue hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.dashboard')}
                </Link>
                {isLandlord() && (
                  <>
                    <Link
                      to="/landlord/properties"
                      className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-gray-700 hover:text-propertree-blue hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('navbar.myProperties')}
                    </Link>
                    <Link
                      to="/landlord/bookings"
                      className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-gray-700 hover:text-propertree-blue hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('navbar.bookings')}
                    </Link>
                    <Link
                      to="/landlord/services"
                      className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-gray-700 hover:text-propertree-blue hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('navbar.services')}
                    </Link>
                  </>
                )}
                {isTenant() && (
                  <>
                    <Link
                      to="/tenant/bookings"
                      className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-gray-700 hover:text-propertree-blue hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('navbar.myBookings')}
                    </Link>
                    <Link
                      to="/tenant/favorites"
                      className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-gray-700 hover:text-propertree-blue hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('navbar.favorites')}
                    </Link>
                  </>
                )}
                {isAdmin() && (
                  <>
                    <Link
                      to="/admin/properties"
                      className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-gray-700 hover:text-propertree-blue hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('navbar.properties')}
                    </Link>
                    <Link
                      to="/admin/bookings"
                      className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-gray-700 hover:text-propertree-blue hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('navbar.bookings')}
                    </Link>
                    <Link
                      to="/admin/service-bookings"
                      className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-gray-700 hover:text-propertree-blue hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('navbar.serviceRequests')}
                    </Link>
                    <Link
                      to="/admin/users"
                      className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-gray-700 hover:text-propertree-blue hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('navbar.users')}
                    </Link>
                    <Link
                      to="/admin/analytics"
                      className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-gray-700 hover:text-propertree-blue hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('navbar.analytics')}
                    </Link>
                    <Link
                      to="/admin/performance"
                      className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-gray-700 hover:text-propertree-blue hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('navbar.performance')}
                    </Link>
                  </>
                )}
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-gray-700 hover:text-propertree-blue hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.profile')}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-sm sm:text-base font-medium text-red-600 hover:bg-red-50"
                >
                  {t('common.logout')}
                </button>
              </>
            ) : (
              <>
                <div className="px-3 py-2">
                  <LanguageSwitcher />
                </div>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-gray-700 hover:text-propertree-blue hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.login')}
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-gray-700 hover:text-propertree-blue hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.signUp')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
