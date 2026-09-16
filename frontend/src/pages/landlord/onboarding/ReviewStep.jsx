/**
 * Step 7: Review and Submit
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from '../../../components/common';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../../../hooks';

const formatLabelValue = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const ReviewStep = ({ formData }) => {
  const { isAdmin } = useAuth();
  const isAdminUser = isAdmin();

  const sections = [
    { title: 'Property Type', value: formatLabelValue(formData.property_type) },
    { title: 'Area To Take Care Of', value: formatLabelValue(formData.place_type) },
    { title: 'Bedrooms', value: formData.bedrooms },
    { title: 'Bathrooms', value: formData.bathrooms },
    { title: 'Beds', value: formData.beds },
    { title: 'Address', value: formData.address },
    { title: 'City', value: formatLabelValue(formData.city) },
    { title: 'Province', value: formatLabelValue(formData.state) },
    { title: 'Country', value: formatLabelValue(formData.country) },
    { title: 'Postal Code', value: String(formData.postal_code || '').toUpperCase() },
    { title: 'Photos', value: `${formData.photos?.length || 0} Photos` },
    { title: 'Property Name', value: formData.title },
    {
      title: 'Description Of Your Property',
      value: formData.description
        ? `${formData.description.substring(0, 140)}${formData.description.length > 140 ? '...' : ''}`
        : '',
    },
  ];

  const isComplete = Boolean(
    formData.property_type &&
    formData.place_type &&
    formData.address &&
    formData.city &&
    formData.title &&
    formData.description
  );

  return (
    <div>
      <p className="text-gray-600 mb-6">
        Review the property information before submitting it.
      </p>

      {!isComplete && (
        <Alert
          type="warning"
          title="Incomplete Information"
          message="Please fill in all required fields before submitting the property."
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {sections.map((section) => (
          <div key={section.title} className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">{section.title}</p>
            <p className="font-medium text-gray-900">{section.value || 'Not Provided'}</p>
          </div>
        ))}
      </div>

      {!isAdminUser && (
        <div className="p-6 bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-rose-900 mb-2">Property Review</h3>
              <p className="text-sm text-rose-800">
                After submission, the property will be available to our team for review and property management setup.
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
