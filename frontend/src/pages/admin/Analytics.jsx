/**
 * Admin Analytics - Comprehensive portfolio-wide analytics and insights
 */
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Home, Users, Euro, BarChart, 
  PieChart as PieChartIcon, LineChart, Activity, Calendar,
  MapPin, Building2, ArrowUpRight, ArrowDownRight, Info, Filter, X
} from 'lucide-react';
import { Container } from '../../components/layout';
import { Card, Loading, Modal, Select, Button, Input } from '../../components/common';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { 
  LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, 
  PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart
} from 'recharts';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [infoModal, setInfoModal] = useState({ isOpen: false, title: '', content: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Filter state (aligned with AssetPerformance)
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [propertyStatus, setPropertyStatus] = useState('');
  const [landlordId, setLandlordId] = useState('');

  const [filterOptions, setFilterOptions] = useState({
    countries: [],
    cities: [],
    propertyTypes: [
      { value: '', label: 'All Types' },
      { value: 'apartment', label: 'Apartment' },
      { value: 'house', label: 'House' },
      { value: 'condo', label: 'Condo' },
      { value: 'villa', label: 'Villa' },
      { value: 'studio', label: 'Studio' },
      { value: 'townhouse', label: 'Townhouse' },
    ],
    propertyStatuses: [
      { value: '', label: 'All Statuses' },
      { value: 'approved', label: 'Approved' },
      { value: 'draft', label: 'Draft' },
      { value: 'pending_approval', label: 'Pending Approval' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'booked', label: 'Booked' },
    ],
    landlords: [],
  });

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (country) {
      fetchCitiesForCountry();
    } else {
      setCity('');
      setFilterOptions(prev => ({ ...prev, cities: [] }));
    }
  }, [country]);

  useEffect(() => {
    fetchAnalytics();
  }, [country, city, propertyType, propertyStatus, landlordId]);

  const hasActiveFilters =
    country || city || propertyType || propertyStatus || landlordId;

  const fetchFilterOptions = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

      // Countries & cities
      const filterResponse = await fetch(`${API_BASE_URL}/admin/properties/filter-options`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (filterResponse.ok) {
        const filterData = await filterResponse.json();
        setFilterOptions(prev => ({
          ...prev,
          countries: filterData.countries || [],
          cities:
            filterData.cities ||
            (filterData.cities_by_country
              ? Object.values(filterData.cities_by_country).flat()
              : []),
        }));
      }

      // Landlords
      const landlordsResponse = await fetch(`${API_BASE_URL}/admin/users/?role=landlord`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (landlordsResponse.ok) {
        const landlordsData = await landlordsResponse.json();
        const landlordOptions = [
          { value: '', label: 'All Landlords' },
          ...(landlordsData.results || []).map(landlord => ({
            value: landlord.id,
            label: landlord.full_name || landlord.email,
          })),
        ];

        setFilterOptions(prev => ({ ...prev, landlords: landlordOptions }));
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchCitiesForCountry = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(
        `${API_BASE_URL}/admin/properties/filter-options?country=${country}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFilterOptions(prev => ({
          ...prev,
          cities: data.cities || [],
        }));
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const clearFilters = () => {
    setCountry('');
    setCity('');
    setPropertyType('');
    setPropertyStatus('');
    setLandlordId('');
  };

  const fetchAnalytics = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const params = new URLSearchParams();
      if (country) params.append('country', country);
      if (city) params.append('city', city);
      if (propertyType) params.append('property_type', propertyType);
      if (propertyStatus) params.append('property_status', propertyStatus);
      if (landlordId) params.append('landlord_id', landlordId);

      const url =
        params.toString().length > 0
          ? `${API_BASE_URL}/admin/dashboard/analytics/?${params.toString()}`
          : `${API_BASE_URL}/admin/dashboard/analytics/`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        toast.error('Error loading analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  const openInfoModal = (title, content) => {
    setInfoModal({ isOpen: true, title, content });
  };

  const closeInfoModal = () => {
    setInfoModal({ isOpen: false, title: '', content: '' });
  };

  if (loading) {
    return (
      <Container className="py-8">
        <Loading />
      </Container>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-600 mt-2">
            Portfolio-wide trends, comparisons and insights across cities, assets and time periods
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? 'primary' : 'outline'}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {[country, city, propertyType, propertyStatus, landlordId].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <Card.Header>
            <Card.Title className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                Filters
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear All
                  </Button>
                )}
                <Button onClick={() => setShowFilters(false)} variant="ghost" size="sm">
                  Close
                </Button>
              </div>
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <Select
                  value={country}
                  onChange={e => {
                    setCountry(e.target.value);
                    setCity('');
                  }}
                  options={[
                    { value: '', label: 'All Countries' },
                    ...filterOptions.countries.map(c => ({ value: c, label: c })),
                  ]}
                  placeholder="All Countries"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <Select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  options={[
                    { value: '', label: 'All Cities' },
                    ...filterOptions.cities.map(c => ({ value: c, label: c })),
                  ]}
                  placeholder={country ? 'All Cities' : 'Select Country First'}
                  disabled={!country}
                />
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <Select
                  value={propertyType}
                  onChange={e => setPropertyType(e.target.value)}
                  options={filterOptions.propertyTypes}
                />
              </div>

              {/* Property Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Status</label>
                <Select
                  value={propertyStatus}
                  onChange={e => setPropertyStatus(e.target.value)}
                  options={filterOptions.propertyStatuses}
                />
              </div>

              {/* Landlord */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landlord</label>
                <Select
                  value={landlordId}
                  onChange={e => setLandlordId(e.target.value)}
                  options={filterOptions.landlords}
                  placeholder="All Landlords"
                />
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.summary?.total_properties || 0}
                </p>
              </div>
              <Home className="w-10 h-10 text-blue-600" />
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Properties</p>
                <p className="text-2xl font-bold text-green-600">
                  {analytics?.summary?.active_properties || 0}
                </p>
              </div>
              <Activity className="w-10 h-10 text-green-600" />
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pipeline Revenue</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(analytics?.summary?.total_revenue ?? 0)}
                </p>
              </div>
              <Euro className="w-10 h-10 text-purple-600" />
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {analytics?.summary?.total_bookings || 0}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-yellow-600" />
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Time Period Comparison */}
      {analytics?.time_comparison && (
        <Card className="mb-8">
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Time Period Comparison (Last 3 Months vs Previous 3 Months)
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Last 3 Months Revenue</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(analytics.time_comparison.last_3_months.revenue)}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Previous 3 Months Revenue</p>
                <p className="text-2xl font-bold text-gray-600">
                  {formatCurrency(analytics.time_comparison.prev_3_months.revenue)}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Revenue Growth</p>
                <div className="flex items-center justify-center gap-1">
                  {analytics.time_comparison.revenue_growth >= 0 ? (
                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-red-600" />
                  )}
                  <p className={`text-2xl font-bold ${analytics.time_comparison.revenue_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.time_comparison.revenue_growth >= 0 ? '+' : ''}{analytics.time_comparison.revenue_growth.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Booking Growth</p>
                <div className="flex items-center justify-center gap-1">
                  {analytics.time_comparison.booking_growth >= 0 ? (
                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-red-600" />
                  )}
                  <p className={`text-2xl font-bold ${analytics.time_comparison.booking_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.time_comparison.booking_growth >= 0 ? '+' : ''}{analytics.time_comparison.booking_growth.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Properties by Type and Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-rose-600" />
              Properties by Type
            </Card.Title>
          </Card.Header>
          <Card.Body>
            {analytics?.by_type && analytics.by_type.length > 0 ? (
              <div className="space-y-4">
                {analytics.by_type.map((item, index) => {
                  const total = analytics.by_type.reduce((sum, i) => sum + i.count, 0);
                  const percentage = ((item.count / total) * 100).toFixed(1);
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {item.property_type?.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-600">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`${COLORS[index % COLORS.length]} h-3 rounded-full transition-all`}
                          style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <BarChart className="w-5 h-5 text-blue-600" />
              Properties by Status
            </Card.Title>
          </Card.Header>
          <Card.Body>
            {analytics?.by_status && analytics.by_status.length > 0 ? (
              <div className="space-y-4">
                {analytics.by_status.map((item, index) => {
                  const total = analytics.by_status.reduce((sum, i) => sum + i.count, 0);
                  const percentage = ((item.count / total) * 100).toFixed(1);
                  
                  const statusColors = {
                    'approved': '#10b981',
                    'pending_approval': '#f59e0b',
                    'rejected': '#ef4444',
                    'draft': '#6b7280',
                    'booked': '#3b82f6',
                  };
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {item.status?.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-600">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="h-3 rounded-full transition-all"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: statusColors[item.status] || '#6b7280'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Revenue by City - Portfolio Comparison */}
      {analytics?.revenue_by_city && analytics.revenue_by_city.length > 0 && (
        <Card className="mb-6">
          <Card.Header>
            <Card.Title className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                Revenue by City (Portfolio Comparison)
              </div>
              <button
                onClick={() => openInfoModal('Revenue by City', 'This chart compares total revenue generated across different cities in your portfolio. It helps identify which locations are most profitable.')}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Learn more"
              >
                <Info className="w-4 h-4" />
              </button>
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={analytics.revenue_by_city}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="city" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickFormatter={(value) => formatNumber(value, { maximumFractionDigits: 0 })} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => `City: ${label}`}
                />
                <Legend />
                <Bar dataKey="total_revenue" fill="#8b5cf6" name="Pipeline Revenue" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      )}

      {/* Revenue by Property Type - Asset Comparison */}
      {analytics?.revenue_by_type && analytics.revenue_by_type.length > 0 && (
        <Card className="mb-6">
          <Card.Header>
            <Card.Title className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-600" />
                Revenue by Property Type (Asset Comparison)
              </div>
              <button
                onClick={() => openInfoModal('Revenue by Property Type', 'This comparison shows which property types generate the most revenue across your portfolio. Use this to identify the most profitable asset types.')}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Learn more"
              >
                <Info className="w-4 h-4" />
              </button>
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={analytics.revenue_by_type}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="property_type" angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left" tickFormatter={(value) => formatNumber(value, { maximumFractionDigits: 0 })} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => formatNumber(value, { maximumFractionDigits: 0 })}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'Pipeline Revenue') return formatCurrency(value);
                    if (name === 'Avg Price') return `${formatCurrency(value)}/night`;
                    return value;
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="total_revenue" fill="#10b981" name="Pipeline Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="avg_price" stroke="#3b82f6" strokeWidth={2} name="Avg Price/Night" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      )}

      {/* Occupancy by City */}
      {analytics?.occupancy_by_city && analytics.occupancy_by_city.length > 0 && (
        <Card className="mb-6">
          <Card.Header>
            <Card.Title className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-600" />
                Occupancy Rate by City
              </div>
              <button
                onClick={() => openInfoModal('Occupancy by City', 'This chart shows the occupancy rates across different cities, helping you identify which locations have the highest demand and utilization.')}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Learn more"
              >
                <Info className="w-4 h-4" />
              </button>
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={analytics.occupancy_by_city}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="city" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis domain={[0, 100]} tickFormatter={(value) => formatNumber(value, { maximumFractionDigits: 0 })} />
                <Tooltip 
                  formatter={(value) => `${value}%`}
                  labelFormatter={(label) => `City: ${label}`}
                />
                <Legend />
                <Bar dataKey="occupancy_rate" fill="#f59e0b" name="Occupancy Rate %" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      )}

      {/* Top Cities and Top Properties */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Cities */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              Top 10 Cities by Property Count
            </Card.Title>
          </Card.Header>
          <Card.Body>
            {analytics?.by_city && analytics.by_city.length > 0 ? (
              <div className="space-y-3">
                {analytics.by_city.map((item, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{item.city || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{item.country || ''}</p>
                        {item.avg_price && (
                          <p className="text-xs text-gray-600 mt-1">
                            Avg: {formatCurrency(item.avg_price)}/night
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-700">{item.count}</p>
                        <p className="text-xs text-gray-500">properties</p>
                        {item.total_revenue && (
                          <p className="text-xs text-green-600 mt-1">
                            {formatCurrency(item.total_revenue)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </Card.Body>
        </Card>

        {/* Top Performing Properties */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Top Performing Properties
            </Card.Title>
          </Card.Header>
          <Card.Body>
            {analytics?.top_properties && analytics.top_properties.length > 0 ? (
              <div className="space-y-3">
                {analytics.top_properties.map((item, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.city}, {item.country}</p>
                        <p className="text-xs text-gray-600 mt-1 capitalize">{item.type?.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(item.revenue)}
                        </p>
                        <p className="text-xs text-gray-500">{item.bookings} bookings</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Average Price by Type */}
      <Card className="mb-6">
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Euro className="w-5 h-5 text-green-600" />
            Average Price by Property Type
          </Card.Title>
        </Card.Header>
        <Card.Body>
          {analytics?.avg_price_by_type && analytics.avg_price_by_type.length > 0 ? (
            <div className="space-y-4">
              {analytics.avg_price_by_type.map((item, index) => {
                const maxPrice = Math.max(...analytics.avg_price_by_type.map(i => parseFloat(i.avg_price) || 0));
                const barWidth = maxPrice > 0 ? ((parseFloat(item.avg_price || 0) / maxPrice) * 100).toFixed(1) : 0;
                
                return (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {item.property_type?.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(item.avg_price || 0)} / night
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all flex items-center justify-end pr-2"
                        style={{ width: `${barWidth}%` }}
                      >
                        <span className="text-xs text-white font-semibold">
                          {barWidth > 15 ? formatCurrency(item.avg_price || 0, '€', { maximumFractionDigits: 0 }) : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </Card.Body>
      </Card>

      {/* Property Creation Trend with Revenue and Bookings */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-blue-600" />
            Portfolio Trends (Last 12 Months)
          </Card.Title>
        </Card.Header>
        <Card.Body>
          {analytics?.monthly_trend && analytics.monthly_trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={analytics.monthly_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                <YAxis
                  yAxisId="left"
                  label={{ value: 'Properties Created', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => formatNumber(value, { maximumFractionDigits: 0 })}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  label={{ value: 'Revenue (€)', angle: 90, position: 'insideRight' }}
                  tickFormatter={(value) => formatNumber(value, { maximumFractionDigits: 0 })}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'Properties Created') return value;
                    if (name === 'Revenue') return formatCurrency(value);
                    if (name === 'Bookings') return value;
                    return value;
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Properties Created" />
                <Area yAxisId="right" type="monotone" dataKey="revenue" fill="#10b981" fillOpacity={0.6} stroke="#10b981" name="Revenue" />
                <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#f59e0b" strokeWidth={2} name="Bookings" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </Card.Body>
      </Card>

      {/* Info Modal */}
      <Modal
        isOpen={infoModal.isOpen}
        onClose={closeInfoModal}
        title={infoModal.title}
        size="md"
      >
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {infoModal.content}
          </p>
        </div>
      </Modal>
    </Container>
  );
};

export default Analytics;
