/**
 * BookServiceModal component - Modal for booking a service
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import { createServiceBooking } from '../../services/serviceService';
import { startOfToday, toLocalDateString } from '../../utils/date';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const BookServiceModal = ({ service, isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rental_property: '',
    requested_date: '',
    requested_time: '',
    priority: 'medium',
    description: '',
  });
  const [errors, setErrors] = useState({});

  // Fetch landlord's properties
  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['landlord-properties'],
    queryFn: async () => {
      const response = await api.get('/properties/landlord/');
      // Handle paginated response - extract results array
      return response.data.results || response.data;
    },
    enabled: isOpen,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.rental_property) {
      newErrors.rental_property = 'Property is required';
    }
    if (!formData.requested_date) {
      newErrors.requested_date = 'Date is required';
    }
    if (!formData.requested_time) {
      newErrors.requested_time = 'Time is required';
    }
    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = 'Please provide at least 10 characters describing what needs to be done';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      await createServiceBooking({
        service_catalog_id: service.id,
        rental_property: formData.rental_property,
        requested_date: formData.requested_date,
        requested_time: formData.requested_time,
        priority: formData.priority,
        description: formData.description,
        title: `${service.name} Service Request`,
        category: service.category,
        booking_type: 'scheduled',
      });

      toast.success('Service booking request submitted! Awaiting admin confirmation.');
      onSuccess?.();
      onClose();

      // Reset form
      setFormData({
        rental_property: '',
        requested_date: '',
        requested_time: '',
        priority: 'medium',
        description: '',
      });
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to book service. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        rental_property: '',
        requested_date: '',
        requested_time: '',
        priority: 'medium',
        description: '',
      });
      setErrors({});
      onClose();
    }
  };

  // Get tomorrow's date as minimum date
  const getTomorrowDate = () => {
    const tomorrow = startOfToday();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toLocalDateString(tomorrow);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Book ${service?.name}`}
      size="lg"
      closeOnOverlayClick={!isSubmitting}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Service Info */}
        <div className="bg-propertree-cream-100 rounded-xl p-4">
          <p className="text-sm text-gray-700">
            <strong>Service:</strong> {service?.name}
          </p>
          <p className="text-sm text-gray-600 mt-1">{service?.description}</p>
          {service?.estimated_price_min && service?.estimated_price_max && (
            <p className="text-sm text-gray-700 mt-2">
              <strong>Estimated Cost:</strong> {formatCurrency(service.estimated_price_min)} - {formatCurrency(service.estimated_price_max)}
            </p>
          )}
        </div>

        {/* Property Selection */}
        <div>
          <label
            htmlFor="rental_property"
            className="block text-sm font-medium text-propertree-dark mb-1.5"
          >
            Select Property <span className="text-red-500">*</span>
          </label>
          {propertiesLoading ? (
            <div className="text-sm text-gray-500">Loading properties...</div>
          ) : properties.length === 0 ? (
            <div className="text-sm text-gray-500">
              No properties available. Please add a property first.
            </div>
          ) : (
            <select
              id="rental_property"
              name="rental_property"
              value={formData.rental_property}
              onChange={handleChange}
              className={`
                block w-full rounded-xl border-2 ${
                  errors.rental_property ? 'border-red-500' : 'border-gray-200'
                }
                px-4 py-3 text-gray-900 bg-white shadow-sm
                focus:outline-none focus:ring-2 focus:ring-propertree-green/20 focus:border-propertree-green
                transition-all duration-200 font-medium text-sm
              `}
            >
              <option value="">Choose a property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.title} - {property.address}, {property.city}
                </option>
              ))}
            </select>
          )}
          {errors.rental_property && (
            <p className="mt-1.5 text-sm text-red-600">{errors.rental_property}</p>
          )}
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Preferred Date"
            name="requested_date"
            value={formData.requested_date}
            onChange={handleChange}
            error={errors.requested_date}
            touched={!!errors.requested_date}
            min={getTomorrowDate()}
            required
          />

          <Input
            type="time"
            label="Preferred Time"
            name="requested_time"
            value={formData.requested_time}
            onChange={handleChange}
            error={errors.requested_time}
            touched={!!errors.requested_time}
            required
          />
        </div>

        {/* Priority */}
        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-propertree-dark mb-1.5"
          >
            Priority <span className="text-red-500">*</span>
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-propertree-green/20 focus:border-propertree-green transition-all duration-200 font-medium text-sm"
          >
            <option value="low">Low - Can wait a week</option>
            <option value="medium">Medium - Within 3 days</option>
            <option value="high">High - Within 24 hours</option>
            <option value="urgent">Urgent - Immediate attention needed</option>
          </select>
        </div>

        {/* Description */}
        <TextArea
          label="Additional Details"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe what needs to be done..."
          rows={4}
          error={errors.description}
          touched={!!errors.description}
          required
          maxLength={500}
        />

        {/* Notice */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Your service request will be reviewed by our admin team.
            You will receive a notification once it is confirmed and a service provider is assigned.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={properties.length === 0}>
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};

BookServiceModal.propTypes = {
  service: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    estimated_price_min: PropTypes.string,
    estimated_price_max: PropTypes.string,
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default BookServiceModal;
