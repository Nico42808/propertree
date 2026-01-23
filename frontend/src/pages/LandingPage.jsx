/**
 * Landing Page - Home page with integrated property search
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container } from '../components/layout';
import { Select, Card, Loading } from '../components/common';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Building,
  Building2,
  Castle,
  ChevronDown,
  Home,
  HomeIcon,
  Hotel,
  Heart,
  Key,
  Layers,
  Minus,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks';
import { formatCurrency } from '../utils/formatters';
import { useFavorite, useFavorites } from '../hooks/useProperties';

const T = {
  title: 'text-3xl font-bold leading-tight text-slate-900',
  value: 'text-sm sm:text-sm font-semibold leading-snug text-slate-900',
  control: 'text-sm font-semibold leading-snug',
  label: 'text-xs font-medium tracking-wide text-slate-500',
  micro: 'text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-500',
  subtleControl: 'text-sm font-medium leading-snug text-slate-600',
};

const selectValueToken = T.value
  .split(' ')
  .map((cls) => `[&>div>button]:${cls}`)
  .join(' ');

const LandingPage = () => {
  const { t, i18n } = useTranslation();
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
  
  const todayString = new Date().toISOString().split('T')[0];
  const initialFilters = {
    city: '',
    property_type: '',
    guests: '',
    sort_by: 'price_low_high',
    check_in: todayString,
    check_out: '',
    min_price: '',
    max_price: '',
    min_area: '',
    vicinity: ''
  };
  const [filters, setFilters] = useState(initialFilters);

  // Term selection: '', 'short', 'mid', 'long'
  const [term, setTerm] = useState(() => sessionStorage.getItem('bookingTerm') || 'short');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const defaultGuestCounts = {
    adults: 0,
    children: 0,
    infants: 0,
    pets: 0,
  };
  const [guestCounts, setGuestCounts] = useState(() => ({ ...defaultGuestCounts }));
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const guestPanelRef = useRef(null);
  const guestTriggerRef = useRef(null);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const datePanelRef = useRef(null);
  const dateTriggerRef = useRef(null);
  const [stayMonths, setStayMonths] = useState(1);
  const [isPropertyTypeOpen, setIsPropertyTypeOpen] = useState(false);
  const propertyTypePanelRef = useRef(null);
  const propertyTypeTriggerRef = useRef(null);
  const [isMinAreaOpen, setIsMinAreaOpen] = useState(false);
  const minAreaPanelRef = useRef(null);
  const minAreaTriggerRef = useRef(null);
  const filterBarRef = useRef(null);
  const filterBarOffsetTopRef = useRef(null);
  const heroRef = useRef(null);
  const termTabsRef = useRef(null);
  const [isHeroInView, setIsHeroInView] = useState(true);
  const [isSearchCollapsedByUser, setIsSearchCollapsedByUser] = useState(false);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [navHeight, setNavHeight] = useState(72);
  const ignoreCollapseRef = useRef(false);

  const ensureDropdownInView = React.useCallback((element) => {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const margin = 16;
    const bottomOverflow = rect.bottom - window.innerHeight + margin;
    if (bottomOverflow > 0) {
      window.scrollBy({ top: bottomOverflow, behavior: 'smooth' });
      return;
    }
    const topOverflow = rect.top - margin;
    if (topOverflow < 0) {
      window.scrollBy({ top: topOverflow, behavior: 'smooth' });
    }
  }, []);

  const propertyTypeItems = [
    {
      value: '',
      label: t('landing.allTypes'),
      description: t('landing.allTypesHint', { defaultValue: 'Any Property Type' }),
      icon: Layers,
    },
    {
      value: 'apartment',
      label: t('propertyTypes.apartment'),
      description: t('landing.apartmentHint', { defaultValue: 'Modern Apartment Stays' }),
      icon: Building,
    },
    {
      value: 'house',
      label: t('propertyTypes.house'),
      description: t('landing.houseHint', { defaultValue: 'Standalone Homes' }),
      icon: Home,
    },
    {
      value: 'room',
      label: t('propertyTypes.room', { defaultValue: 'Room' }),
      description: t('landing.roomHint', { defaultValue: 'Private Room Setups' }),
      icon: Key,
    },
    {
      value: 'studio',
      label: t('propertyTypes.studio'),
      description: t('landing.studioHint', { defaultValue: 'Compact Studio Spaces' }),
      icon: HomeIcon,
    },
    {
      value: 'villa',
      label: t('propertyTypes.villa'),
      description: t('landing.villaHint', { defaultValue: 'Premium Villa Escapes' }),
      icon: Castle,
    },
    {
      value: 'condo',
      label: t('propertyTypes.condo'),
      description: t('landing.condoHint', { defaultValue: 'City Condo Living' }),
      icon: Building2,
    },
    {
      value: 'townhouse',
      label: t('propertyTypes.townhouse'),
      description: t('landing.townhouseHint', { defaultValue: 'Spacious Townhouses' }),
      icon: Hotel,
    },
    {
      value: 'other',
      label: t('propertyTypes.other', { defaultValue: 'Other' }),
      description: t('landing.otherHint', { defaultValue: 'Unique Stays' }),
      icon: Layers,
    },
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
    { value: '2', distance: 1 },
    { value: '5', distance: 5 },
    { value: '10', distance: 10 },
    { value: '20', distance: 20 },
  ].map(({ value, distance }) => ({
    value,
    distance,
    label: t('landing.vicinityDistance', { defaultValue: `${distance} km`, distance }),
  }));

  const vicinityStepIndex = Math.max(
    0,
    vicinityOptions.findIndex((option) => option.value === filters.vicinity)
  );
  const vicinityMax = Math.max(1, vicinityOptions.length - 1);
  const vicinityPercent = Math.round((vicinityStepIndex / vicinityMax) * 100);

  useEffect(() => {
    setFilters(initialFilters);
    setTerm('short');
    sessionStorage.setItem('bookingTerm', 'short');
    fetchProperties();
    fetchCities();
  }, []);

  useEffect(() => {
    if (term !== 'mid' && term !== 'long') {
      setShowMoreFilters(false);
    }
  }, [term]);

  useEffect(() => {
    if (!isGuestOpen) return;

    const scrollFrame = requestAnimationFrame(() => {
      ensureDropdownInView(guestPanelRef.current);
    });

    const handleClickOutside = (event) => {
      if (
        guestPanelRef.current &&
        guestPanelRef.current.contains(event.target)
      ) {
        return;
      }
      if (
        guestTriggerRef.current &&
        guestTriggerRef.current.contains(event.target)
      ) {
        return;
      }
      setIsGuestOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsGuestOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      cancelAnimationFrame(scrollFrame);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [ensureDropdownInView, isGuestOpen]);

  useEffect(() => {
    if (!isDateOpen) return;

    const scrollFrame = requestAnimationFrame(() => {
      ensureDropdownInView(datePanelRef.current);
    });

    const handleClickOutside = (event) => {
      if (datePanelRef.current && datePanelRef.current.contains(event.target)) {
        return;
      }
      if (dateTriggerRef.current && dateTriggerRef.current.contains(event.target)) {
        return;
      }
      setIsDateOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsDateOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      cancelAnimationFrame(scrollFrame);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [ensureDropdownInView, isDateOpen]);

  useEffect(() => {
    if (!isPropertyTypeOpen) return;

    const scrollFrame = requestAnimationFrame(() => {
      ensureDropdownInView(propertyTypePanelRef.current);
    });

    const handleClickOutside = (event) => {
      if (
        propertyTypePanelRef.current &&
        propertyTypePanelRef.current.contains(event.target)
      ) {
        return;
      }
      if (
        propertyTypeTriggerRef.current &&
        propertyTypeTriggerRef.current.contains(event.target)
      ) {
        return;
      }
      setIsPropertyTypeOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsPropertyTypeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      cancelAnimationFrame(scrollFrame);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [ensureDropdownInView, isPropertyTypeOpen]);

  useEffect(() => {
    if (!isMinAreaOpen) return;

    const scrollFrame = requestAnimationFrame(() => {
      ensureDropdownInView(minAreaPanelRef.current);
    });

    const handleClickOutside = (event) => {
      if (minAreaPanelRef.current && minAreaPanelRef.current.contains(event.target)) {
        return;
      }
      if (minAreaTriggerRef.current && minAreaTriggerRef.current.contains(event.target)) {
        return;
      }
      setIsMinAreaOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMinAreaOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      cancelAnimationFrame(scrollFrame);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [ensureDropdownInView, isMinAreaOpen]);

  useEffect(() => {
    const nav = document.querySelector('nav');
    if (!nav) return;
    const updateNavHeight = () => {
      setNavHeight(nav.getBoundingClientRect().height);
    };
    updateNavHeight();
    const observer = new ResizeObserver(updateNavHeight);
    observer.observe(nav);
    window.addEventListener('resize', updateNavHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateNavHeight);
    };
  }, []);

  useEffect(() => {
    const updateHeroVisibility = () => {
      if (!heroRef.current) return;
      const heroRect = heroRef.current.getBoundingClientRect();
      const collapseThreshold = navHeight + 8;
      const filterRect = filterBarRef.current?.getBoundingClientRect();
      if (filterRect) {
        filterBarOffsetTopRef.current = filterRect.top + window.scrollY;
      }
      const triggerTop =
        filterBarOffsetTopRef.current ?? heroRect.bottom + window.scrollY;
      const shouldCollapse = window.scrollY + collapseThreshold >= triggerTop;
      setIsHeroInView(!shouldCollapse);
      if (shouldCollapse) {
        if (!ignoreCollapseRef.current) {
          setIsSearchCollapsedByUser(true);
        }
        setIsSearchOverlayOpen(false);
        return;
      }
      ignoreCollapseRef.current = false;
      setIsSearchCollapsedByUser(false);
    };

    updateHeroVisibility();
    window.addEventListener('scroll', updateHeroVisibility, { passive: true });
    window.addEventListener('resize', updateHeroVisibility);
    return () => {
      window.removeEventListener('scroll', updateHeroVisibility);
      window.removeEventListener('resize', updateHeroVisibility);
    };
  }, [navHeight]);

  useEffect(() => {
    const handleOutsideHero = (event) => {
      if (isSearchOverlayOpen) return;
      if (!heroRef.current) return;
      if (heroRef.current.contains(event.target)) return;
      if (isHeroInView) return;
      setIsSearchCollapsedByUser(true);
    };
    document.addEventListener('mousedown', handleOutsideHero);
    return () => {
      document.removeEventListener('mousedown', handleOutsideHero);
    };
  }, [isSearchOverlayOpen, isHeroInView]);

  useEffect(() => {
    if (!isHeroInView) return;
    ignoreCollapseRef.current = true;
    setIsSearchCollapsedByUser(false);
  }, [i18n.language, isHeroInView]);

  useEffect(() => {
    if (!isSearchOverlayOpen) return;
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsSearchOverlayOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isSearchOverlayOpen]);

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
    if (isSearchOverlayOpen) {
      setIsSearchOverlayOpen(false);
      setIsSearchCollapsedByUser(true);
    }
    setShouldScrollToResults(true);
    const guestFilter = totalGuests > 0 ? String(totalGuests) : '';
    fetchProperties({ ...filters, guests: guestFilter });
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

  const totalGuests = guestCounts.adults + guestCounts.children + guestCounts.infants;
  const canShowMoreFilters = term === 'mid' || term === 'long';
  const selectedPropertyType = propertyTypeItems.find(
    (item) => item.value === filters.property_type
  );
  const propertyTypeLabel =
    selectedPropertyType?.label || t('landing.allTypes');
  const hasPropertyTypeSelection = Boolean(filters.property_type);
  const selectedMinArea = minAreaOptions.find(
    (option) => option.value === filters.min_area
  );
  const minAreaLabel =
    selectedMinArea?.label || t('landing.anyArea', { defaultValue: 'Any size' });
  const hasMinAreaSelection = Boolean(filters.min_area);
  const dateSummary = React.useMemo(() => {
    if (!filters.check_in && !filters.check_out) {
      return t('landing.addDates', { defaultValue: 'Add dates' });
    }
    const formatDate = (dateStr) =>
      new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
        new Date(dateStr)
      );
    if (filters.check_in && filters.check_out) {
      return `${formatDate(filters.check_in)} - ${formatDate(filters.check_out)}`;
    }
    if (filters.check_in) {
      return `${formatDate(filters.check_in)} - ${t('landing.addCheckout', { defaultValue: 'Add checkout' })}`;
    }
    return t('landing.addDates', { defaultValue: 'Add dates' });
  }, [filters.check_in, filters.check_out, t]);
  const guestSummary = React.useMemo(() => {
    if (totalGuests === 0) {
      return t('landing.addGuests', { defaultValue: 'Add guests' });
    }
    const guestLabel =
      totalGuests === 1 ? t('landing.guest') : t('landing.guests');
    const petsCount = guestCounts.pets;
    const petsLabel =
      petsCount > 0
        ? `, ${petsCount} ${petsCount === 1 ? t('landing.pet', { defaultValue: 'pet' }) : t('landing.pets', { defaultValue: 'pets' })}`
        : '';
    return `${totalGuests} ${guestLabel}${petsLabel}`;
  }, [guestCounts.children, guestCounts.infants, guestCounts.pets, guestCounts.adults, totalGuests, t]);
  const isSearchCollapsed = !isHeroInView || isSearchCollapsedByUser;
  const showCompactBar = isSearchCollapsed && !isSearchOverlayOpen;
  const showExpandedBar = !isSearchCollapsed || isSearchOverlayOpen;
  const hideSearchShell = isSearchCollapsed && !isSearchOverlayOpen;
  const compactLocationSummary =
    filters.city || t('landing.anywhere', { defaultValue: 'Anywhere' });
  const compactDateSummary =
    filters.check_in || filters.check_out
      ? dateSummary
      : t('landing.anyWeek', { defaultValue: 'Any week' });
  const compactGuestSummary =
    totalGuests > 0 ? guestSummary : t('landing.addGuests', { defaultValue: 'Add guests' });
  const compactTypeSummary = hasPropertyTypeSelection
    ? propertyTypeLabel
    : t('landing.anyType', { defaultValue: 'Any type' });

  useEffect(() => {
    const nextGuestsValue = totalGuests > 0 ? String(totalGuests) : '';
    setFilters((prev) =>
      prev.guests === nextGuestsValue ? prev : { ...prev, guests: nextGuestsValue }
    );
  }, [totalGuests]);

  const adjustGuestCount = (key, delta) => {
    setGuestCounts((prev) => {
      const nextValue = Math.max(0, prev[key] + delta);
      const next = { ...prev, [key]: nextValue };

      if ((key === 'children' || key === 'infants') && nextValue > 0 && next.adults === 0) {
        next.adults = 1;
      }

      if (key === 'adults' && nextValue === 0 && (next.children > 0 || next.infants > 0)) {
        next.adults = 1;
      }

      return next;
    });
  };

  const handleDateChange = (dates) => {
    if (term === 'mid' || term === 'long') {
      const start = Array.isArray(dates) ? dates[0] : dates;
      const startString = start ? start.toISOString().split('T')[0] : '';
      setFilters((prev) => ({
        ...prev,
        check_in: startString,
        check_out: startString ? addMonths(startString, stayMonths) : '',
      }));
      return;
    }

    const [start, end] = dates;
    const startString = start ? start.toISOString().split('T')[0] : '';
    const endString = end ? end.toISOString().split('T')[0] : '';

    if (startString && endString && endString <= startString) {
      setFilters((prev) => ({
        ...prev,
        check_in: startString,
        check_out: '',
      }));
      return;
    }

    setFilters((prev) => ({
      ...prev,
      check_in: startString,
      check_out: endString,
    }));
  };

  const handlePropertyTypeSelect = (value) => {
    handleFilterChange('property_type', value);
    setIsPropertyTypeOpen(false);
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

  const getMonthBounds = () => {
    if (term === 'long') return { min: 12, max: 120 };
    return { min: 1, max: 12 };
  };

  const clampStayMonths = (value) => {
    const { min, max } = getMonthBounds();
    return Math.max(min, Math.min(max, value));
  };

  const getStayMonths = (start, end) => {
    if (!start || !end) {
      return clampStayMonths(getMonthBounds().min);
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    let months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());
    if (endDate.getDate() < startDate.getDate()) {
      months -= 1;
    }
    return clampStayMonths(months || 1);
  };

  const formatLongTermDuration = (months) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
      return `${years}y`;
    }
    return `${years}y ${remainingMonths}m`;
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
      return { min: addMonths(ci, 12), max: addMonths(ci, 120) };
    }
    return { min: addDays(ci, 1), max: null };
  };

  useEffect(() => {
    if (term !== 'mid' && term !== 'long') return;
    const nextMonths = getStayMonths(filters.check_in, filters.check_out);
    setStayMonths(nextMonths);
  }, [term]);

  useEffect(() => {
    if ((term !== 'mid' && term !== 'long') || !filters.check_in) return;
    const computed = addMonths(filters.check_in, stayMonths);
    setFilters((prev) =>
      prev.check_out === computed ? prev : { ...prev, check_out: computed }
    );
  }, [term, filters.check_in, stayMonths]);

  // compute bounds for check_out based on selected term and check_in
  const coBounds = computeCheckOutBounds();
  const checkInDate = filters.check_in ? new Date(filters.check_in) : null;
  const checkOutDate = filters.check_out ? new Date(filters.check_out) : null;

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
      {isSearchOverlayOpen && (
        <button
          type="button"
          aria-label={t('landing.closeSearch', { defaultValue: 'Close search' })}
          className="landing-search-overlay"
          onClick={() => setIsSearchOverlayOpen(false)}
        />
      )}
      <section
        ref={heroRef}
        className="landing-hero relative border-b border-slate-200 min-h-[60vh]"
      >
        <div
          className="absolute inset-0 bg-gradient-to-b from-propertree-green/60 via-propertree-green/35 to-propertree-green/55"
          aria-hidden="true"
        />
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(60vh-4rem)] sm:min-h-[calc(60vh-4.5rem)] flex flex-col">
            <div className="pt-8 sm:pt-12 lg:pt-14">
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white">
                  {t('landing.title', { defaultValue: 'Find it. Book it. Live it.' })}
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-white mb-6 sm:mb-8">
                  {t('landing.subtitle', {
                    defaultValue: 'From new branches to new beginnings, choose your next home.',
                  })}
                </p>
              </div>
            </div>

            <div className="mt-auto pb-6 sm:pb-8">
              <form
                onSubmit={handleSearch}
                className={`landing-search-form relative z-30 overflow-visible rounded-[28px] border border-white/70 p-5 sm:p-6 transition-[padding,box-shadow] duration-200 ${
                  hideSearchShell
                    ? ''
                    : isSearchCollapsed
                    ? 'is-collapsed shadow-[0_10px_30px_rgba(15,23,42,0.12)]'
                    : 'shadow-[0_18px_45px_rgba(15,23,42,0.12)]'
                } ${isSearchOverlayOpen ? 'is-overlay' : ''}`}
                style={{
                  '--search-top': `${navHeight + 8}px`,
                  ...(hideSearchShell
                    ? { padding: 0, borderColor: 'transparent', borderWidth: 0 }
                    : {}),
                }}
              >
                {showExpandedBar && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[28px] bg-white/90 backdrop-blur-md"
                    aria-hidden="true"
                  />
                )}
                <div className="relative z-10">
                  {showCompactBar && (
                    <div className="landing-search-compact is-visible">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOverlayOpen(false);
                          setIsSearchCollapsedByUser(false);
                          ignoreCollapseRef.current = true;
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        aria-expanded={false}
                        aria-controls="landing-search-panel"
                        className="group flex w-full items-center gap-3 rounded-full border border-slate-200 bg-white/95 px-3 py-2.5 text-left shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition-[box-shadow,transform] duration-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)] active:scale-[0.99] sm:justify-between sm:gap-4 sm:px-4"
                      >
                        <div className="flex flex-1 items-center gap-2 overflow-x-auto text-xs font-semibold text-slate-700 sm:gap-3 sm:text-sm">
                          <span className="truncate">{compactLocationSummary}</span>
                          <span className="text-slate-300 sm:hidden">|</span>
                          <span className="hidden h-4 w-px bg-slate-200 sm:inline-block" />
                          <span className="truncate">{compactDateSummary}</span>
                          <span className="text-slate-300 sm:hidden">|</span>
                          <span className="hidden h-4 w-px bg-slate-200 sm:inline-block" />
                          <span className="truncate">{compactGuestSummary}</span>
                          <span className="text-slate-300 sm:hidden">|</span>
                          <span className="hidden h-4 w-px bg-slate-200 sm:inline-block" />
                          <span className="truncate">{compactTypeSummary}</span>
                        </div>
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-propertree-green text-white shadow-[0_10px_20px_rgba(44,62,58,0.25)] transition-transform duration-200 group-hover:scale-[1.02]">
                          <Search className="h-4 w-4" />
                        </span>
                      </button>
                    </div>
                  )}

                  {showExpandedBar && (
                    <div
                      id="landing-search-panel"
                      className="landing-search-expanded is-visible"
                    >
                      <div className="flex flex-col gap-4 sm:gap-5">
                  <div>
                    <div ref={termTabsRef} className="p-1.5 sm:p-2">
                      <div className="relative rounded-full border border-slate-200 bg-slate-50 p-1">
                        <span
                          className={`absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-propertree-green transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${term ? 'opacity-100' : 'opacity-0'} ${term === 'mid' ? 'translate-x-full' : term === 'long' ? 'translate-x-[200%]' : ''}`}
                          aria-hidden="true"
                        />
                        <div className="relative z-10 grid grid-cols-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleTermSelect('short')}
                            className={`py-2 sm:py-2.5 rounded-full font-semibold leading-snug text-sm sm:text-base whitespace-nowrap transition-[color,transform] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propertree-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${term === 'short' ? 'text-white' : 'text-slate-500 hover:text-slate-800 active:scale-[0.99]'}`}
                          >
                            <span className="block">{t('landing.shortTerm', { defaultValue: 'Short-term' })}</span>
                            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] opacity-80">
                              {t('landing.shortTermHint', { defaultValue: '< 1 month' })}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTermSelect('mid')}
                            className={`py-2 sm:py-2.5 rounded-full font-semibold leading-snug text-sm sm:text-base whitespace-nowrap transition-[color,transform] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propertree-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${term === 'mid' ? 'text-white' : 'text-slate-500 hover:text-slate-800 active:scale-[0.99]'}`}
                          >
                            <span className="block">{t('landing.midTerm', { defaultValue: 'Mid-term' })}</span>
                            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] opacity-80">
                              {t('landing.midTermHint', { defaultValue: '1-12 months' })}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTermSelect('long')}
                            className={`py-2 sm:py-2.5 rounded-full font-semibold leading-snug text-sm sm:text-base whitespace-nowrap transition-[color,transform] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propertree-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${term === 'long' ? 'text-white' : 'text-slate-500 hover:text-slate-800 active:scale-[0.99]'}`}
                          >
                            <span className="block">{t('landing.longTerm', { defaultValue: 'Long-term' })}</span>
                            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] opacity-80">
                              {t('landing.longTermHint', { defaultValue: '12+ months' })}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                    <div className="landing-filter-shell">
                    <div
                      ref={filterBarRef}
                      className={`landing-filter-bar ${isSearchCollapsed ? 'is-collapsed' : ''} ${
                        isSearchOverlayOpen ? 'is-overlay' : ''
                      }`}
                    >
                      <div
                        className={`landing-filter-surface border border-slate-200 overflow-visible ${
                          isSearchCollapsed || isSearchOverlayOpen ? 'bg-white' : 'bg-white/70'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4">
                            <div className="group flex flex-col px-3 sm:px-4 py-3 sm:py-4 transition-colors hover:bg-white/80 focus-within:bg-white">
                              <span className={`${T.micro} normal-case tracking-normal`}>
                                {t('landing.where', { defaultValue: 'Where' })}
                              </span>
                              <Select
                                name="city"
                                value={filters.city}
                                onChange={(e) => handleFilterChange('city', e.target.value)}
                                options={cities}
                                placeholder={t('landing.searchDestinations', { defaultValue: 'Search destinations' })}
                                variant="minimal"
                                ensureVisibleOnOpen
                                className={`mt-1 ${selectValueToken}`}
                              />
                            </div>

                            <div className="group relative flex flex-col px-3 sm:px-4 py-3 sm:py-4 transition-colors hover:bg-white/80 focus-within:bg-white">
                              <span className={`${T.micro} normal-case tracking-normal`}>
                                {t('landing.when', { defaultValue: 'When' })}
                              </span>
                              <div className="relative mt-1">
                                <button
                                  type="button"
                                  ref={dateTriggerRef}
                                  onClick={() => setIsDateOpen((prev) => !prev)}
                                  aria-expanded={isDateOpen}
                                  aria-controls="date-range-panel"
                                  className={`w-full bg-transparent px-0 py-1 pr-6 text-left text-sm font-semibold leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propertree-green/30 ${
                                    filters.check_in || filters.check_out ? 'text-slate-900' : 'text-slate-400'
                                  }`}
                                >
                                  <span className="block truncate">{dateSummary}</span>
                                </button>
                                <button
                                  type="button"
                                  aria-label={t('landing.clearDates', { defaultValue: 'Clear dates' })}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setFilters((prev) => ({ ...prev, check_in: '', check_out: '' }));
                                  }}
                                  className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 transition-[color,transform,opacity] duration-300 hover:text-propertree-green active:scale-[0.95]"
                                >
                                  <X className={`h-4 w-4 ${filters.check_in || filters.check_out ? 'opacity-100' : 'opacity-70'}`} />
                                </button>
                              </div>

                              {isDateOpen && (
                                <div
                                  ref={datePanelRef}
                                  id="date-range-panel"
                                  role="dialog"
                                  aria-label={t('landing.when', { defaultValue: 'When' })}
                                  className="absolute left-0 top-full z-40 mt-3 w-fit max-w-[92vw] rounded-3xl border border-slate-200 bg-white p-4 sm:p-6"
                                >
                                  <div className="w-fit max-w-full">
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                      {t('landing.checkInLabel', { defaultValue: 'Select check-in date' })}
                                    </p>
                                    <DatePicker
                                      selected={checkInDate}
                                      onChange={handleDateChange}
                                      startDate={checkInDate}
                                      endDate={term === 'mid' || term === 'long' ? null : checkOutDate}
                                      selectsRange={term !== 'mid' && term !== 'long'}
                                      inline
                                      monthsShown={term === 'mid' || term === 'long' ? 1 : 2}
                                      minDate={new Date()}
                                      maxDate={
                                        term === 'mid' || term === 'long'
                                          ? undefined
                                          : coBounds.max
                                          ? new Date(coBounds.max)
                                          : undefined
                                      }
                                      calendarClassName="landing-date-picker"
                                    />
                                    {(term === 'mid' || term === 'long') && (
                                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white/95 p-4">
                                        <div className="flex items-center justify-between gap-4">
                                          <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                              {t('landing.midTermLength', { defaultValue: 'Length of stay' })}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                              {term === 'long'
                                                ? t('landing.longTermRange', { defaultValue: '12 to 120 months' })
                                                : t('landing.midTermRange', { defaultValue: '1 to 12 months' })}
                                            </p>
                                          </div>
                                          <div className="text-right text-propertree-green">
                                            <div className="text-2xl font-semibold leading-none">
                                              {term === 'long' ? formatLongTermDuration(stayMonths) : stayMonths}
                                            </div>
                                            {term !== 'long' && (
                                              <div className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                                                {t('landing.months', { defaultValue: 'Months' })}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <input
                                          type="range"
                                          min={term === 'long' ? 12 : 1}
                                          max={term === 'long' ? 120 : 12}
                                          value={stayMonths}
                                          onChange={(event) => {
                                            const nextValue = clampStayMonths(Number(event.target.value));
                                            setStayMonths(nextValue);
                                          }}
                                          className="vicinity-slider mt-3 w-full"
                                          aria-label={
                                            term === 'long'
                                              ? t('landing.longTermRange', { defaultValue: '12 to 120 months' })
                                              : t('landing.midTermRange', { defaultValue: '1 to 12 months' })
                                          }
                                        />
                                        {filters.check_in && (
                                          <p className="mt-3 text-xs text-slate-500">
                                            {t('landing.midTermCheckout', { defaultValue: 'Checkout' })}:{' '}
                                            <span className="font-semibold text-slate-700">
                                              {new Intl.DateTimeFormat('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                              }).format(new Date(addMonths(filters.check_in, stayMonths)))}
                                            </span>
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="group relative flex flex-col px-3 sm:px-4 py-3 sm:py-4 transition-colors hover:bg-white/80 focus-within:bg-white">
                              <span className={`${T.micro} normal-case tracking-normal`}>
                                {t('landing.who', { defaultValue: 'Who' })}
                              </span>
                              <div className="relative mt-1">
                                <button
                                  type="button"
                                  ref={guestTriggerRef}
                                  onClick={() => setIsGuestOpen((prev) => !prev)}
                                  aria-expanded={isGuestOpen}
                                  aria-controls="guest-editor"
                                  className={`w-full bg-transparent px-0 py-1 pr-6 text-left text-sm font-semibold leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propertree-green/30 ${totalGuests === 0 ? 'text-slate-400' : 'text-slate-900'}`}
                                >
                                  <span className="block truncate">{guestSummary}</span>
                                </button>
                                <button
                                  type="button"
                                  aria-label={t('landing.clearGuests', { defaultValue: 'Clear guests' })}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setGuestCounts(() => ({ ...defaultGuestCounts }));
                                  }}
                                  className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 transition-[color,transform,opacity] duration-300 hover:text-propertree-green active:scale-[0.95]"
                                >
                                  <X className={`h-4 w-4 ${totalGuests > 0 || guestCounts.pets > 0 ? 'opacity-100' : 'opacity-70'}`} />
                                </button>
                              </div>

                              {isGuestOpen && (
                                <div
                                  ref={guestPanelRef}
                                  id="guest-editor"
                                  role="dialog"
                                  aria-label={t('landing.guests', { defaultValue: 'Guests' })}
                                  className="absolute right-0 top-full z-40 mt-3 w-[min(92vw,22rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] sm:w-80"
                                >
                                  <div className="divide-y divide-slate-100">
                                    <div className="flex items-center justify-between py-3">
                                      <div>
                                        <div className="text-sm font-semibold text-slate-900">
                                          {t('landing.guestAdults', { defaultValue: 'Adults' })}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                          {t('landing.guestAdultsHint', { defaultValue: 'Ages 13 or above' })}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <button
                                          type="button"
                                          onClick={() => adjustGuestCount('adults', -1)}
                                          disabled={guestCounts.adults === 0}
                                          aria-label={t('landing.decreaseAdults', { defaultValue: 'Decrease adults' })}
                                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-[border-color,color,transform] hover:border-propertree-green/40 hover:text-propertree-green active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="w-4 text-center text-sm font-semibold text-slate-900">
                                          {guestCounts.adults}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => adjustGuestCount('adults', 1)}
                                          aria-label={t('landing.increaseAdults', { defaultValue: 'Increase adults' })}
                                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-[border-color,color,transform] hover:border-propertree-green/40 hover:text-propertree-green active:scale-[0.95]"
                                        >
                                          <Plus className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between py-3">
                                      <div>
                                        <div className="text-sm font-semibold text-slate-900">
                                          {t('landing.guestChildren', { defaultValue: 'Children' })}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                          {t('landing.guestChildrenHint', { defaultValue: 'Ages 2–12' })}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <button
                                          type="button"
                                          onClick={() => adjustGuestCount('children', -1)}
                                          disabled={guestCounts.children === 0}
                                          aria-label={t('landing.decreaseChildren', { defaultValue: 'Decrease children' })}
                                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-[border-color,color,transform] hover:border-propertree-green/40 hover:text-propertree-green active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="w-4 text-center text-sm font-semibold text-slate-900">
                                          {guestCounts.children}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => adjustGuestCount('children', 1)}
                                          aria-label={t('landing.increaseChildren', { defaultValue: 'Increase children' })}
                                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-[border-color,color,transform] hover:border-propertree-green/40 hover:text-propertree-green active:scale-[0.95]"
                                        >
                                          <Plus className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between py-3">
                                      <div>
                                        <div className="text-sm font-semibold text-slate-900">
                                          {t('landing.guestInfants', { defaultValue: 'Infants' })}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                          {t('landing.guestInfantsHint', { defaultValue: 'Under 2' })}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <button
                                          type="button"
                                          onClick={() => adjustGuestCount('infants', -1)}
                                          disabled={guestCounts.infants === 0}
                                          aria-label={t('landing.decreaseInfants', { defaultValue: 'Decrease infants' })}
                                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-[border-color,color,transform] hover:border-propertree-green/40 hover:text-propertree-green active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="w-4 text-center text-sm font-semibold text-slate-900">
                                          {guestCounts.infants}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => adjustGuestCount('infants', 1)}
                                          aria-label={t('landing.increaseInfants', { defaultValue: 'Increase infants' })}
                                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-[border-color,color,transform] hover:border-propertree-green/40 hover:text-propertree-green active:scale-[0.95]"
                                        >
                                          <Plus className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between py-3">
                                      <div>
                                        <div className="text-sm font-semibold text-slate-900">
                                          {t('landing.guestPets', { defaultValue: 'Pets' })}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                          {t('landing.guestPetsHint', { defaultValue: 'Bringing a service animal?' })}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <button
                                          type="button"
                                          onClick={() => adjustGuestCount('pets', -1)}
                                          disabled={guestCounts.pets === 0}
                                          aria-label={t('landing.decreasePets', { defaultValue: 'Decrease pets' })}
                                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-[border-color,color,transform] hover:border-propertree-green/40 hover:text-propertree-green active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="w-4 text-center text-sm font-semibold text-slate-900">
                                          {guestCounts.pets}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => adjustGuestCount('pets', 1)}
                                          aria-label={t('landing.increasePets', { defaultValue: 'Increase pets' })}
                                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-[border-color,color,transform] hover:border-propertree-green/40 hover:text-propertree-green active:scale-[0.95]"
                                        >
                                          <Plus className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="group relative flex flex-col px-3 sm:px-4 py-3 sm:py-4 transition-colors hover:bg-white/80 focus-within:bg-white">
                              <span className={`${T.micro} normal-case tracking-normal`}>
                                {t('landing.which', { defaultValue: 'Which' })}
                              </span>
                              <div className="relative mt-1">
                                <button
                                  type="button"
                                  ref={propertyTypeTriggerRef}
                                  onClick={() => setIsPropertyTypeOpen((prev) => !prev)}
                                  aria-expanded={isPropertyTypeOpen}
                                  aria-controls="property-type-menu"
                                  className={`w-full bg-transparent px-0 py-1 pr-6 text-left text-sm font-semibold leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propertree-green/30 ${
                                    hasPropertyTypeSelection ? 'text-slate-900' : 'text-slate-400'
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    {hasPropertyTypeSelection && selectedPropertyType?.icon && (
                                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-propertree-green/15 text-propertree-green">
                                        <selectedPropertyType.icon className="h-3.5 w-3.5" />
                                      </span>
                                    )}
                                    <span className="block truncate">{propertyTypeLabel}</span>
                                  </span>
                                </button>
                                <ChevronDown
                                  className={`pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform duration-300 ${
                                    isPropertyTypeOpen ? 'rotate-180' : ''
                                  }`}
                                />
                              </div>

                              {isPropertyTypeOpen && (
                                <div
                                  ref={propertyTypePanelRef}
                                  id="property-type-menu"
                                  role="dialog"
                                  aria-label={t('landing.propertyType', { defaultValue: 'Property type' })}
                                  className="absolute right-0 top-full z-40 mt-3 w-[min(92vw,24rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] sm:w-96"
                                >
                                  <div className="max-h-80 space-y-1 overflow-auto pr-1">
                                    <div className="px-1 pb-2 text-xs font-semibold text-slate-500">
                                      {t('landing.suggestedTypes', { defaultValue: 'Suggested types' })}
                                    </div>
                                    {propertyTypeItems.map((item) => {
                                      const Icon = item.icon;
                                      const isSelected = filters.property_type === item.value;
                                      return (
                                        <button
                                          key={item.value || 'all'}
                                          type="button"
                                          onClick={() => handlePropertyTypeSelect(item.value)}
                                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-[background-color,transform] duration-200 ${
                                            isSelected
                                              ? 'bg-propertree-green/10'
                                              : 'hover:bg-slate-50 active:scale-[0.99]'
                                          }`}
                                        >
                                          <span
                                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                              isSelected
                                                ? 'bg-propertree-green/15 text-propertree-green'
                                                : 'bg-slate-100 text-slate-500'
                                            }`}
                                          >
                                            <Icon className="h-5 w-5" />
                                          </span>
                                          <span className="flex flex-col">
                                            <span
                                              className={`text-sm font-semibold ${
                                                isSelected ? 'text-propertree-green' : 'text-slate-900'
                                              }`}
                                            >
                                              {item.label}
                                            </span>
                                            <span className="text-xs text-slate-500">{item.description}</span>
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="p-2 md:pr-2 md:pl-3 flex flex-col items-end gap-2">
                            <div className="flex w-full md:w-auto items-center gap-2">
                              <button
                                type="submit"
                                aria-label={searchLoading ? t('landing.searching') : t('landing.showOffers', { defaultValue: 'Show offers' })}
                                className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-propertree-green text-white transition-[transform,background-color,box-shadow] hover:bg-propertree-green-600 hover:shadow-[0_10px_20px_rgba(44,62,58,0.25)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propertree-green/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-60 disabled:cursor-not-allowed`}
                                disabled={searchLoading}
                              >
                                <Search className="w-5 h-5" />
                                <span className="sr-only">{searchLoading ? t('landing.searching') : t('landing.showOffers', { defaultValue: 'Show offers' })}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {canShowMoreFilters && (
                    <div className="flex justify-end px-2 sm:px-3">
                      <button
                        type="button"
                        onClick={() => setShowMoreFilters((prev) => !prev)}
                        disabled={!canShowMoreFilters}
                        aria-expanded={showMoreFilters}
                        aria-controls="more-filters-panel"
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-[color,transform] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propertree-green/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${canShowMoreFilters ? 'hover:text-propertree-green active:scale-[0.98]' : 'cursor-not-allowed text-slate-300'}`}
                      >
                        <span>
                          {showMoreFilters
                            ? t('landing.lessFilters', { defaultValue: 'Less filters' })
                            : t('landing.moreFilters', { defaultValue: 'More filters' })}
                        </span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform duration-300 ${showMoreFilters ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>
                  )}

                  {canShowMoreFilters && (
                    <div
                      id="more-filters-panel"
                      aria-hidden={!showMoreFilters}
                      className={`transition-[max-height,opacity,transform,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${showMoreFilters ? 'mt-2 max-h-[70vh] sm:max-h-[420px] opacity-100 translate-y-0 overflow-y-auto sm:overflow-visible' : 'mt-0 max-h-0 opacity-0 -translate-y-1 pointer-events-none overflow-hidden'}`}
                    >
                      <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 sm:p-4">
                        <div className="flex gap-3 overflow-x-auto md:grid md:grid-cols-2 md:overflow-visible">
                          <div className="min-w-[240px] sm:min-w-0">
                            <label className={`block ${T.label} mb-2 text-left`}>
                              {t('landing.minArea', { defaultValue: 'Minimum Area' })} (m<sup>2</sup>)
                            </label>
                            <div className="relative">
                              <button
                                type="button"
                                ref={minAreaTriggerRef}
                                onClick={() => setIsMinAreaOpen((prev) => !prev)}
                                aria-expanded={isMinAreaOpen}
                                aria-controls="min-area-menu"
                                className={`flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-left text-sm font-semibold leading-snug transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-propertree-green/30 ${
                                  hasMinAreaSelection ? 'text-slate-900' : 'text-slate-400'
                                }`}
                              >
                                <span className="block truncate">{minAreaLabel}</span>
                                <ChevronDown
                                  className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${
                                    isMinAreaOpen ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>

                              {isMinAreaOpen && (
                                <div
                                  ref={minAreaPanelRef}
                                  id="min-area-menu"
                                  role="dialog"
                                  aria-label={t('landing.minArea', { defaultValue: 'Minimum Area' })}
                                  className="absolute left-0 top-full z-40 mt-3 w-[min(92vw,18rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
                                >
                                  <div className="space-y-1">
                                    {minAreaOptions.map((option) => {
                                      const isSelected = filters.min_area === option.value;
                                      return (
                                        <button
                                          key={option.value || 'any'}
                                          type="button"
                                          onClick={() => {
                                            handleFilterChange('min_area', option.value);
                                            setIsMinAreaOpen(false);
                                          }}
                                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-[background-color,transform] duration-200 ${
                                            isSelected
                                              ? 'bg-propertree-green/10 text-propertree-green'
                                              : 'text-slate-700 hover:bg-slate-50 active:scale-[0.99]'
                                          }`}
                                        >
                                          <span>{option.label}</span>
                                          {isSelected && <span className="text-xs uppercase tracking-[0.2em]">Selected</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="min-w-[240px] sm:min-w-0">
                            <label className={`block ${T.label} mb-2 text-left`}>
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
                              <div className={`mt-2 flex justify-between ${T.label}`}>
                                {vicinityOptions.map((option) => (
                                  <span key={option.value || 'any'} className="text-center">
                                    {t('landing.vicinityDistance', { defaultValue: `${option.distance} km`, distance: option.distance })}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
        className="pt-6 pb-12 md:pt-8 md:pb-14 bg-white"
      >
        <Container>
          <div className="mb-4">
            <h2 className={`${T.title} mb-2`}>
              {filters.city || filters.property_type || filters.guests ? t('landing.searchResults') : t('landing.featuredProperties')}
            </h2>
            <p className={T.label}>
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
                const terms = getRentalTerms(property);
                const hasShortTerm = terms.includes('short_term');
                const hasMidOrLong = terms.includes('mid_term') || terms.includes('long_term');
                const showMonthly = term === 'mid' || term === 'long' || (!term && !hasShortTerm && hasMidOrLong);
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
                          {propertyTypeItems.find((pt) => pt.value === property.property_type)?.label || property.property_type}
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
