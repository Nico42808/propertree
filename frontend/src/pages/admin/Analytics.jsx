/**
 * Admin Analytics - Service-centric portfolio insights
 */
import React, { useEffect, useState } from 'react';
import {
  Home, Wrench, DollarSign, Activity, BarChart3, MapPin, TrendingUp, Filter, X,
} from 'lucide-react';
import { Container } from '../../components/layout';
import { Card, Loading, Select, Button } from '../../components/common';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from 'recharts';

const COLORS = ['#6B8E6F', '#7B95A8', '#A58F73', '#8B7E9B', '#9A8878', '#5F7D73', '#89929B', '#B29C83'];

const titleCase = (value = '') => value
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [propertyStatus, setPropertyStatus] = useState('');
  const [landlordId, setLandlordId] = useState('');
  const [filterOptions, setFilterOptions] = useState({ countries: [], cities: [], landlords: [] });

  const propertyTypes = [
    { value: '', label: 'All Types' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'condo', label: 'Condo' },
    { value: 'villa', label: 'Villa' },
    { value: 'studio', label: 'Studio' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'other', label: 'Other' },
  ];

  const propertyStatuses = [
    { value: '', label: 'All Statuses' },
    { value: 'approved', label: 'Approved' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'rejected', label: 'Rejected' },
  ];

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        const headers = { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };
        const [propertyResponse, userResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/properties/filter-options/`, { headers }),
          fetch(`${API_BASE_URL}/admin/users/?role=landlord`, { headers }),
        ]);
        const propertyData = propertyResponse.ok ? await propertyResponse.json() : {};
        const userData = userResponse.ok ? await userResponse.json() : {};
        setFilterOptions({
          countries: propertyData.countries || [],
          cities: propertyData.cities || Object.values(propertyData.cities_by_country || {}).flat(),
          landlords: [{ value: '', label: 'All Landlords' }, ...(userData.results || []).map((user) => ({ value: user.id, label: user.full_name || user.email }))],
        });
      } catch (error) {
        console.error('Error loading analytics filters:', error);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    if (!country) return;
    const fetchCities = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        const response = await fetch(`${API_BASE_URL}/admin/properties/filter-options/?country=${encodeURIComponent(country)}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        if (response.ok) {
          const data = await response.json();
          setFilterOptions((prev) => ({ ...prev, cities: data.cities || [] }));
        }
      } catch (error) {
        console.error('Error loading cities:', error);
      }
    };
    fetchCities();
  }, [country]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        const params = new URLSearchParams();
        if (country) params.append('country', country);
        if (city) params.append('city', city);
        if (propertyType) params.append('property_type', propertyType);
        if (propertyStatus) params.append('property_status', propertyStatus);
        if (landlordId) params.append('landlord_id', landlordId);
        const suffix = params.toString() ? `?${params.toString()}` : '';
        const response = await fetch(`${API_BASE_URL}/admin/dashboard/analytics/${suffix}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        if (!response.ok) throw new Error('Failed to load analytics');
        setAnalytics(await response.json());
      } catch (error) {
        console.error(error);
        toast.error('Error Loading Analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [country, city, propertyType, propertyStatus, landlordId]);

  const clearFilters = () => {
    setCountry('');
    setCity('');
    setPropertyType('');
    setPropertyStatus('');
    setLandlordId('');
  };

  if (loading) return <Container className="py-8"><Loading /></Container>;

  const summary = analytics?.summary || {};
  const categoryData = analytics?.services_by_category || [];
  const cityData = analytics?.activity_by_city || analytics?.by_city || [];
  const averageByType = analytics?.avg_service_by_type || analytics?.avg_price_by_type || [];
  const topProperties = analytics?.top_properties || [];
  const monthlyTrend = analytics?.monthly_trend || [];
  const hasFilters = Boolean(country || city || propertyType || propertyStatus || landlordId);

  return (
    <Container className="py-8">
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-600 mt-2">Service Activity, Property Performance, and Portfolio Insights Across Cities and Property Types</p>
        </div>
        <Button onClick={() => setShowFilters(!showFilters)} variant={showFilters ? 'primary' : 'outline'} leftIcon={<Filter className="w-4 h-4" />}>Filters</Button>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <Card.Header><Card.Title className="flex items-center justify-between"><span>Analytics Filters</span>{hasFilters && <Button size="sm" variant="ghost" onClick={clearFilters} leftIcon={<X className="w-4 h-4" />}>Clear All</Button>}</Card.Title></Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Select value={country} onChange={(e) => { setCountry(e.target.value); setCity(''); }} options={[{ value: '', label: 'All Countries' }, ...filterOptions.countries.map((item) => ({ value: item, label: item }))]} />
              <Select value={city} onChange={(e) => setCity(e.target.value)} options={[{ value: '', label: 'All Cities' }, ...filterOptions.cities.map((item) => ({ value: item, label: item }))]} />
              <Select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} options={propertyTypes} />
              <Select value={propertyStatus} onChange={(e) => setPropertyStatus(e.target.value)} options={propertyStatuses} />
              <Select value={landlordId} onChange={(e) => setLandlordId(e.target.value)} options={filterOptions.landlords.length ? filterOptions.landlords : [{ value: '', label: 'All Landlords' }]} />
            </div>
          </Card.Body>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card><Card.Body><div className="flex justify-between items-center"><div><p className="text-sm text-gray-600">Total Properties</p><p className="text-2xl font-bold mt-1">{summary.total_properties || 0}</p></div><Home className="w-9 h-9 text-blue-600" /></div></Card.Body></Card>
        <Card><Card.Body><div className="flex justify-between items-center"><div><p className="text-sm text-gray-600">Active Properties</p><p className="text-2xl font-bold mt-1">{summary.active_properties || 0}</p></div><Activity className="w-9 h-9 text-green-600" /></div></Card.Body></Card>
        <Card><Card.Body><div className="flex justify-between items-center"><div><p className="text-sm text-gray-600">Pipeline Revenue</p><p className="text-2xl font-bold mt-1">{formatCurrency(summary.total_revenue || 0)}</p></div><DollarSign className="w-9 h-9 text-purple-600" /></div></Card.Body></Card>
        <Card><Card.Body><div className="flex justify-between items-center"><div><p className="text-sm text-gray-600">Total Services</p><p className="text-2xl font-bold mt-1">{summary.total_services ?? summary.total_bookings ?? 0}</p></div><Wrench className="w-9 h-9 text-yellow-600" /></div></Card.Body></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <Card.Header><Card.Title className="flex items-center gap-2"><Wrench className="w-5 h-5" />Services by Category</Card.Title></Card.Header>
          <Card.Body>
            {categoryData.length ? <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={categoryData} dataKey="count" nameKey="category" outerRadius={95} label>{categoryData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer> : <p className="text-gray-500 text-center py-16">No Service Data Available</p>}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header><Card.Title className="flex items-center gap-2"><MapPin className="w-5 h-5" />Service Activity by City</Card.Title></Card.Header>
          <Card.Body>
            {cityData.length ? <ResponsiveContainer width="100%" height={300}><BarChart data={cityData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="city" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="service_count" name="Services" fill="#6B8E6F" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="text-gray-500 text-center py-16">No City Activity Available</p>}
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <Card.Header><Card.Title className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Average Price for Services by Property Type</Card.Title></Card.Header>
          <Card.Body>
            {averageByType.length ? <ResponsiveContainer width="100%" height={300}><BarChart data={averageByType.map((item) => ({ ...item, label: titleCase(item.property_type) }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis tickFormatter={(value) => `$${value}`} /><Tooltip formatter={(value) => [formatCurrency(value), 'Average Service Value']} /><Bar dataKey="avg_service_value" name="CAD per Service" fill="#7B95A8" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="text-gray-500 text-center py-16">No Service Pricing Data Available</p>}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header><Card.Title className="flex items-center gap-2"><TrendingUp className="w-5 h-5" />Monthly Service Activity</Card.Title></Card.Header>
          <Card.Body>
            {monthlyTrend.length ? <ResponsiveContainer width="100%" height={300}><LineChart data={monthlyTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Line type="monotone" dataKey="services" name="Services" stroke="#6B8E6F" strokeWidth={3} /></LineChart></ResponsiveContainer> : <p className="text-gray-500 text-center py-16">No Monthly Activity Available</p>}
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header><Card.Title>Top Performing Properties</Card.Title></Card.Header>
        <Card.Body>
          {topProperties.length ? (
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-gray-600"><th className="py-3">Property</th><th>City</th><th>Property Type</th><th>Services</th><th>Service Revenue</th></tr></thead><tbody>{topProperties.map((property, index) => <tr key={`${property.title}-${index}`} className="border-b last:border-0"><td className="py-4 font-medium">{property.title}</td><td>{property.city}</td><td>{titleCase(property.type)}</td><td>{property.services ?? property.bookings ?? 0}</td><td>{formatCurrency(property.revenue || 0)}</td></tr>)}</tbody></table></div>
          ) : <p className="text-gray-500 text-center py-10">No Property Service Activity Available</p>}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Analytics;
