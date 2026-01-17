/**
 * Landing Page - Home page with integrated property search
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container } from '../components/layout';
import { Select, Card, Loading } from '../components/common';
import { Home as HomeIcon, Heart, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks';
import { formatCurrency } from '../utils/formatters';
import { useFavorite, useFavorites } from '../hooks/useProperties';

const LandingPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const resultsRef = useRef(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [shouldScrollToResults, setShouldScrollToResults] = useState(false);
  const [cities, setCities] = useState([]);
  const { addFavorite, removeFavorite } = useFavorite();
  const { data: favoritesData } = useFavorites({ 
    enabled: isAuthenticated 
  });
  
  // Create a map of favorite property IDs for quick lookup
  const favoriteMap = React.useMemo(() => {
    if (!favoritesData) return new Map();
    const map = new Map();
    (favoritesData.results || favoritesData || []).forEach(fav => {
      if (fav.property) {
        map.set(fav.property.id || fav.property, fav.id);
      }
    });
    return map;
  }, [favoritesData]);
  
  const [filters, setFilters] = useState({
    city: '',
    property_type: '',
    guests: '',
    sort_by: 'price_low_high',
    check_in: '',
    check_out: '',
    min_price: '',
    max_price: '',
    min_area: '',
    vicinity: ''
  });

  // Term selection: '', 'short', 'mid', 'long'
  const [term, setTerm] = useState(() => sessionStorage.getItem('bookingTerm') || '');

  const propertyTypes = [
    { value: '', label: t('landing.allTypes') },
    { value: 'apartment', label: t('propertyTypes.apartment') },
    { value: 'house', label: t('propertyTypes.house') },
    { value: 'condo', label: t('propertyTypes.condo') },
    { value: 'villa', label: t('propertyTypes.villa') },
    { value: 'studio', label: t('propertyTypes.studio') },
    { value: 'townhouse', label: t('propertyTypes.townhouse') },
    { value: 'room', label: t('propertyTypes.room', { defaultValue: 'Room' }) },
    { value: 'other', label: t('propertyTypes.other', { defaultValue: 'Other' }) },
  ];

  const guestOptions = [
    { value: '', label: `1 ${t('landing.guest')}` },
    { value: '1', label: `1 ${t('landing.guest')}` },
    { value: '2', label: `2 ${t('landing.guests')}` },
    { value: '3', label: `3 ${t('landing.guests')}` },
    { value: '4', label: `4 ${t('landing.guests')}` },
    { value: '5', label: `5 ${t('landing.guests')}` },
    { value: '6', label: `6+ ${t('landing.guests')}` },
  ];

  const sortOptions = [
    { value: 'price_low_high', label: t('sortOptions.priceLowHigh') },
    { value: 'price_high_low', label: t('sortOptions.priceHighLow') },
    { value: 'newest', label: t('sortOptions.newest') },
    { value: 'bedrooms', label: t('sortOptions.bedrooms') },
  ];

  const minAreaOptions = [
    { value: '', label: t('landing.anyArea', { defaultValue: 'Any size' }) },
    { value: '25', label: '25 m²\u00A0\u00A0+' },
    { value: '50', label: '50 m²\u00A0\u00A0+' },
    { value: '75', label: '75 m²\u00A0\u00A0+' },
    { value: '100', label: '100 m²\u00A0\u00A0+' },
    { value: '150', label: '150 m²\u00A0\u00A0+' },
  ];

  const vicinityOptions = [
    { value: '2', label: t('landing.vicinityDistance', { defaultValue: '{{distance}} km', distance: 1 }) },
    { value: '5', label: t('landing.vicinityDistance', { defaultValue: '{{distance}} km', distance: 5 }) },
    { value: '10', label: t('landing.vicinityDistance', { defaultValue: '{{distance}} km', distance: 10 }) },
    { value: '20', label: t('landing.vicinityDistance', { defaultValue: '{{distance}} km', distance: 20 }) },
  ];

  const vicinityStepIndex = Math.max(
    0,
    vicinityOptions.findIndex((option) => option.value === filters.vicinity)
  );
  const vicinityMax = Math.max(1, vicinityOptions.length - 1);
  const vicinityPercent = Math.round((vicinityStepIndex / vicinityMax) * 100);

  useEffect(() => {
    fetchProperties();
    fetchCities();
  }, []);

  // Auto-scroll to results after search completes
  useEffect(() => {
    if (shouldScrollToResults && !searchLoading && resultsRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        const element = resultsRef.current;
        const headerOffset = 96; // adjust if your navbar height changes
        const elementTop = element.getBoundingClientRect().top + window.scrollY;
        const targetPosition = Math.max(elementTop - headerOffset, 0);

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
        setShouldScrollToResults(false);
      }, 100);
    }
  }, [shouldScrollToResults, searchLoading, properties]);

  const fetchCities = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/properties/`);
      if (response.ok) {
        const data = await response.json();
        const allProperties = data.results || data;
        const uniqueCities = [...new Set(allProperties.map(p => p.city))].sort();
        setCities([
          { value: '', label: t('landing.allCities') },
          ...uniqueCities.map(city => ({ value: city, label: city }))
        ]);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchProperties = async (searchFilters = {}) => {
    const isSearching = Object.keys(searchFilters).length > 0;
    if (isSearching) {
      setSearchLoading(true);
    } else {
      setLoading(true);
    }
    
    try {
      const params = new URLSearchParams();
      
      const activeFilters = { ...filters, ...searchFilters };
      
      if (activeFilters.min_price) params.append('min_price', activeFilters.min_price);
      if (activeFilters.max_price) params.append('max_price', activeFilters.max_price);
      if (activeFilters.guests) params.append('guests', activeFilters.guests);
      if (activeFilters.city) params.append('city', activeFilters.city);
      if (activeFilters.property_type) params.append('property_type', activeFilters.property_type);

      // Apply date range filters so backend can exclude already-booked properties
      if (activeFilters.check_in) params.append('check_in', activeFilters.check_in);
      if (activeFilters.check_out) params.append('check_out', activeFilters.check_out);
      
      // Handle sorting
      if (activeFilters.sort_by) {
        const useMonthly = term === 'mid' || term === 'long';
        if (activeFilters.sort_by === 'price_low_high') {
          params.append('ordering', useMonthly ? 'monthly_price' : 'price_per_night');
        } else if (activeFilters.sort_by === 'price_high_low') {
          params.append('ordering', useMonthly ? '-monthly_price' : '-price_per_night');
        } else if (activeFilters.sort_by === 'newest') {
          params.append('ordering', '-created_at');
        } else if (activeFilters.sort_by === 'bedrooms') {
          params.append('ordering', '-bedrooms');
        }
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const url = `${API_BASE_URL}/properties/?${params.toString()}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setProperties(data.results || data);
      } else {
        toast.error(t('errors.failedToLoadProperties'));
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error(t('errors.errorLoadingProperties'));
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShouldScrollToResults(true);
    fetchProperties(filters);
  };

  const handleFilterChange = (name, value) => {
    // Prevent selecting past dates in the search filters
    if (name === 'check_in' || name === 'check_out') {
      if (value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(value);
        selected.setHours(0, 0, 0, 0);

        if (selected < today) {
          toast.error(t('errors.cannotSearchWithPastDates'));
          return;
        }
      }

      // Ensure check-out is always after check-in
      if (name === 'check_in' && filters.check_out && value && value >= filters.check_out) {
        toast.error(t('errors.checkoutMustBeAfterCheckin'));
        return;
      }

      if (name === 'check_out' && filters.check_in && value && value <= filters.check_in) {
        toast.error(t('errors.checkoutMustBeAfterCheckin'));
        return;
      }
    }

    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleTermSelect = (nextTerm) => {
    setTerm(nextTerm);
    sessionStorage.setItem('bookingTerm', nextTerm);
    setFilters(prev => ({ ...prev, check_out: '' }));
  };

  const getRentalTerms = (property) => {
    const terms = Array.isArray(property?.rental_terms) ? property.rental_terms : [];
    return terms;
  };

  const getNightlyPrice = (property) => {
    const nightly = Number(property?.price_per_night);
    if (Number.isNaN(nightly) || nightly <= 0) {
      return null;
    }
    return nightly;
  };

  const getMonthlyPrice = (property) => {
    const rawMonthly = property?.monthly_price;
    if (rawMonthly !== null && rawMonthly !== undefined && rawMonthly !== '') {
      const monthly = Number(rawMonthly);
      return Number.isNaN(monthly) ? null : monthly;
    }
    const nightly = getNightlyPrice(property);
    return nightly ? nightly * 30 : null;
  };

  const termFilter = (() => {
    if (term === 'short') return 'short_term';
    if (term === 'mid') return 'mid_term';
    if (term === 'long') return 'long_term';
    return '';
  })();

  const visibleProperties = termFilter
    ? properties.filter((property) => getRentalTerms(property).includes(termFilter))
    : properties;

  // Date helpers and term-based bounds
  const addDays = (dateStr, days) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const addMonths = (dateStr, months) => {
    const d = new Date(dateStr);
    const origDay = d.getDate();
    d.setMonth(d.getMonth() + months);
    // If the month roll-over changed the day (e.g., Feb 30 -> Mar 2), adjust to last day of month
    if (d.getDate() < origDay) {
      d.setDate(0); // last day of previous month
    }
    return d.toISOString().split('T')[0];
  };

  const computeCheckOutBounds = () => {
    if (!filters.check_in) return { min: null, max: null };
    const ci = filters.check_in;
    if (term === 'short') {
      return { min: addDays(ci, 1), max: addDays(ci, 28) };
    }
    if (term === 'mid') {
      return { min: addMonths(ci, 1), max: addMonths(ci, 12) };
    }
    if (term === 'long') {
      return { min: addMonths(ci, 12), max: null };
    }
    return { min: addDays(ci, 1), max: null };
  };

  const todayString = new Date().toISOString().split('T')[0];

  // compute bounds for check_out based on selected term and check_in
  const coBounds = computeCheckOutBounds();

  const handleFavoriteClick = async (e, property) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error(t('landing.pleaseLoginToAddFavorites'));
      navigate('/login');
      return;
    }

    const favoriteId = favoriteMap.get(property.id);
    
    if (favoriteId) {
      // Remove from favorites
      removeFavorite.mutate(favoriteId);
    } else {
      // Add to favorites
      addFavorite.mutate(property.id);
    }
  };

  const isPropertyFavorited = (propertyId) => {
    return favoriteMap.has(propertyId);
  };

  if (loading) {
    return (
      <Container className="py-8">
        <Loading />
      </Container>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 sm:py-8">
            <div className="mx-auto max-w-5xl">
              <form
                onSubmit={handleSearch}
                className="rounded-[28px] bg-white/90 backdrop-blur-md shadow-[0_18px_45px_rgba(15,23,42,0.12)] border border-white/70 p-3 sm:p-4"
              >
                <div className="flex flex-col gap-4 sm:gap-5">
                  <div>
                    <div className="bg-slate-100/80 rounded-full p-1 shadow-inner">
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => handleTermSelect('short')}
                          className={`py-1 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap ${term === 'short' ? 'bg-propertree-green text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                        >
                          {t('landing.shortTerm', { defaultValue: 'Short-term' })}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTermSelect('mid')}
                          className={`py-1 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap ${term === 'mid' ? 'bg-propertree-green text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                        >
                          {t('landing.midTerm', { defaultValue: 'Mid-term' })}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTermSelect('long')}
                          className={`py-1 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap ${term === 'long' ? 'bg-propertree-green text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                        >
                          {t('landing.longTerm', { defaultValue: 'Long-term' })}
                        </button>
                      </div>
                    </div>
                    <div className="hidden sm:grid grid-cols-3 gap-2 px-2 text-[10px] text-slate-500 text-center mt-2">
                      <span>{t('landing.shortTermHint', { defaultValue: 'Upto a month' })}</span>
                      <span>{t('landing.midTermHint', { defaultValue: 'Upto a year' })}</span>
                      <span>{t('landing.longTermHint', { defaultValue: '1 Year & above' })}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl sm:rounded-full bg-slate-50/80 border border-slate-200/80 overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                        <div className="group flex flex-col px-4 sm:px-5 py-3 sm:py-4 transition-colors hover:bg-white/80 focus-within:bg-white">
                          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{t('landing.city')}</span>
                          <Select
                            name="city"
                            value={filters.city}
                            onChange={(e) => handleFilterChange('city', e.target.value)}
                            options={cities}
                            placeholder={t('landing.allCities')}
                            variant="minimal"
                            showChevron={false}
                            className="mt-1"
                          />
                        </div>

                        <div className="group flex flex-col px-4 sm:px-5 py-3 sm:py-4 transition-colors hover:bg-white/80 focus-within:bg-white">
                          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{t('landing.propertyType')}</span>
                          <Select
                            name="property_type"
                            value={filters.property_type}
                            onChange={(e) => handleFilterChange('property_type', e.target.value)}
                            options={propertyTypes}
                            placeholder={t('landing.allTypes')}
                            variant="minimal"
                            showChevron={false}
                            className="mt-1"
                          />
                        </div>

                        <div className="group flex flex-col px-4 sm:px-5 py-3 sm:py-4 transition-colors hover:bg-white/80 focus-within:bg-white">
                          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{t('landing.guests')}</span>
                          <Select
                            name="guests"
                            value={filters.guests}
                            onChange={(e) => handleFilterChange('guests', e.target.value)}
                            options={guestOptions}
                            placeholder={`1 ${t('landing.guest')}`}
                            variant="minimal"
                            showChevron={false}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="p-2 md:pr-2 md:pl-3">
                        <button
                          type="submit"
                          className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-propertree-green text-white px-5 py-3 text-sm font-semibold shadow-[0_12px_22px_rgba(47,111,78,0.3)] hover:bg-propertree-green-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propertree-green/30 disabled:opacity-60 disabled:cursor-not-allowed"
                          disabled={searchLoading}
                        >
                          <Search className="w-5 h-5" />
                          <span>{searchLoading ? t('landing.searching') : 'Show offers'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {(term === 'mid' || term === 'long') && (
                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 sm:p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2 text-left">
                            {t('landing.minArea', { defaultValue: 'Minimum Area (m2)' })}
                          </label>
                          <Select
                            name="min_area"
                            value={filters.min_area}
                            onChange={(e) => handleFilterChange('min_area', e.target.value)}
                            options={minAreaOptions}
                            placeholder={t('landing.anyArea', { defaultValue: 'Any size' })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2 text-left">
                            {t('landing.vicinity', { defaultValue: 'Vicinity' })}
                          </label>
                          <div className="w-full px-1 py-1">
                            <input
                              type="range"
                              min="0"
                              max={vicinityOptions.length - 1}
                              step="1"
                              value={vicinityStepIndex}
                              onChange={(e) => {
                                const nextIndex = Number(e.target.value);
                                const nextValue = vicinityOptions[nextIndex]?.value ?? '';
                                handleFilterChange('vicinity', nextValue);
                              }}
                              aria-label={t('landing.vicinity', { defaultValue: 'Vicinity' })}
                              className="vicinity-slider w-full"
                              style={{ '--vicinity-progress': `${vicinityPercent}%` }}
                            />
                            <div className="mt-2 flex justify-between text-[11px] font-semibold text-slate-600 sm:text-xs">
                              {vicinityOptions.map((option) => (
                                <span key={option.value || 'any'} className="text-center">
                                  {option.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section
        ref={resultsRef}
        id="properties-section"
        className="py-12 md:py-16 bg-white"
      >
        <Container>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {filters.city || filters.property_type || filters.guests ? t('landing.searchResults') : t('landing.featuredProperties')}
            </h2>
            <p className="text-sm text-gray-600">
              {t('landing.propertiesAvailable', { count: visibleProperties.length })}
            </p>
          </div>

          {searchLoading ? (
            <div className="text-center py-12">
              <Loading />
            </div>
          ) : visibleProperties.length === 0 ? (
            <div className="text-center py-12">
              <HomeIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.noPropertiesFound')}</h3>
              <p className="text-gray-600">{t('landing.tryAdjustingFilters')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {visibleProperties.map((property) => {
                const monthlyPrice = getMonthlyPrice(property);
                const nightlyPrice = getNightlyPrice(property);
                const showMonthly = term === 'mid' || term === 'long';
                const displayPrice = showMonthly ? monthlyPrice : nightlyPrice;
                const priceSuffix = showMonthly ? t('landing.month', { defaultValue: 'month' }) : t('landing.night');
                const normalizedSuffix = String(priceSuffix || '').replace(/^\/\s*/, '');

                return (
                  <Link key={property.id} to={`/properties/${property.id}`} className="group">
                    <Card className="h-full !bg-transparent !border-none !shadow-none" padding={false}>
                      {/* Property Image */}
                      <div className="card-media h-auto aspect-[4/3] bg-gray-200 overflow-hidden rounded-2xl relative">
                        {property.primary_photo ? (
                          <img 
                            src={property.primary_photo} 
                            alt={property.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <HomeIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        {/* Favorite Button */}
                        <button
                          onClick={(e) => handleFavoriteClick(e, property)}
                          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-10"
                          aria-label={isPropertyFavorited(property.id) ? t('landing.removeFromFavorites') : t('landing.addToFavorites')}
                        >
                          <Heart 
                            className={`w-5 h-5 transition-colors ${
                              isPropertyFavorited(property.id)
                                ? 'fill-red-500 text-red-500'
                                : 'text-gray-600 hover:text-red-500'
                            }`}
                          />
                        </button>
                      </div>

                      <Card.Body className="pt-3 px-1">
                        <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">
                          {propertyTypes.find(pt => pt.value === property.property_type)?.label || property.property_type}
                        </div>
                        <div className="text-sm text-gray-700 font-medium">
                          {property.city}, {property.country}
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mt-1 line-clamp-1">
                          {property.title}
                        </h3>
                        <div className="text-sm text-gray-500 mt-1">
                          {property.bedrooms} {property.bedrooms > 1 ? t('landing.beds') : t('landing.bed')}
                          {' · '}
                          {property.max_guests} {property.max_guests > 1 ? t('landing.guests') : t('landing.guest')}
                        </div>
                        <div className="mt-2 text-base text-gray-900">
                          <span className="font-semibold">
                            {displayPrice !== null ? formatCurrency(displayPrice) : formatCurrency(0)}
                          </span>
                          <span className="text-gray-500 text-sm ml-1">/{normalizedSuffix}</span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </Container>
      </section>
    </div>
  );
};

export default LandingPage;
