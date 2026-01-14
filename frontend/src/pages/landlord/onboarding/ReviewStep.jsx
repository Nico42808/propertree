/**
 * Step 11: Review and Submit
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from '../../../components/common';
import { AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { useAuth } from '../../../hooks';

const ReviewStep = ({ formData }) => {
  const { isAdmin } = useAuth();
  const isAdminUser = isAdmin();
  const sections = [
    { title: 'Property Type', value: formData.property_type, key: 'property_type' },
    { title: 'Place Type', value: formData.place_type, key: 'place_type' },
    { title: 'Bedrooms', value: formData.bedrooms, key: 'bedrooms' },
    { title: 'Bathrooms', value: formData.bathrooms, key: 'bathrooms' },
    { title: 'Guests', value: formData.max_guests, key: 'max_guests' },
    { title: 'Address', value: formData.address, key: 'address' },
    { title: 'City', value: formData.city, key: 'city' },
    { title: 'Photos', value: `${formData.photos?.length || 0} photos`, key: 'photos' },
    { title: 'Amenities', value: `${formData.amenities?.length || 0} selected`, key: 'amenities' },
    { title: 'Check-in', value: formData.check_in_time, key: 'check_in_time' },
    { title: 'Check-out', value: formData.check_out_time, key: 'check_out_time' },
    { title: 'Base Price', value: formData.base_price ? formatCurrency(formData.base_price) : '', key: 'base_price' },
    { title: 'Title', value: formData.title, key: 'title' },
    { title: 'Description', value: formData.description?.substring(0, 100) + '...', key: 'description' },
  ];

  const isComplete = formData.property_type && formData.place_type && formData.address && 
                     formData.city && formData.base_price && formData.title && formData.description;

  return (
    <div>
      <p className="text-gray-600 mb-6">
        {isAdminUser
          ? 'Review all information before creating the property'
          : 'Review all information before submitting for approval'}
      </p>

      {!isComplete && (
        <Alert
          type="warning"
          title="Incomplete Information"
          message={
            isAdminUser
              ? 'Please fill in all required fields before creating the property'
              : 'Please fill in all required fields before submitting'
          }
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {sections.map((section, idx) => (
          <div key={idx} className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">{section.title}</p>
            <p className="font-medium text-gray-900">{section.value || 'Not provided'}</p>
          </div>
        ))}
      </div>

      {!isAdminUser && (
        <div className="p-6 bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-rose-900 mb-2">
                Awaiting Administrator Approval
              </h3>
              <p className="text-sm text-rose-800">
                After submission, your property will be reviewed by our team. You will receive a 
                notification when it's approved or if we need additional information.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ReviewStep.propTypes = {
  formData: PropTypes.object.isRequired,
};

export default ReviewStep;
