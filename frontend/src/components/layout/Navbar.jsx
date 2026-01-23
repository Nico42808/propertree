/**
 * Navbar component - Main navigation bar
 */
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks';
import { Avatar, Button, LanguageSwitcher } from '../common';
import { Menu, X, Home, Heart, Calendar, LayoutDashboard, LogOut, User, Wrench, TrendingUp, Activity, Building } from 'lucide-react';

const Navbar = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout, isLandlord, isTenant, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isAdminUser = isAuthenticated && isAdmin();
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
    <nav className={`sticky top-0 z-40 ${isLanding ? 'bg-slate-50' : 'bg-white shadow-subtle border-b border-propertree-cream-300'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-[4.5rem] gap-4 sm:gap-5">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <img
                src="/logo.png"
                alt="Propertree"
                className={`${isAdminUser ? 'h-6 sm:h-7' : 'h-7 sm:h-8'} w-auto object-contain`}
              />
              <span className={`${isAdminUser ? 'text-base sm:text-lg' : 'text-lg sm:text-xl lg:text-2xl'} font-bold text-propertree-dark whitespace-nowrap`}>
                Propertree
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-1 min-w-0 justify-end">
            {isAuthenticated ? (
              <>
                <div className={`flex items-center ${isAdminUser ? 'gap-1 lg:gap-2' : 'gap-2 lg:gap-3'}`}>
                  {isTenant() && (
                    <>
                      <Link
                        to="/tenant/bookings"
                        className="text-propertree-dark hover:text-propertree-green px-3 lg:px-4 py-2.5 rounded-lg text-base font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <Calendar className="w-5 h-5 flex-shrink-0" />
                        {t('navbar.myBookings')}
                      </Link>
                      <Link
                        to="/tenant/favorites"
                        className="text-propertree-dark hover:text-propertree-green px-3 lg:px-4 py-2.5 rounded-lg text-base font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <Heart className="w-5 h-5 flex-shrink-0" />
                        {t('navbar.favorites')}
                      </Link>
                    </>
                  )}

                  {isLandlord() && (
                    <>
                      <Link
                        to="/landlord/dashboard"
                        className="text-propertree-dark hover:text-propertree-green px-3 lg:px-4 py-2.5 rounded-lg text-base font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                        {t('common.dashboard')}
                      </Link>
                      <Link
                        to="/landlord/properties"
                        className="text-propertree-dark hover:text-propertree-green px-3 lg:px-4 py-2.5 rounded-lg text-base font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <Building className="w-5 h-5 flex-shrink-0" />
                        {t('navbar.myProperties')}
                      </Link>
                      <Link
                        to="/landlord/bookings"
                        className="text-propertree-dark hover:text-propertree-green px-3 lg:px-4 py-2.5 rounded-lg text-base font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <Calendar className="w-5 h-5 flex-shrink-0" />
                        {t('navbar.bookings')}
                      </Link>
                      <Link
                        to="/landlord/services"
                        className="text-propertree-dark hover:text-propertree-green px-3 lg:px-4 py-2.5 rounded-lg text-base font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <Wrench className="w-5 h-5 flex-shrink-0" />
                        {t('navbar.services')}
                      </Link>
                    </>
                  )}

                  {isAdmin() && (
                    <>
                      <Link
                        to="/admin/dashboard"
                        className={`text-propertree-dark hover:text-propertree-green rounded-lg font-medium transition-colors flex items-center whitespace-nowrap ${isAdminUser ? 'px-2.5 lg:px-3 py-2 text-sm gap-1.5' : 'px-3 lg:px-4 py-2.5 text-base gap-2'}`}
                      >
                        <LayoutDashboard className={`${isAdminUser ? 'w-4 h-4' : 'w-5 h-5'} flex-shrink-0`} />
                        {t('common.dashboard')}
                      </Link>
                      <Link
                        to="/admin/properties"
                        className={`text-propertree-dark hover:text-propertree-green rounded-lg font-medium transition-colors flex items-center whitespace-nowrap ${isAdminUser ? 'px-2.5 lg:px-3 py-2 text-sm gap-1.5' : 'px-3 lg:px-4 py-2.5 text-base gap-2'}`}
                      >
                        <Building className={`${isAdminUser ? 'w-4 h-4' : 'w-5 h-5'} flex-shrink-0`} />
                        {t('navbar.properties')}
                      </Link>
                      <Link
                        to="/admin/bookings"
                        className={`text-propertree-dark hover:text-propertree-green rounded-lg font-medium transition-colors flex items-center whitespace-nowrap ${isAdminUser ? 'px-2.5 lg:px-3 py-2 text-sm gap-1.5' : 'px-3 lg:px-4 py-2.5 text-base gap-2'}`}
                      >
                        <Calendar className={`${isAdminUser ? 'w-4 h-4' : 'w-5 h-5'} flex-shrink-0`} />
                        {t('navbar.bookings')}
                      </Link>
                      <Link
                        to="/admin/service-bookings"
                        className={`text-propertree-dark hover:text-propertree-green rounded-lg font-medium transition-colors flex items-center whitespace-nowrap ${isAdminUser ? 'px-2.5 lg:px-3 py-2 text-sm gap-1.5' : 'px-3 lg:px-4 py-2.5 text-base gap-2'}`}
                      >
                        <Wrench className={`${isAdminUser ? 'w-4 h-4' : 'w-5 h-5'} flex-shrink-0`} />
                        {t('navbar.serviceRequests')}
                      </Link>
                      <Link
                        to="/admin/users"
                        className={`text-propertree-dark hover:text-propertree-green rounded-lg font-medium transition-colors flex items-center whitespace-nowrap ${isAdminUser ? 'px-2.5 lg:px-3 py-2 text-sm gap-1.5' : 'px-3 lg:px-4 py-2.5 text-base gap-2'}`}
                      >
                        <User className={`${isAdminUser ? 'w-4 h-4' : 'w-5 h-5'} flex-shrink-0`} />
                        {t('navbar.users')}
                      </Link>
                      <Link
                        to="/admin/analytics"
                        className={`text-propertree-dark hover:text-propertree-green rounded-lg font-medium transition-colors flex items-center whitespace-nowrap ${isAdminUser ? 'px-2.5 lg:px-3 py-2 text-sm gap-1.5' : 'px-3 lg:px-4 py-2.5 text-base gap-2'}`}
                      >
                        <TrendingUp className={`${isAdminUser ? 'w-4 h-4' : 'w-5 h-5'} flex-shrink-0`} />
                        {t('navbar.analytics')}
                      </Link>
                      <Link
                        to="/admin/performance"
                        className={`text-propertree-dark hover:text-propertree-green rounded-lg font-medium transition-colors flex items-center whitespace-nowrap ${isAdminUser ? 'px-2.5 lg:px-3 py-2 text-sm gap-1.5' : 'px-3 lg:px-4 py-2.5 text-base gap-2'}`}
                      >
                        <Activity className={`${isAdminUser ? 'w-4 h-4' : 'w-5 h-5'} flex-shrink-0`} />
                        {t('navbar.performance')}
                      </Link>
                    </>
                  )}
                </div>

                {/* Language Switcher */}
                <div className={`flex-shrink-0 ml-2 ${isAdminUser ? 'scale-90 origin-right [&_span]:hidden lg:[&_span]:inline' : ''}`}>
                  <LanguageSwitcher />
                </div>

                {/* Profile Dropdown */}
                <div className={`relative flex-shrink-0 ${isAdminUser ? 'ml-1' : 'ml-2'}`}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <Avatar 
                      src={user?.profile_photo} 
                      name={user?.first_name} 
                      size={isAdminUser ? 'sm' : 'md'} 
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
                <div className={`${isAdminUser ? 'scale-90 origin-right' : ''}`}>
                  <LanguageSwitcher />
                </div>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => navigate('/login')}
                >
                  {t('common.login')}
                </Button>
                <Button
                  variant="primary"
                  size="md"
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
              className="inline-flex items-center justify-center p-2.5 rounded-lg text-propertree-dark hover:text-propertree-green hover:bg-propertree-cream-100 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <X className="w-7 h-7" />
              ) : (
                <Menu className="w-7 h-7" />
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