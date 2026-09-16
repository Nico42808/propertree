/**
 * Admin Dashboard - Service-centric platform overview
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home, Users, Wrench, DollarSign, Clock, CheckCircle, XCircle, TrendingUp,
} from 'lucide-react';
import { Container } from '../../components/layout';
import { Card, Loading } from '../../components/common';
import { formatCurrency } from '../../utils/formatters';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        if (response.ok) setStats(await response.json());
      } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <Container className="py-8"><Loading /></Container>;
  }

  const services = stats?.services || stats?.bookings || {};
  const averageServiceValue = stats?.revenue?.average_service ?? stats?.revenue?.average_booking ?? 0;

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of Platform Statistics and Pending Actions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card><Card.Body><div className="flex items-center justify-between"><div>
          <p className="text-sm text-gray-600">Total Properties</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.properties?.total || 0}</p>
          <p className="text-sm text-green-600 mt-2">+{stats?.properties?.recent || 0} This Week</p>
        </div><div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><Home className="w-6 h-6 text-propertree-blue" /></div></div></Card.Body></Card>

        <Card><Card.Body><div className="flex items-center justify-between"><div>
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.users?.total || 0}</p>
          <p className="text-sm text-blue-600 mt-2">+{stats?.users?.recent || 0} This Week</p>
        </div><div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><Users className="w-6 h-6 text-blue-600" /></div></div></Card.Body></Card>

        <Card><Card.Body><div className="flex items-center justify-between"><div>
          <p className="text-sm text-gray-600">Total Services</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{services.total || 0}</p>
          <p className="text-sm text-purple-600 mt-2">+{services.recent || 0} This Week</p>
        </div><div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"><Wrench className="w-6 h-6 text-purple-600" /></div></div></Card.Body></Card>

        <Card><Card.Body><div className="flex items-center justify-between"><div>
          <p className="text-sm text-gray-600">Pipeline Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats?.revenue?.total || 0)}</p>
          <p className="text-sm text-green-600 mt-2">{formatCurrency(stats?.revenue?.monthly || 0)} This Month</p>
        </div><div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><DollarSign className="w-6 h-6 text-green-600" /></div></div></Card.Body></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <Card.Header><Card.Title>Property Status</Card.Title></Card.Header>
          <Card.Body><div className="space-y-4">
            <Link to="/admin/properties?status=pending_approval" className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
              <div className="flex items-center gap-3"><Clock className="w-8 h-8 text-yellow-600" /><div><p className="font-semibold text-gray-900">Pending Approval</p><p className="text-sm text-gray-600">Requires Your Review</p></div></div>
              <span className="text-2xl font-bold text-yellow-600">{stats?.properties?.pending || 0}</span>
            </Link>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3"><CheckCircle className="w-8 h-8 text-green-600" /><div><p className="font-semibold text-gray-900">Active</p><p className="text-sm text-gray-600">Active on Platform</p></div></div>
              <span className="text-2xl font-bold text-green-600">{stats?.properties?.active || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3"><XCircle className="w-8 h-8 text-red-600" /><div><p className="font-semibold text-gray-900">Rejected</p><p className="text-sm text-gray-600">Not Approved</p></div></div>
              <span className="text-2xl font-bold text-red-600">{stats?.properties?.rejected || 0}</span>
            </div>
          </div></Card.Body>
        </Card>

        <Card>
          <Card.Header><Card.Title>Service Overview</Card.Title></Card.Header>
          <Card.Body><div className="space-y-5">
            <div className="flex justify-between"><span className="text-gray-600">Pending Services</span><strong>{services.pending || 0}</strong></div>
            <div className="flex justify-between"><span className="text-gray-600">Services in Progress</span><strong>{services.in_progress || services.confirmed || 0}</strong></div>
            <div className="flex justify-between"><span className="text-gray-600">Completed Services</span><strong>{services.completed || 0}</strong></div>
            <div className="pt-4 border-t flex justify-between items-center"><span className="text-gray-600">Average Service Value</span><strong className="text-lg">{formatCurrency(averageServiceValue)}</strong></div>
          </div></Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header><Card.Title>Quick Actions</Card.Title></Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link to="/admin/properties?status=pending_approval" className="p-6 border-2 border-yellow-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-all text-center"><Clock className="w-10 h-10 text-yellow-600 mx-auto mb-3" /><h3 className="font-semibold">Review Properties</h3></Link>
            <Link to="/admin/users" className="p-6 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-center"><Users className="w-10 h-10 text-blue-600 mx-auto mb-3" /><h3 className="font-semibold">Manage Users</h3></Link>
            <Link to="/admin/service-bookings" className="p-6 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-center"><Wrench className="w-10 h-10 text-purple-600 mx-auto mb-3" /><h3 className="font-semibold">Manage Services</h3></Link>
            <Link to="/admin/analytics" className="p-6 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all text-center"><TrendingUp className="w-10 h-10 text-green-600 mx-auto mb-3" /><h3 className="font-semibold">View Analytics</h3></Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Dashboard;
