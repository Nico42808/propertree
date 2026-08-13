/**
 * Property Detail Page - Shows detailed property information
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks';
import { Container } from '../components/layout';
import { Card, Button, Badge, Loading, EmptyState } from '../components/common';
import { MapPin, Users, Bed, Bath, Home, ChevronLeft, ChevronRight, Check, X, Wifi, Car, Utensils, Tv, Wind, Waves, Dumbbell, Coffee, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';
import { parseLocalDate, startOfToday, toLocalDateString } from '../utils/date';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const PropertyDetail = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const bookingTerm = searchParams.get('term') || sessionStorage.getItem('bookingTerm') || '';
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [bookingData, setBookingData] = useState({
    check_in: '',
    check_out: '',
    guests_count: 1
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const normalizeDate = (dateValue) => {
    return parseLocalDate(dateValue);
  };

  const addDays = (dateValue, days) => {
    const d = normalizeDate(dateValue);
    if (!d) return null;
    d.setDate(d.getDate() + days);
    return d;
  };

  const addMonths = (dateValue, months) => {
    const d = normalizeDate(dateValue);
    if (!d) return null;
    const origDay = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() < origDay) {
      d.setDate(0);
    }
    return d;
  };

  const getEffectiveBookingTerm = (fallbackTerm = '') => {
    const directTerm = fallbackTerm || bookingTerm;
    if (directTerm) {
      return directTerm;
    }
    const rentalTerms = Array.isArray(property?.rental_terms) ? property.rental_terms : [];
    const hasShort = rentalTerms.includes('short_term');
    const hasMid = rentalTerms.includes('mid_term');
    const hasLong = rentalTerms.includes('long_term');
    if (!hasShort && (hasMid || hasLong)) return 'mid';
    if (hasShort) return 'short';
    if (hasMid) return 'mid';
    if (hasLong) return 'long';
    return '';
  };

  const getCheckoutBounds = (checkInValue, termOverride = '') => {
    if (!checkInValue) return { minDate: null, maxDate: null };
    const checkIn = normalizeDate(checkInValue);
    if (!checkIn) return { minDate: null, maxDate: null };
    const activeTerm = getEffectiveBookingTerm(termOverride);

    if (activeTerm === 'short') {
      return { minDate: addDays(checkIn, 1), maxDate: addDays(checkIn, 28) };
    }
    if (activeTerm === 'mid') {
      return { minDate: addMonths(checkIn, 1), maxDate: addMonths(checkIn, 12) };
    }
    if (activeTerm === 'long') {
      return { minDate: addDays(addMonths(checkIn, 12), 1), maxDate: null };
    }

    return { minDate: addDays(checkIn, 1), maxDate: null };
  };

  const isCheckoutWithinBounds = (checkOutDate, checkInValue, termOverride = '') => {
    const activeTerm = getEffectiveBookingTerm(termOverride);
    if (!activeTerm || !checkInValue || !checkOutDate) return true;
    const { minDate, maxDate } = getCheckoutBounds(checkInValue, activeTerm);
    const checkout = normalizeDate(checkOutDate);
    if (!checkout) return false;
    if (minDate && checkout < minDate) return false;
    if (maxDate && checkout > maxDate) return false;
    return true;
  };

  const getTermLimitMessage = (termOverride = '') => {
    const activeTerm = getEffectiveBookingTerm(termOverride);
    if (activeTerm === 'short') {
      return t('propertyDetail.shortTermLimit', {
        defaultValue: 'Short-term stays allow check-out up to 4 weeks from check-in.',
      });
    }
    if (activeTerm === 'mid') {
      return t('propertyDetail.midTermLimit', {
        defaultValue: 'Mid-term stays require check-out between 1 month and 1 year from check-in.',
      });
    }
    if (activeTerm === 'long') {
      return t('propertyDetail.longTermLimit', {
        defaultValue: 'Long-term stays require check-out at least 1 year after check-in.',
      });
    }
    return '';
  };

  // Helper function to check if a date is available
  const isDateAvailable = (dateString) => {
    if (!property?.booked_dates || property.booked_dates.length === 0) {
      return true;
    }

    const date = normalizeDate(dateString);
    const today = startOfToday();

    if (!date) {
      return false;
    }

    // Don't allow past dates
    if (date < today) {
      return false;
    }

    // Check if date falls within any booked range
    for (const booking of property.booked_dates) {
      const checkIn = normalizeDate(booking.check_in);
      const checkOut = normalizeDate(booking.check_out);
      if (!checkIn || !checkOut) {
        continue;
      }
      
      // Date is unavailable if it's >= check_in and < check_out
      if (date >= checkIn && date < checkOut) {
        return false;
      }
    }

    return true;
  };

  // Helper function to check if a date should be disabled in the date picker
  const isDateDisabled = (date) => {
    const today = startOfToday();
    const target = normalizeDate(date);

    // Disable past dates
    if (!target || target < today) {
      return true;
    }

    // Disable dates that fall within booked ranges
    if (property?.booked_dates && property.booked_dates.length > 0) {
      for (const booking of property.booked_dates) {
        const checkIn = normalizeDate(booking.check_in);
        const checkOut = normalizeDate(booking.check_out);
        if (!checkIn || !checkOut) {
          continue;
        }
        
        // Date is disabled if it's >= check_in and < check_out
        if (target >= checkIn && target < checkOut) {
          return true;
        }
      }
    }

    return false;
  };

  const isCheckoutDateDisabled = (date) => {
    if (isDateDisabled(new Date(date))) {
      return true;
    }

    const activeTerm = getEffectiveBookingTerm();
    if (!bookingData.check_in || !activeTerm) {
      return false;
    }

    const { minDate, maxDate } = getCheckoutBounds(bookingData.check_in, activeTerm);
    const target = normalizeDate(date);

    if (minDate && target < minDate) return true;
    if (maxDate && target > maxDate) return true;

    return false;
  };

  const hasDateRangeConflict = (checkInDate, checkOutDate) => {
    if (!property?.booked_dates || !checkInDate || !checkOutDate) {
      return false;
    }

    return property.booked_dates.some((booking) => {
      const bookedCheckIn = normalizeDate(booking.check_in);
      const bookedCheckOut = normalizeDate(booking.check_out);
      if (!bookedCheckIn || !bookedCheckOut) {
        return false;
      }
      return checkInDate < bookedCheckOut && checkOutDate > bookedCheckIn;
    });
  };

  const fetchProperty = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/properties/${id}/`);
      
      if (response.ok) {
        const data = await response.json();
        setProperty(data);
      } else {
        toast.error(t('propertyDetail.failedToLoadProperty'));
        navigate('/search');
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error(t('propertyDetail.errorLoadingProperty'));
      navigate('/search');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!property) return;
    const requestedCheckIn = searchParams.get('check_in');
    const requestedCheckOut = searchParams.get('check_out');
    if (!requestedCheckIn && !requestedCheckOut) return;

    setBookingData((prev) => {
      if (prev.check_in || prev.check_out) {
        return prev;
      }

      const today = startOfToday();
      let checkInDate = normalizeDate(requestedCheckIn);
      let checkOutDate = normalizeDate(requestedCheckOut);

      if (!checkInDate || checkInDate < today) {
        return prev;
      }

      if (checkOutDate && checkOutDate <= checkInDate) {
        checkOutDate = null;
      }

      const activeTerm = getEffectiveBookingTerm();
      if (checkOutDate && !isCheckoutWithinBounds(checkOutDate, toLocalDateString(checkInDate), activeTerm)) {
        checkOutDate = null;
      }

      if (!isDateAvailable(toLocalDateString(checkInDate))) {
        return prev;
      }

      if (checkOutDate && hasDateRangeConflict(checkInDate, checkOutDate)) {
        checkOutDate = null;
      }

      if (!checkOutDate && (activeTerm === 'mid' || activeTerm === 'long')) {
        const { minDate } = getCheckoutBounds(checkInDate, activeTerm);
        if (minDate && !hasDateRangeConflict(checkInDate, minDate)) {
          checkOutDate = minDate;
        }
      }

      const nextCheckIn = checkInDate ? toLocalDateString(checkInDate) : '';
      const nextCheckOut = checkOutDate ? toLocalDateString(checkOutDate) : '';

      if (nextCheckIn === prev.check_in && nextCheckOut === prev.check_out) {
        return prev;
      }

      return { ...prev, check_in: nextCheckIn, check_out: nextCheckOut };
    });
  }, [property, searchParamsKey]);

  const handleClose = () => {
    if (isAdmin()) {
      navigate('/admin/properties');
      return;
    }
    navigate('/');
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    // Validate dates
    if (!bookingData.check_in || !bookingData.check_out) {
      toast.error(t('propertyDetail.pleaseSelectDates'));
      return;
    }

    const checkIn = normalizeDate(bookingData.check_in);
    const checkOut = normalizeDate(bookingData.check_out);

    if (!checkIn || !checkOut) {
      toast.error(t('propertyDetail.pleaseSelectDates'));
      return;
    }
    
    if (checkIn >= checkOut) {
      toast.error(t('propertyDetail.checkoutAfterCheckin'));
      return;
    }

    const activeTerm = getEffectiveBookingTerm();
    if (!isCheckoutWithinBounds(checkOut, bookingData.check_in, activeTerm)) {
      const message = getTermLimitMessage(activeTerm);
      toast.error(message || t('propertyDetail.checkoutAfterCheckin'));
      return;
    }

    const today = startOfToday();
    if (checkIn < today) {
      toast.error(t('propertyDetail.checkinNotPast'));
      return;
    }

    // Validate that selected dates are available
    if (!isDateAvailable(bookingData.check_in)) {
      toast.error(t('propertyDetail.checkinNotAvailable'));
      return;
    }

    // Check if any date in the range is unavailable
    const dateRange = [];
    for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
      dateRange.push(toLocalDateString(d));
    }

    const unavailableDates = dateRange.filter(date => !isDateAvailable(date));
    if (unavailableDates.length > 0) {
      toast.error(t('propertyDetail.datesIncludeUnavailable'));
      return;
    }

    setBookingLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error(t('propertyDetail.pleaseLoginToBook'));
        navigate('/login');
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/bookings/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          property: property.id,
          check_in: bookingData.check_in,
          check_out: bookingData.check_out,
          guests_count: bookingData.guests_count
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(t('propertyDetail.bookingSubmitted'));
        setShowBookingModal(false);
        setBookingData({ check_in: '', check_out: '', guests_count: 1 });
        navigate('/tenant/bookings');
      } else {
        const errorData = await response.json();
        // DRF returns validation errors under 'non_field_errors' or per-field keys,
        // not under 'error'. Surface whatever message actually came back.
        let backendMessage =
          errorData.error ||
          (Array.isArray(errorData.non_field_errors) && errorData.non_field_errors[0]) ||
          (Array.isArray(errorData.detail) && errorData.detail[0]) ||
          errorData.detail;

        if (!backendMessage) {
          const firstFieldErrors = Object.values(errorData).find(v => Array.isArray(v) && v.length);
          if (firstFieldErrors) backendMessage = firstFieldErrors[0];
        }

        console.error('Booking creation failed:', errorData);
        toast.error(backendMessage || t('propertyDetail.failedToCreateBooking'));
      }
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(t('propertyDetail.errorSubmittingBooking'));
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-8">
        <Loading />
      </Container>
    );
  }

  if (!property) {
    return (
      <Container className="py-8">
        <EmptyState
          icon={<Home className="w-16 h-16" />}
          title={t('propertyDetail.propertyNotFound')}
          message={t('propertyDetail.propertyNotFoundMessage')}
          action={() => navigate('/search')}
          actionLabel={t('propertyDetail.backToSearch')}
        />
      </Container>
    );
  }

  // Extract photo previews from the photos array and normalize items
  // Backend may return an array of strings (URLs) or objects with { preview, url }
  const photos = property.photos || [];
  const normalizedPhotos = photos.map((p) => (typeof p === 'string' ? { url: p } : (p || {})));
  const selectedPhoto = normalizedPhotos[selectedImageIndex];

  const handlePreviousImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? normalizedPhotos.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev === normalizedPhotos.length - 1 ? 0 : prev + 1));
  };

  // Common amenity icons and names mapping
  const amenityConfig = {
    'wifi': { nameKey: 'amenities.wifi', icon: Wifi },
    'parking': { nameKey: 'amenities.parking', icon: Car },
    'kitchen': { nameKey: 'amenities.kitchen', icon: Utensils },
    'gym': { nameKey: 'amenities.gym', icon: Dumbbell },
    'pool': { nameKey: 'amenities.pool', icon: Waves },
    'ac': { nameKey: 'amenities.airConditioning', icon: Wind },
    'air_conditioning': { nameKey: 'amenities.airConditioning', icon: Wind },
    'tv': { nameKey: 'amenities.tv', icon: Tv },
    'breakfast': { nameKey: 'amenities.breakfast', icon: Coffee },
  };

  const getAmenityConfig = (amenity) => {
    const key = amenity.toLowerCase();
    const config = amenityConfig[key];
    if (config) {
      return { name: t(config.nameKey), icon: config.icon };
    }
    return { name: amenity, icon: Check };
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="fixed top-4 right-4 z-40 w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Property Content */}
      <Container className="py-8">
        <div className="max-w-6xl mx-auto">
          {/* Image Gallery */}
          <div className="mb-8">
            {/* Main Image */}
            <div className="relative detail-hero rounded-2xl overflow-hidden bg-gray-200 mb-4">
              {selectedPhoto ? (
                <img
                  src={selectedPhoto.preview || selectedPhoto.url}
                  alt={property.title}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setShowLightbox(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Home className="w-24 h-24 text-gray-400" />
                </div>
              )}

              {/* Navigation Arrows */}
              {normalizedPhotos.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {selectedImageIndex + 1} / {normalizedPhotos.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {normalizedPhotos.length > 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {normalizedPhotos.slice(0, 5).map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative detail-thumb rounded-lg overflow-hidden border-2 transition-all ${
                      index === selectedImageIndex
                        ? 'border-propertree-green shadow-md'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {photo.preview || photo.url ? (
                      <img
                        src={photo.preview || photo.url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Home className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    {index === 4 && normalizedPhotos.length > 5 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold">
                        +{normalizedPhotos.length - 5}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Title and Price */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {property.title}
              </h1>
              <div className="flex items-center text-gray-600 text-lg mb-4">
                {property.city}, {property.country}
              </div>
            </div>
            <div className="text-left md:text-right mt-4 md:mt-0">
              {(() => {
                const term = sessionStorage.getItem('bookingTerm') || '';
                const rentalTerms = Array.isArray(property.rental_terms) ? property.rental_terms : [];
                const hasShortTerm = rentalTerms.includes('short_term');
                const hasMidOrLong = rentalTerms.includes('mid_term') || rentalTerms.includes('long_term');
                const showMonthly = (term === 'mid' || term === 'long') ? hasMidOrLong : (!term && !hasShortTerm && hasMidOrLong);
                const monthlyPrice = property.monthly_price ?? (property.price_per_night ? property.price_per_night * 30 : 0);
                const displayPrice = showMonthly ? monthlyPrice : property.price_per_night;
                const priceLabel = showMonthly
                  ? t('propertyDetail.perMonth', { defaultValue: 'per month' })
                  : t('propertyDetail.perNight');

                return (
                  <>
                    <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                      {formatCurrency(displayPrice)}
                    </div>
                    <div className="text-gray-600">{priceLabel}</div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Property Stats */}
          <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b">
            <div className="flex items-center gap-2 text-gray-700">
              <Bed className="w-5 h-5 text-gray-600" />
              <span><span className="font-semibold">{property.bedrooms}</span> {property.bedrooms > 1 ? t('propertyDetail.bedrooms') : t('propertyDetail.bedroom')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Bath className="w-5 h-5 text-gray-600" />
              <span><span className="font-semibold">{Math.round(property.bathrooms)}</span> {Math.round(property.bathrooms) > 1 ? t('propertyDetail.bathrooms') : t('propertyDetail.bathroom')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="w-5 h-5 text-gray-600" />
              <span>{t('propertyDetail.upTo')} <span className="font-semibold">{property.max_guests}</span> {property.max_guests > 1 ? t('propertyDetail.guests') : t('propertyDetail.guest')}</span>
            </div>
          </div>

          {/* About Section */}
          <div className="mb-8 pb-8 border-b">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('propertyDetail.aboutThisPlace')}</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="mb-8 pb-8 border-b">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('propertyDetail.amenities')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {property.amenities.map((amenity, index) => {
                  const config = getAmenityConfig(amenity);
                  const IconComponent = config.icon;
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      <span className="text-gray-700">{config.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ready to Book Section */}
          <div className="bg-gray-50 rounded-2xl p-5 sm:p-6 lg:p-8 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('propertyDetail.readyToBook')}</h3>
                <p className="text-gray-600">{t('propertyDetail.experienceProfessional')}</p>
              </div>
              <Button
                onClick={() => setShowBookingModal(true)}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto md:w-auto whitespace-nowrap px-8"
              >
                {t('propertyDetail.bookNow')}
              </Button>
            </div>
          </div>

          {/* Host Information */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-semibold mb-6">{t('propertyDetail.hostedBy')}</h2>
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Picture */}
                <div className="flex-shrink-0 relative">
                  {property.landlord_profile?.profile_photo ? (
                    <>
                      <img
                        src={property.landlord_profile.profile_photo}
                        alt={property.landlord_name || 'Host'}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-100 shadow-md"
                        onError={(e) => {
                          // Hide image and show fallback
                          e.target.style.display = 'none';
                          const fallback = e.target.parentElement.querySelector('.profile-fallback');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div
                        className="profile-fallback w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white items-center justify-center text-3xl font-bold shadow-md hidden"
                      >
                        {property.landlord_name?.charAt(0)?.toUpperCase() || property.landlord_email?.charAt(0)?.toUpperCase() || 'H'}
                      </div>
                    </>
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-3xl font-bold shadow-md">
                      {property.landlord_name?.charAt(0)?.toUpperCase() || property.landlord_email?.charAt(0)?.toUpperCase() || 'H'}
                    </div>
                  )}
                </div>

                {/* Host Details */}
                <div className="flex-1">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {property.landlord_name || t('propertyDetail.propertyHost')}
                    </h3>
                    <p className="text-gray-600 text-sm">{property.landlord_email}</p>
                    {property.landlord_profile?.phone_number && (
                      <p className="text-gray-600 text-sm mt-1">
                        <Phone className="w-4 h-4 inline mr-1" />
                        {property.landlord_profile.phone_number}
                      </p>
                    )}
                  </div>

                  {/* Bio */}
                  {property.landlord_profile?.bio ? (
                    <div className="mb-4">
                      <p className="text-gray-700 leading-relaxed">
                        {property.landlord_profile.bio}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <p className="text-gray-500 italic text-sm">
                        {t('propertyDetail.noBioAvailable')}
                      </p>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
                    {property.landlord_profile?.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate max-w-xs">{property.landlord_profile.address}</span>
                      </div>
                    )}
                    {property.created_at && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{t('propertyDetail.memberSince')} {new Date(property.created_at).getFullYear()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Container>

      {/* Booking Modal - Will show when Book Now is clicked */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">{t('propertyDetail.bookThisProperty')}</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('propertyDetail.checkIn')}
                </label>
                <DatePicker
                  selected={bookingData.check_in ? normalizeDate(bookingData.check_in) : null}
                  onChange={(date) => {
                    if (date) {
                      const dateString = toLocalDateString(date);
                      const activeTerm = getEffectiveBookingTerm();
                      const nextData = { ...bookingData, check_in: dateString };
                      if (bookingData.check_out) {
                        const isValid = isCheckoutWithinBounds(
                          normalizeDate(bookingData.check_out),
                          dateString,
                          activeTerm
                        );
                        if (!isValid) {
                          nextData.check_out = '';
                        }
                      }
                      if (!nextData.check_out && (activeTerm === 'mid' || activeTerm === 'long')) {
                        const { minDate } = getCheckoutBounds(dateString, activeTerm);
                        if (minDate) {
                          const checkOutDate = minDate;
                          let hasConflict = false;
                          if (property?.booked_dates) {
                            const checkInDate = normalizeDate(dateString);
                            for (const booking of property.booked_dates) {
                              const bookedCheckIn = normalizeDate(booking.check_in);
                              const bookedCheckOut = normalizeDate(booking.check_out);
                              if (checkInDate < bookedCheckOut && checkOutDate > bookedCheckIn) {
                                hasConflict = true;
                                break;
                              }
                            }
                          }
                          if (!hasConflict && isCheckoutWithinBounds(checkOutDate, dateString, activeTerm)) {
                            nextData.check_out = toLocalDateString(checkOutDate);
                          }
                        }
                      }
                      setBookingData(nextData);
                    }
                  }}
                  filterDate={(date) => !isDateDisabled(date)}
                  minDate={startOfToday()}
                  dateFormat="dd-MM-yyyy"
                  placeholderText={t('propertyDetail.selectCheckInDate')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-propertree-green"
                  required
                  wrapperClassName="w-full"
                />
                {property?.booked_dates && property.booked_dates.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('propertyDetail.bookedDatesDisabled')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('propertyDetail.checkOut')}
                </label>
                <DatePicker
                  selected={bookingData.check_out ? normalizeDate(bookingData.check_out) : null}
                  onChange={(date) => {
                    if (date) {
                      const dateString = toLocalDateString(date);
                      const checkInDate = bookingData.check_in ? normalizeDate(bookingData.check_in) : null;
                      const checkOutDate = normalizeDate(date);
                      
                      if (checkInDate && checkOutDate <= checkInDate) {
                        toast.error(t('propertyDetail.checkoutAfterCheckin'));
                        return;
                      }

                      const activeTerm = getEffectiveBookingTerm();
                      if (checkInDate && !isCheckoutWithinBounds(checkOutDate, bookingData.check_in, activeTerm)) {
                        const message = getTermLimitMessage(activeTerm);
                        toast.error(message || t('propertyDetail.checkoutAfterCheckin'));
                        return;
                      }

                      // Check if the date range overlaps with any booking
                      let hasConflict = false;
                      if (checkInDate && property?.booked_dates) {
                        for (const booking of property.booked_dates) {
                          const bookedCheckIn = normalizeDate(booking.check_in);
                          const bookedCheckOut = normalizeDate(booking.check_out);
                          
                          // Check for overlap: new booking overlaps if check_in < booked_check_out AND check_out > booked_check_in
                          if (checkInDate < bookedCheckOut && checkOutDate > bookedCheckIn) {
                            hasConflict = true;
                            break;
                          }
                        }
                      }

                      if (hasConflict) {
                        toast.error(t('propertyDetail.datesConflict'));
                      } else {
                        setBookingData({ ...bookingData, check_out: dateString });
                      }
                    }
                  }}
                  filterDate={(date) => !isCheckoutDateDisabled(date)}
                  minDate={
                    bookingData.check_in
                      ? (getCheckoutBounds(bookingData.check_in, getEffectiveBookingTerm()).minDate || normalizeDate(bookingData.check_in))
                      : startOfToday()
                  }
                  maxDate={getCheckoutBounds(bookingData.check_in, getEffectiveBookingTerm()).maxDate || null}
                  dateFormat="dd-MM-yyyy"
                  placeholderText={t('propertyDetail.selectCheckOutDate')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-propertree-green"
                  required
                  wrapperClassName="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('propertyDetail.guests')}
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-propertree-green"
                  value={bookingData.guests_count}
                  onChange={(e) => setBookingData({ ...bookingData, guests_count: parseInt(e.target.value) })}
                  required
                  min="1"
                  max={property.max_guests}
                />
                <p className="text-xs text-gray-500 mt-1">{t('propertyDetail.max')}: {property.max_guests} {t('propertyDetail.guests')}</p>
              </div>

              {/* Price Calculation */}
              {bookingData.check_in && bookingData.check_out && (
                <div className="border-t pt-4 space-y-2">
                  {(() => {
                    const checkIn = new Date(bookingData.check_in);
                    const checkOut = new Date(bookingData.check_out);
                    const nights = Math.max(0, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
                    const rentalTerms = Array.isArray(property.rental_terms) ? property.rental_terms : [];
                    const hasShortTerm = rentalTerms.includes('short_term');
                    const activeTerm = getEffectiveBookingTerm();
                    const useMonthly = activeTerm === 'mid' || activeTerm === 'long' || (!activeTerm && !hasShortTerm);
                    const nightlyRate = Number.isFinite(Number(property.price_per_night)) ? Number(property.price_per_night) : 0;
                    const monthlyRate = property.monthly_price !== null && property.monthly_price !== undefined && property.monthly_price !== ''
                      ? Number(property.monthly_price)
                      : null;
                    const baseMonthly = Number.isFinite(monthlyRate)
                      ? monthlyRate
                      : (nightlyRate ? nightlyRate * 30 : 0);
                    const dailyRate = useMonthly ? (baseMonthly ? baseMonthly / 30 : 0) : nightlyRate;
                    const months = nights / 30;
                    const displayMonths = Math.max(1, Math.round(months));
                    const total = useMonthly ? baseMonthly * months : nightlyRate * nights;
                    const showMonthlyBreakdown = useMonthly && nights >= 30;
                    const rateLabel = showMonthlyBreakdown
                      ? t('propertyDetail.perMonth', { defaultValue: 'per month' })
                      : useMonthly
                        ? t('propertyDetail.perDay', { defaultValue: 'per day' })
                        : t('propertyDetail.perNight');
                    const durationLabel = showMonthlyBreakdown
                      ? ''
                      : useMonthly
                        ? t('propertyDetail.days', { defaultValue: 'days' })
                        : t('propertyDetail.nights');

                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {showMonthlyBreakdown ? (
                              <>
                                {formatCurrency(baseMonthly)} {rateLabel} x {displayMonths}
                              </>
                            ) : (
                              <>
                                {formatCurrency(dailyRate)} {rateLabel} x {nights} {durationLabel}
                              </>
                            )}
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(total)}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                          <span>{t('propertyDetail.total')}</span>
                          <span className="text-propertree-green">
                            {formatCurrency(total)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={bookingLoading}
              >
                {bookingLoading ? t('propertyDetail.processing') : t('propertyDetail.confirmBooking')}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          {/* Navigation Arrows */}
          {normalizedPhotos.length > 1 && (
            <>
              <button
                onClick={handlePreviousImage}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            </>
          )}

          {/* Main Image */}
          <div className="relative max-w-7xl max-h-[80vh] w-full flex items-center justify-center">
            {selectedPhoto ? (
              <img
                src={selectedPhoto.preview || selectedPhoto.url}
                alt={property.title}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Home className="w-24 h-24 text-white/50" />
              </div>
            )}
          </div>

          {/* Image Counter */}
          {normalizedPhotos.length > 1 && (
            <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
              {selectedImageIndex + 1} / {normalizedPhotos.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;
