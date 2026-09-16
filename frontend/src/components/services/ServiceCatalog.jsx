/**
 * ServiceCatalog component - Display all available services
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import {
  Settings,
  Sparkles,
  Home,
  Zap,
  Leaf,
  Wrench,
  Camera,
} from 'lucide-react';
import { getServiceCatalog } from '../../services/serviceService';
import ServiceCard from './ServiceCard';

const SERVICE_SHORTCUTS = [
  { name: 'Property Management Abo', label: 'Property Management Abo', icon: Settings },
  { name: 'Arrival Preparation', label: 'Arrival Preparation', icon: Sparkles },
  { name: 'Fridge Refill', label: 'Fridge Refill', icon: Home },
  { name: '24/7 Emergency Service', label: '24/7 Emergency Service', icon: Zap },
  { name: 'Housekeeping', label: 'Housekeeping', icon: Leaf },
  { name: 'Handyman Service', label: 'Handyman Service', icon: Wrench },
  { name: 'Property Photography & Drone Shots', label: 'Property Photography & Drone Shots', icon: Camera },
];

const ServiceCatalog = ({ onBookService }) => {
  const [selectedShortcut, setSelectedShortcut] = useState('all');

  const {
    data: services = [],
    isLoading: servicesLoading,
    error: servicesError,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ['service-catalog', 'all'],
    queryFn: () => getServiceCatalog(),
    retry: 2,
    staleTime: 30000,
  });

  if (servicesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-propertree-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Services...</p>
        </div>
      </div>
    );
  }

  if (servicesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-800 font-medium">Failed To Load Services</p>
        <p className="text-red-600 text-sm mt-2">
          {servicesError.response?.data?.detail || servicesError.message || 'Unknown error occurred'}
        </p>
        <button
          onClick={() => refetchServices()}
          className="mt-4 px-4 py-2 bg-propertree-green text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const servicesList = Array.isArray(services) ? services : [];
  const filteredServices =
    selectedShortcut === 'all'
      ? servicesList
      : servicesList.filter(
          (service) => service.name?.toLowerCase() === selectedShortcut.toLowerCase()
        );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedShortcut('all')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
            selectedShortcut === 'all'
              ? 'bg-propertree-green text-white shadow-card'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Services
        </button>

        {SERVICE_SHORTCUTS.map(({ name, label, icon: Icon }) => (
          <button
            key={name}
            onClick={() => setSelectedShortcut(name)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              selectedShortcut === name
                ? 'bg-propertree-green text-white shadow-card'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {filteredServices.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-600 text-lg mb-2">No Services Available</p>
          <button
            onClick={() => {
              setSelectedShortcut('all');
              refetchServices();
            }}
            className="mt-4 px-4 py-2 bg-propertree-green text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Show All Services
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} onBook={onBookService} />
          ))}
        </div>
      )}
    </div>
  );
};

ServiceCatalog.propTypes = {
  onBookService: PropTypes.func.isRequired,
};

export default ServiceCatalog;
