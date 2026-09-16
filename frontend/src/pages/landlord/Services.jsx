/**
 * Services page - Landlord service booking interface
 */
import React, { useState } from 'react';
import { Container } from '../../components/layout';
import { useQueryClient } from '@tanstack/react-query';
import ServiceCatalog from '../../components/services/ServiceCatalog';
import MyServices from '../../components/services/MyServices';
import ServiceNotifications from '../../components/services/ServiceNotifications';
import BookServiceModal from '../../components/services/BookServiceModal';

const Services = () => {
  const [activeTab, setActiveTab] = useState('catalog');
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleBookService = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleBookingSuccess = () => {
    queryClient.invalidateQueries(['my-service-bookings']);
    queryClient.invalidateQueries(['service-bookings-stats']);
    setActiveTab('my-services');
  };

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-propertree-dark">Property Services</h1>
            <p className="text-gray-600 mt-2">
              Book Professional Services for Your Properties and Track Service Activity
            </p>
          </div>
          <ServiceNotifications onOpenMyServices={() => setActiveTab('my-services')} />
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'catalog'
                  ? 'border-propertree-green text-propertree-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Service Catalog
            </button>
            <button
              onClick={() => setActiveTab('my-services')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'my-services'
                  ? 'border-propertree-green text-propertree-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Services
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'catalog' ? (
            <ServiceCatalog onBookService={handleBookService} />
          ) : (
            <MyServices />
          )}
        </div>

        {selectedService && (
          <BookServiceModal
            service={selectedService}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedService(null);
            }}
            onSuccess={handleBookingSuccess}
          />
        )}
      </div>
    </Container>
  );
};

export default Services;
