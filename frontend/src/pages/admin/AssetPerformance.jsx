/**
 * Asset Performance & KPIs - Manage asset performance and KPIs
 */
import React, { useState, useEffect } from 'react';
import { Container } from '../../components/layout';
import { Card, Loading, Button, Select, Modal, Input } from '../../components/common';
import { 
  TrendingUp, TrendingDown, Euro, Home, 
  Users, Calendar, BarChart3, PieChart, Activity,
  ArrowUpRight, ArrowDownRight, Info, Filter, X
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const AssetPerformance = () => {
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [infoModal, setInfoModal] = useState({ isOpen: false, title: '', content: '' });
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [propertyStatus, setPropertyStatus] = useState('approved');
  const [landlordId, setLandlordId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [useCustomDateRange, setUseCustomDateRange] = useState(false);
  
  // Filter options
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
    fetchPerformanceData();
  }, [timeRange, country, city, propertyType, propertyStatus, landlordId, startDate, endDate, useCustomDateRange]);

  const fetchFilterOptions = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      
      // Fetch countries and cities
      const filterResponse = await fetch(`${API_BASE_URL}/admin/properties/filter-options`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (filterResponse.ok) {
        const filterData = await filterResponse.json();
        setFilterOptions(prev => ({
          ...prev,
          countries: filterData.countries || [],
          cities: filterData.cities || filterData.cities_by_country ? Object.values(filterData.cities_by_country).flat() : []
        }));
      }
      
      // Fetch landlords
      const landlordsResponse = await fetch(`${API_BASE_URL}/admin/users/?role=landlord`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (landlordsResponse.ok) {
        const landlordsData = await landlordsResponse.json();
        const landlordOptions = [
          { value: '', label: 'All Landlords' },
          ...(landlordsData.results || []).map(landlord => ({
            value: landlord.id,
            label: landlord.full_name || landlord.email
          }))
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
      const response = await fetch(`${API_BASE_URL}/admin/properties/filter-options?country=${country}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(prev => ({
          ...prev,
          cities: data.cities || []
        }));
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (useCustomDateRange && startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        params.append('days', timeRange);
      }
      
      if (country) params.append('country', country);
      if (city) params.append('city', city);
      if (propertyType) params.append('property_type', propertyType);
      if (propertyStatus) params.append('property_status', propertyStatus);
      if (landlordId) params.append('landlord_id', landlordId);
      
      const response = await fetch(`${API_BASE_URL}/admin/analytics/performance/?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data);
      } else {
        toast.error('Error loading performance data');
        setPerformanceData(null);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast.error('Error loading performance data');
      setPerformanceData(null);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setCountry('');
    setCity('');
    setPropertyType('');
    setPropertyStatus('approved');
    setLandlordId('');
    setStartDate('');
    setEndDate('');
    setUseCustomDateRange(false);
  };

  const hasActiveFilters = country || city || propertyType || propertyStatus !== 'approved' || landlordId || useCustomDateRange;

  const openInfoModal = (title, content) => {
    setInfoModal({ isOpen: true, title, content });
  };

  const closeInfoModal = () => {
    setInfoModal({ isOpen: false, title: '', content: '' });
  };

  // KPI explanations
  const kpiExplanations = {
    total_revenue: {
      title: 'Pipeline Revenue',
      content: 'Pipeline Revenue represents the sum of all confirmed and completed bookings within the selected time period. This includes the total_price from all bookings with status "confirmed" or "completed" that were created during the period. The percentage change compares this period\'s revenue to the previous period of equal length.'
    },
    occupancy_rate: {
      title: 'Occupancy Rate',
      content: 'Occupancy Rate is calculated as the percentage of available property-days that are booked. It is computed by dividing the total booked days (sum of overlapping booking periods within the time range) by the total available days (number of approved properties × days in period). This provides a more accurate measure than simply counting properties, as it accounts for partial bookings and booking durations.'
    },
    average_booking_value: {
      title: 'Average Booking Value',
      content: 'Average Booking Value is the mean revenue per booking, calculated by dividing total revenue by the number of confirmed/completed bookings in the period. The percentage change compares the current period\'s average to the previous period\'s average, helping identify trends in booking value over time.'
    },
    total_bookings: {
      title: 'Total Bookings',
      content: 'Total Bookings is the count of all bookings with status "confirmed" or "completed" that were created within the selected time period. The percentage change compares this count to the previous period of equal length, showing growth or decline in booking volume.'
    },
    revenue_vs_expenses: {
      title: 'Revenue vs Expenses Chart',
      content: 'This chart displays monthly revenue (from confirmed/completed bookings) and expenses (from PropertyExpense records) over the last 6 months. Revenue is calculated from booking total_price values, while expenses are aggregated from PropertyExpense entries. The chart helps visualize the relationship between income and costs over time.'
    },
    profit_trend: {
      title: 'Profit Trend Chart',
      content: 'The Profit Trend shows the monthly profit (Revenue - Expenses) over the last 6 months as an area chart. Profit is calculated by subtracting total expenses from total revenue for each month. This visualization helps identify profitability trends and seasonal patterns.'
    },
    property_performance: {
      title: 'Property Performance Breakdown',
      content: 'This table shows the top 10 properties ranked by revenue within the selected time period. For each property, it displays: Revenue (sum of booking total_price), Bookings (count of confirmed/completed bookings), and Occupancy (percentage of days booked within the period). Occupancy is calculated as (booked days / total days in period) × 100, capped at 100%.'
    },
    expense_categories: {
      title: 'Expenses by Category',
      content: 'This visualization breaks down expenses by category based on PropertyExpense records within the selected time period. Categories include Management Fees, Mortgage/Loan, Cleaning, Maintenance, Utilities, Taxes, Insurance, HOA Fees, Repairs, and Other. The pie chart and list show both the absolute amounts and percentage distribution of expenses across categories.'
    }
  };

  if (loading) {
    return (
      <Container className="py-8">
        <Loading />
      </Container>
    );
  }

  if (!performanceData) {
    return (
      <Container className="py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">No performance data available. Please try again later.</p>
        </div>
      </Container>
    );
  }

  const data = performanceData;
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Safeguards in case some KPI fields are missing in certain environments (e.g. older backend deploy)
  const totalRevenue = Number(data?.kpis?.total_revenue ?? 0);
  const revenueChange = Number(data?.kpis?.revenue_change ?? 0);
  const occupancyRate = Number(data?.kpis?.occupancy_rate ?? 0);
  const occupancyChange = Number(data?.kpis?.occupancy_change ?? 0);
  const averageBookingValue = Number(data?.kpis?.average_booking_value ?? 0);
  const bookingValueChange = Number(data?.kpis?.booking_value_change ?? 0);
  const totalBookings = Number(data?.kpis?.total_bookings ?? 0);
  const bookingsChange = Number(data?.kpis?.bookings_change ?? 0);

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Performance & KPIs</h1>
          <p className="text-gray-600 mt-2">Monitor and manage asset performance metrics</p>
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
                {[country, city, propertyType, propertyStatus !== 'approved' ? 1 : 0, landlordId, useCustomDateRange ? 1 : 0].filter(Boolean).length}
              </span>
            )}
          </Button>
          {!useCustomDateRange && (
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              options={[
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 90 days' },
                { value: '365', label: 'Last year' },
              ]}
              className="w-48"
            />
          )}
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
                <Button
                  onClick={() => setShowFilters(false)}
                  variant="ghost"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Custom Date Range Toggle */}
              <div className="lg:col-span-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomDateRange}
                    onChange={(e) => {
                      setUseCustomDateRange(e.target.checked);
                      if (!e.target.checked) {
                        setStartDate('');
                        setEndDate('');
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Use Custom Date Range</span>
                </label>
              </div>

              {/* Custom Date Range */}
              {useCustomDateRange && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full"
                      min={startDate}
                    />
                  </div>
                </>
              )}

              {/* Country Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <Select
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setCity(''); // Reset city when country changes
                  }}
                  options={[
                    { value: '', label: 'All Countries' },
                    ...filterOptions.countries.map(c => ({ value: c, label: c }))
                  ]}
                  placeholder="All Countries"
                />
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <Select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  options={[
                    { value: '', label: 'All Cities' },
                    ...filterOptions.cities.map(c => ({ value: c, label: c }))
                  ]}
                  placeholder={country ? 'All Cities' : 'Select Country First'}
                  disabled={!country}
                />
              </div>

              {/* Property Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <Select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  options={filterOptions.propertyTypes}
                />
              </div>

              {/* Property Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Status</label>
                <Select
                  value={propertyStatus}
                  onChange={(e) => setPropertyStatus(e.target.value)}
                  options={filterOptions.propertyStatuses}
                />
              </div>

              {/* Landlord Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landlord</label>
                <Select
                  value={landlordId}
                  onChange={(e) => setLandlordId(e.target.value)}
                  options={filterOptions.landlords}
                  placeholder="All Landlords"
                />
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Pipeline Revenue */}
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Euro className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center gap-2">
                {revenueChange >= 0 ? (
                  <div className="flex items-center text-green-600">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    <span className="text-sm font-semibold">+{revenueChange.toFixed(1)}%</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                    <span className="text-sm font-semibold">{revenueChange.toFixed(1)}%</span>
                  </div>
                )}
                <button
                  onClick={() => openInfoModal(kpiExplanations.total_revenue.title, kpiExplanations.total_revenue.content)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Learn more about this KPI"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Pipeline Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalRevenue)}
            </p>
          </Card.Body>
        </Card>

        {/* Occupancy Rate */}
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-2">
                {occupancyChange >= 0 ? (
                  <div className="flex items-center text-green-600">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    <span className="text-sm font-semibold">+{occupancyChange.toFixed(1)}%</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                    <span className="text-sm font-semibold">{occupancyChange.toFixed(1)}%</span>
                  </div>
                )}
                <button
                  onClick={() => openInfoModal(kpiExplanations.occupancy_rate.title, kpiExplanations.occupancy_rate.content)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Learn more about this KPI"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Occupancy Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {occupancyRate.toFixed(1)}%
            </p>
          </Card.Body>
        </Card>

        {/* Average Booking Value */}
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex items-center gap-2">
                {bookingValueChange >= 0 ? (
                  <div className="flex items-center text-green-600">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    <span className="text-sm font-semibold">+{bookingValueChange.toFixed(1)}%</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                    <span className="text-sm font-semibold">{bookingValueChange.toFixed(1)}%</span>
                  </div>
                )}
                <button
                  onClick={() => openInfoModal(kpiExplanations.average_booking_value.title, kpiExplanations.average_booking_value.content)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Learn more about this KPI"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Avg Booking Value</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(averageBookingValue)}
            </p>
          </Card.Body>
        </Card>

        {/* Total Bookings */}
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex items-center gap-2">
                {bookingsChange >= 0 ? (
                  <div className="flex items-center text-green-600">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    <span className="text-sm font-semibold">+{bookingsChange.toFixed(1)}%</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                    <span className="text-sm font-semibold">{bookingsChange.toFixed(1)}%</span>
                  </div>
                )}
                <button
                  onClick={() => openInfoModal(kpiExplanations.total_bookings.title, kpiExplanations.total_bookings.content)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Learn more about this KPI"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalBookings}
            </p>
          </Card.Body>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue vs Expenses */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Revenue vs Expenses
              </div>
              <button
                onClick={() => openInfoModal(kpiExplanations.revenue_vs_expenses.title, kpiExplanations.revenue_vs_expenses.content)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Learn more about this chart"
              >
                <Info className="w-4 h-4" />
              </button>
            </Card.Title>
          </Card.Header>
          <Card.Body>
            {data.monthly_revenue && data.monthly_revenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.monthly_revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatNumber(value, { maximumFractionDigits: 0 })} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data available for this period
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Profit Trend */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Profit Trend
              </div>
              <button
                onClick={() => openInfoModal(kpiExplanations.profit_trend.title, kpiExplanations.profit_trend.content)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Learn more about this chart"
              >
                <Info className="w-4 h-4" />
              </button>
            </Card.Title>
          </Card.Header>
          <Card.Body>
            {data.monthly_revenue && data.monthly_revenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.monthly_revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatNumber(value, { maximumFractionDigits: 0 })} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Profit" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data available for this period
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Property Performance Table */}
      <Card className="mb-8">
        <Card.Header>
          <Card.Title className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Property Performance Breakdown
            </div>
            <button
              onClick={() => openInfoModal(kpiExplanations.property_performance.title, kpiExplanations.property_performance.content)}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Learn more about this table"
            >
              <Info className="w-4 h-4" />
            </button>
          </Card.Title>
        </Card.Header>
        <Card.Body>
          {data.property_performance && data.property_performance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occupancy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.property_performance.map((property, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {property.property}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {formatCurrency(property.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {property.bookings}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, property.occupancy)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{property.occupancy.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No property performance data available for this period
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Expense Categories */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-orange-600" />
              Expenses by Category
            </div>
            <button
              onClick={() => openInfoModal(kpiExplanations.expense_categories.title, kpiExplanations.expense_categories.content)}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Learn more about this chart"
            >
              <Info className="w-4 h-4" />
            </button>
          </Card.Title>
        </Card.Header>
        <Card.Body>
          {data.expense_categories && data.expense_categories.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Pie
                    data={data.expense_categories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.expense_categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="space-y-4">
                {data.expense_categories.map((category, index) => {
                  const total = data.expense_categories.reduce((sum, c) => sum + c.value, 0);
                  const percentage = ((category.value / total) * 100).toFixed(1);
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">{category.name}</span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(category.value)} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: category.color || COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No expense data available for this period
            </div>
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

export default AssetPerformance;
