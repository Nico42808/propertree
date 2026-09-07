/**
 * Landlord Dashboard - Main dashboard for property owners
 * Comprehensive view of property performance, income vs expenses, occupancy rates, and KPIs
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Container } from '../../components/layout';
import { KPICard, DonutChart, BarChart, LineChart } from '../../components/dashboard';
import { Button, Loading, Badge } from '../../components/common';
import { 
  Home, 
  Euro, 
  TrendingUp, 
  Calendar,
  Wrench,
  Users,
  ArrowRight,
  TrendingDown,
  PieChart,
  BarChart3,
  Activity,
  Settings,
  Plus,
  Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import { getServiceBookings } from '../../services/serviceService';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // Default: last 30 days
  const [recentServiceBookings, setRecentServiceBookings] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentServiceBookings();
  }, [dateRange]);

  const fetchRecentServiceBookings = async () => {
    try {
      const bookings = await getServiceBookings();
      const list = Array.isArray(bookings) ? bookings : [];
      // Most recently updated first, show a handful on the dashboard
      const sorted = [...list].sort(
        (a, b) => new Date(b.updated_at || b.reported_at) - new Date(a.updated_at || a.reported_at)
      );
      setRecentServiceBookings(sorted.slice(0, 4));
    } catch (error) {
      // Non-critical widget — fail quietly, the full list is still on the Services page
      console.error('Failed to load recent service bookings', error);
    }
  };

  const fetchDashboardData = async (retryCount = 0) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/analytics/landlord/dashboard/?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else if (response.status === 401 && retryCount === 0) {
        // Token expired - try to refresh
        console.log('Token expired, attempting to refresh...');
        try {
          await authService.refreshToken();
          // Retry the request with new token
          return fetchDashboardData(1);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          toast.error(t('dashboard.sessionExpired'));
          navigate('/login');
          return;
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Dashboard API Error:', response.status, errorData);
        toast.error(`${t('dashboard.failedToLoadDashboard')}: ${errorData.error || 'Unknown error'}`);
        // If API fails, set empty data structure with zeros
        setDashboardData({
          properties: { total: 0, approved: 0, booked: 0, pending: 0, draft: 0 },
          occupancy_rate: 0,
          rental_income: 0,
          pending_bookings: { pending_count: 0, pending_value: 0 },
          maintenance_costs: { total_cost: 0, count: 0, average_cost: 0 },
          property_expenses: { total_expenses: 0, count: 0, by_category: [] },
          noi: { noi: 0, revenue: 0, total_expenses: 0, maintenance_costs: 0, property_expenses: 0 },
          property_performance: [],
          average_booking: { average_nights: 0, total_bookings: 0 },
          monthly_cash_flow: [],
          annual_expenses: { year: new Date().getFullYear(), total_expenses: 0, by_category: [], maintenance_costs: 0, property_expenses: 0 }
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error(t('dashboard.networkError'));
      // Set empty data structure with zeros on error
      setDashboardData({
        properties: { total: 0, approved: 0, booked: 0, pending: 0, draft: 0 },
        occupancy_rate: 0,
        rental_income: 0,
        pending_bookings: { pending_count: 0, pending_value: 0 },
        maintenance_costs: { total_cost: 0, count: 0, average_cost: 0 },
        property_expenses: { total_expenses: 0, count: 0, by_category: [] },
        noi: { noi: 0, revenue: 0, total_expenses: 0, maintenance_costs: 0, property_expenses: 0 },
        property_performance: [],
        average_booking: { average_nights: 0, total_bookings: 0 },
        monthly_cash_flow: [],
        annual_expenses: { year: new Date().getFullYear(), total_expenses: 0, by_category: [], maintenance_costs: 0, property_expenses: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-8">
        <Loading />
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container className="py-8">
        <Loading />
      </Container>
    );
  }

  // Prepare chart data
  const incomeVsExpensesData = [
    { name: t('dashboard.income'), value: dashboardData.noi.revenue, category: 'income' },
    { 
      name: t('dashboard.expenses'), 
      value: dashboardData.noi.total_expenses, 
      category: 'expenses' 
    }
  ];

  // Enhanced expense breakdown with all categories
  // Note: property_expenses.by_category now includes maintenance costs from the backend
  const expenseCategories = dashboardData.property_expenses?.by_category || [];
  const expenseBreakdownData = expenseCategories.map(cat => ({
    name: cat.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: cat.amount,
    category: cat.category
  })).filter(item => item.value > 0);
  
  // If no expenses at all, show a placeholder
  if (expenseBreakdownData.length === 0 && dashboardData.noi.maintenance_costs > 0) {
    expenseBreakdownData.push({
      name: 'Maintenance',
      value: dashboardData.noi.maintenance_costs,
      category: 'maintenance'
    });
  }

  // Property performance for bar chart
  const propertyPerformanceChart = dashboardData.property_performance
    .slice(0, 5)
    .map(prop => ({
      name: prop.property_title.length > 15 ? prop.property_title.substring(0, 15) + '...' : prop.property_title,
      Income: prop.total_income,
      Expenses: prop.total_expenses,
      'Net Income': prop.net_income
    }));

  // Monthly cash flow data
  const cashFlowData = dashboardData.monthly_cash_flow || [];

  // Calculate ROI percentage
  const roi = dashboardData.noi.revenue > 0 
    ? ((dashboardData.noi.noi / dashboardData.noi.revenue) * 100).toFixed(1)
    : 0;

  // Annual expenses breakdown
  const annualExpenseCategories = dashboardData.annual_expenses?.by_category || [];

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('dashboard.propertyDashboard')}</h1>
          <p className="text-gray-600">
            {t('dashboard.overview')}
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-propertree-green bg-white"
          >
            <option value="7">{t('dashboard.last7Days')}</option>
            <option value="30">{t('dashboard.last30Days')}</option>
            <option value="90">{t('dashboard.last90Days')}</option>
            <option value="365">{t('dashboard.lastYear')}</option>
          </select>
          <Button
            onClick={() => navigate('/landlord/expenses')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {t('dashboard.manageExpenses')}
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title={t('dashboard.totalProperties')}
          value={dashboardData.properties.total}
          icon={Home}
          subtitle={`${dashboardData.properties.approved} ${t('dashboard.approved')}`}
        />
        <KPICard
          title={t('dashboard.netOperatingIncome')}
          value={formatCurrency(dashboardData.noi.noi)}
          icon={Euro}
          trend={dashboardData.noi.noi > 0 ? 'up' : 'down'}
          trendValue={`${roi}% ROI`}
          subtitle={t('dashboard.revenueMinusExpenses')}
        />
        <KPICard
          title={t('dashboard.occupancyRate')}
          value={`${dashboardData.occupancy_rate.toFixed(1)}%`}
          icon={Calendar}
          trend={dashboardData.occupancy_rate >= 70 ? 'up' : dashboardData.occupancy_rate >= 50 ? 'neutral' : 'down'}
          subtitle={t('dashboard.propertyUtilization')}
        />
        <KPICard
          title={t('dashboard.totalIncome')}
          value={formatCurrency(dashboardData.rental_income)}
          icon={TrendingUp}
          subtitle={t('dashboard.fromConfirmedBookings')}
        />
      </div>

      {/* Income vs Expenses Section - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DonutChart
          data={incomeVsExpensesData}
          title={t('dashboard.incomeVsExpenses')}
          centerLabel={t('dashboard.netIncome')}
          centerValue={formatCurrency(dashboardData.noi.noi)}
          height={350}
        />
        <DonutChart
          data={expenseBreakdownData.length > 0 ? expenseBreakdownData : [{ name: t('dashboard.noExpensesRecorded'), value: 1, category: 'other' }]}
          title={t('dashboard.expensesByCategory')}
          centerLabel={t('dashboard.totalExpenses')}
          centerValue={formatCurrency(dashboardData.noi.total_expenses)}
          height={350}
        />
      </div>

      {/* Cash Flow Chart - NEW */}
      {cashFlowData.length > 0 && (
        <div className="mb-8">
          <LineChart
            data={cashFlowData}
            title={t('dashboard.monthlyCashFlow')}
            xAxisKey="month_short"
            lines={[
              { dataKey: 'income', stroke: '#10B981', name: t('dashboard.income') },
              { dataKey: 'expenses', stroke: '#EF4444', name: t('dashboard.expenses') },
              { dataKey: 'net_cash_flow', stroke: '#3B82F6', name: t('dashboard.netCashFlow') }
            ]}
            height={350}
            showArea={false}
          />
        </div>
      )}

      {/* Property Performance Bar Chart */}
      {dashboardData.property_performance.length > 0 && (
        <div className="mb-8">
          <BarChart
            data={propertyPerformanceChart}
            title={t('dashboard.top5PropertiesPerformance')}
            xAxisKey="name"
            bars={[
              { dataKey: 'Income', fill: '#10B981', name: t('dashboard.income') },
              { dataKey: 'Expenses', fill: '#EF4444', name: t('dashboard.expenses') },
              { dataKey: 'Net Income', fill: '#3B82F6', name: t('dashboard.netIncome') }
            ]}
            height={350}
          />
        </div>
      )}

      {/* Additional Metrics Row - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.maintenance')}</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {formatCurrency(dashboardData.maintenance_costs.total_cost)}
          </p>
          <p className="text-sm text-gray-600">
            {dashboardData.maintenance_costs.count} {t('dashboard.requestsResolved')}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {t('dashboard.avg')}: {formatCurrency(dashboardData.maintenance_costs.average_cost)}
          </p>
          <Button
            onClick={() => navigate('/landlord/services')}
            variant="ghost"
            className="mt-4 w-full text-sm"
          >
            {t('dashboard.bookServices')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.bookings')}</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {dashboardData.average_booking.total_bookings}
          </p>
          <p className="text-sm text-gray-600">
            {t('dashboard.totalBookings')}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {t('dashboard.avg')}: {dashboardData.average_booking.average_nights} {t('dashboard.nights')}
          </p>
          <Button
            onClick={() => navigate('/landlord/bookings')}
            variant="ghost"
            className="mt-4 w-full text-sm"
          >
            {t('dashboard.viewAll')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.pending')}</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {dashboardData.pending_bookings.pending_count}
          </p>
          <p className="text-sm text-gray-600">
            {t('dashboard.awaitingConfirmation')}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {t('dashboard.value')}: {formatCurrency(dashboardData.pending_bookings.pending_value)}
          </p>
          <Button
            onClick={() => navigate('/landlord/bookings')}
            variant="ghost"
            className="mt-4 w-full text-sm"
          >
            {t('dashboard.review')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Annual Expenses & Maintenance Section - NEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Annual Expenses Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.annualExpenses')} {dashboardData.annual_expenses?.year}</h3>
            <Button
              onClick={() => navigate('/landlord/expenses')}
              variant="ghost"
              className="text-sm"
            >
              {t('dashboard.viewDetails')}
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">{t('dashboard.annualTotal')}</span>
              <span className="text-xl font-bold text-red-600">
                {formatCurrency(dashboardData.annual_expenses?.total_expenses || 0)}
              </span>
            </div>
            {annualExpenseCategories.length > 0 ? (
              <div className="space-y-2">
                {annualExpenseCategories.slice(0, 5).map((cat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600 capitalize">
                      {cat.category.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                {t('dashboard.noExpensesRecorded')}
              </p>
            )}
          </div>
        </div>

        {/* Maintenance Expenses Detail */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.maintenanceCosts')}</h3>
            <Button
              onClick={() => navigate('/landlord/services')}
              variant="ghost"
              className="text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('dashboard.bookService')}
            </Button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">{t('dashboard.total')}</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrency(dashboardData.maintenance_costs.total_cost)}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">{t('dashboard.requests')}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData.maintenance_costs.count}
                </p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">{t('dashboard.averageCostPerRequest')}</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(dashboardData.maintenance_costs.average_cost)}
              </p>
            </div>
            <Button
              onClick={() => navigate('/landlord/services')}
              variant="primary"
              className="w-full"
            >
              {t('dashboard.viewServiceCatalog')}
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Service Requests - status tracker */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Service Requests</h3>
          <Button
            onClick={() => navigate('/landlord/services')}
            variant="ghost"
            className="text-sm"
          >
            View all
          </Button>
        </div>

        {recentServiceBookings.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No service requests yet — book one from the Services tab.
          </p>
        ) : (
          <div className="space-y-3">
            {recentServiceBookings.map((booking) => {
              const statusMap = {
                open: { variant: 'warning', label: 'Submitted' },
                assigned: { variant: 'info', label: 'Confirmed' },
                in_progress: { variant: 'primary', label: 'In Progress' },
                resolved: { variant: 'success', label: 'Done' },
                cancelled: { variant: 'danger', label: 'Cancelled' },
              };
              const cfg = statusMap[booking.status] || statusMap.open;

              return (
                <button
                  key={booking.id}
                  onClick={() => navigate('/landlord/services')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{booking.title}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {booking.rental_property?.title || 'Property'}
                    </p>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Property Performance Table - Enhanced */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.propertyPerformance')}</h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/landlord/properties')}
              variant="ghost"
              className="flex items-center gap-2 text-propertree-green"
            >
              {t('dashboard.viewAll')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {dashboardData.property_performance.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('dashboard.noPropertiesYet')}</h3>
            <p className="text-gray-600 mb-4">{t('dashboard.startByAdding')}</p>
            <Button
              onClick={() => navigate('/landlord/onboarding')}
              variant="primary"
            >
              {t('dashboard.addYourFirstProperty')}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.property')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.location')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.status')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.income')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.expenses')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.netIncome')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.bookings')}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.property_performance.map((property) => (
                  <tr key={property.property_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {property.property_title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{property.city}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        property.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : property.status === 'pending_approval'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {property.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(property.total_income)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-red-600">
                        {formatCurrency(property.total_expenses)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-bold ${
                        property.net_income >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(property.net_income)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                        {property.booking_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Button
                        onClick={() => navigate(`/landlord/properties/${property.property_id}/edit`)}
                        variant="ghost"
                        className="text-sm"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={() => navigate('/landlord/onboarding')}
          variant="primary"
          className="py-4 flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          {t('dashboard.addNewProperty')}
        </Button>
        <Button
          onClick={() => navigate('/landlord/bookings')}
          variant="outline"
          className="py-4 flex items-center justify-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          {t('dashboard.manageBookings')}
        </Button>
        <Button
          onClick={() => navigate('/landlord/services')}
          variant="outline"
          className="py-4 flex items-center justify-center gap-2"
        >
          <Settings className="w-5 h-5" />
          {t('dashboard.bookServices')}
        </Button>
      </div>
    </Container>
  );
};

export default Dashboard;
