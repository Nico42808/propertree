/**
 * Asset Performance - Service-centric property activity and value metrics
 */
import React, { useEffect, useState } from 'react';
import { Container } from '../../components/layout';
import { Card, Loading, Button, Select, Input } from '../../components/common';
import {
  TrendingUp, DollarSign, Wrench, Activity, Home, Filter, X, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';

const COLORS = ['#6B8E6F', '#7B95A8', '#A58F73', '#8B7E9B', '#9A8878', '#5F7D73', '#89929B'];

const titleCase = (value = '') => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const AssetPerformance = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  const [showFilters, setShowFilters] = useState(false);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [propertyStatus, setPropertyStatus] = useState('approved');
  const [landlordId, setLandlordId] = useState('');
  const [useCustomDateRange, setUseCustomDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterOptions, setFilterOptions] = useState({ countries: [], cities: [], landlords: [] });

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
        console.error('Error loading filters:', error);
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
          const responseData = await response.json();
          setFilterOptions((prev) => ({ ...prev, cities: responseData.cities || [] }));
        }
      } catch (error) {
        console.error('Error loading cities:', error);
      }
    };
    fetchCities();
  }, [country]);

  useEffect(() => {
    const fetchPerformance = async () => {
      setLoading(true);
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
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
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        if (!response.ok) throw new Error('Failed to load performance data');
        setData(await response.json());
      } catch (error) {
        console.error(error);
        toast.error('Error Loading Performance Data');
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, [timeRange, country, city, propertyType, propertyStatus, landlordId, startDate, endDate, useCustomDateRange]);

  const clearFilters = () => {
    setCountry(''); setCity(''); setPropertyType(''); setPropertyStatus('approved'); setLandlordId('');
    setStartDate(''); setEndDate(''); setUseCustomDateRange(false);
  };

  if (loading) return <Container className="py-8"><Loading /></Container>;
  if (!data) return <Container className="py-8"><p className="text-gray-600">No Performance Data Available</p></Container>;

  const kpis = data.kpis || {};
  const pipelineRevenue = Number(kpis.total_revenue || 0);
  const activityRate = Number(kpis.service_activity_rate ?? kpis.occupancy_rate ?? 0);
  const averageServiceValue = Number(kpis.average_service_value ?? kpis.average_booking_value ?? 0);
  const totalServices = Number(kpis.total_services ?? kpis.total_bookings ?? 0);
  const monthlyServices = data.monthly_services || data.monthly_revenue || [];
  const categories = data.service_categories || [];
  const properties = data.property_performance || [];
  const hasFilters = Boolean(country || city || propertyType || propertyStatus !== 'approved' || landlordId || useCustomDateRange);

  return (
    <Container className="py-8">
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Performance & Service KPIs</h1>
          <p className="text-gray-600 mt-2">Monitor Service Activity, Service Value, and Property Performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowFilters(!showFilters)} variant={showFilters ? 'primary' : 'outline'} leftIcon={<Filter className="w-4 h-4" />}>Filters</Button>
          {!useCustomDateRange && <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} options={[{ value: '7', label: 'Last 7 Days' }, { value: '30', label: 'Last 30 Days' }, { value: '90', label: 'Last 90 Days' }, { value: '365', label: 'Last Year' }]} className="w-48" />}
        </div>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <Card.Header><Card.Title className="flex justify-between items-center"><span>Performance Filters</span>{hasFilters && <Button size="sm" variant="ghost" onClick={clearFilters} leftIcon={<X className="w-4 h-4" />}>Clear All</Button>}</Card.Title></Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <label className="flex items-center gap-2 lg:col-span-4"><input type="checkbox" checked={useCustomDateRange} onChange={(e) => setUseCustomDateRange(e.target.checked)} /><span className="text-sm font-medium">Use Custom Date Range</span></label>
              {useCustomDateRange && <><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /><Input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} /></>}
              <Select value={country} onChange={(e) => { setCountry(e.target.value); setCity(''); }} options={[{ value: '', label: 'All Countries' }, ...filterOptions.countries.map((item) => ({ value: item, label: item }))]} />
              <Select value={city} onChange={(e) => setCity(e.target.value)} options={[{ value: '', label: 'All Cities' }, ...filterOptions.cities.map((item) => ({ value: item, label: item }))]} />
              <Select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} options={[{ value: '', label: 'All Property Types' }, { value: 'apartment', label: 'Apartment' }, { value: 'house', label: 'House' }, { value: 'condo', label: 'Condo' }, { value: 'villa', label: 'Villa' }, { value: 'studio', label: 'Studio' }, { value: 'townhouse', label: 'Townhouse' }, { value: 'other', label: 'Other' }]} />
              <Select value={propertyStatus} onChange={(e) => setPropertyStatus(e.target.value)} options={[{ value: '', label: 'All Statuses' }, { value: 'approved', label: 'Approved' }, { value: 'draft', label: 'Draft' }, { value: 'pending_approval', label: 'Pending Approval' }, { value: 'rejected', label: 'Rejected' }]} />
              <Select value={landlordId} onChange={(e) => setLandlordId(e.target.value)} options={filterOptions.landlords.length ? filterOptions.landlords : [{ value: '', label: 'All Landlords' }]} />
            </div>
          </Card.Body>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card><Card.Body><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Pipeline Revenue</p><p className="text-2xl font-bold mt-1">{formatCurrency(pipelineRevenue)}</p><p className="text-xs text-gray-500 mt-2">Service Revenue in Selected Period</p></div><DollarSign className="w-10 h-10 text-green-600" /></div></Card.Body></Card>
        <Card><Card.Body><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Service Activity Rate</p><p className="text-2xl font-bold mt-1">{activityRate.toFixed(1)}%</p><p className="text-xs text-gray-500 mt-2">Properties With Service Activity</p></div><Activity className="w-10 h-10 text-blue-600" /></div></Card.Body></Card>
        <Card><Card.Body><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Average Service Value</p><p className="text-2xl font-bold mt-1">{formatCurrency(averageServiceValue)}</p><p className="text-xs text-gray-500 mt-2">Average CAD Value per Service</p></div><TrendingUp className="w-10 h-10 text-purple-600" /></div></Card.Body></Card>
        <Card><Card.Body><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Services</p><p className="text-2xl font-bold mt-1">{totalServices}</p><p className="text-xs text-gray-500 mt-2">Services in Selected Period</p></div><Wrench className="w-10 h-10 text-yellow-600" /></div></Card.Body></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <Card.Header><Card.Title className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Monthly Service Activity</Card.Title></Card.Header>
          <Card.Body>{monthlyServices.length ? <ResponsiveContainer width="100%" height={300}><LineChart data={monthlyServices}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Line type="monotone" dataKey="services" name="Services" stroke="#6B8E6F" strokeWidth={3} /></LineChart></ResponsiveContainer> : <p className="text-center text-gray-500 py-16">No Monthly Service Data Available</p>}</Card.Body>
        </Card>
        <Card>
          <Card.Header><Card.Title>Service Categories</Card.Title></Card.Header>
          <Card.Body>{categories.length ? <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={categories} dataKey="count" nameKey="category" outerRadius={95} label>{categories.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer> : <p className="text-center text-gray-500 py-16">No Service Category Data Available</p>}</Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header><Card.Title className="flex items-center gap-2"><Home className="w-5 h-5" />Top Performing Properties</Card.Title></Card.Header>
        <Card.Body>
          {properties.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-gray-600"><th className="py-3">Property</th><th>City</th><th>Property Type</th><th>Service Activity</th><th>Service Revenue</th></tr></thead><tbody>{properties.map((property, index) => <tr key={property.id || index} className="border-b last:border-0"><td className="py-4 font-medium">{property.title}</td><td>{property.city}</td><td>{titleCase(property.property_type)}</td><td>{property.services ?? property.bookings ?? property.activity ?? 0}</td><td>{formatCurrency(property.revenue || 0)}</td></tr>)}</tbody></table></div> : <p className="text-center text-gray-500 py-10">No Property Service Activity Available</p>}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AssetPerformance;
