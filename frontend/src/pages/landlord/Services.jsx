/**
 * Services page - Landlord service booking interface
 */
import React, { useState } from 'react';
import { Container } from '../../components/layout';
import { useQueryClient } from '@tanstack/react-query';
import ServiceCatalog from '../../components/services/ServiceCatalog';
import MyServiceBookings from '../../components/services/MyServiceBookings';
import BookServiceModal from '../../components/services/BookServiceModal';

const Services = () => {
  const [activeTab, setActiveTab] = useState('catalog'); // catalog | my-bookings
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleBookService = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleBookingSuccess = () => {
    // Refresh bookings list
    queryClient.invalidateQueries(['my-service-bookings']);
    queryClient.invalidateQueries(['service-bookings-stats']);
  };

  return (
    <Container className="py-8">
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-propertree-dark">Property Services</h1>
        <p className="text-gray-600 mt-2">
          Book professional services for your properties and track service requests
        </p>
      </div>

      {/* Tabs */}
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
            onClick={() => setActiveTab('my-bookings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'my-bookings'
                ? 'border-propertree-green text-propertree-green'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Bookings
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'catalog' ? (
          <ServiceCatalog onBookService={handleBookService} />
        ) : (
          <MyServiceBookings />
        )}
      </div>

      {/* Booking Modal */}
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
