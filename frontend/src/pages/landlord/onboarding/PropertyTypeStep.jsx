/**
 * Step 1: Property Type Selection
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Home, Building, Hotel, Key, Castle, Building2, HomeIcon, Layers } from 'lucide-react';

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment', icon: Building },
  { value: 'house', label: 'House', icon: Home },
  { value: 'room', label: 'Room', icon: Key },
  { value: 'studio', label: 'Studio', icon: HomeIcon },
  { value: 'villa', label: 'Villa', icon: Castle },
  { value: 'condo', label: 'Condo', icon: Building2 },
  { value: 'townhouse', label: 'Townhouse', icon: Hotel },
  { value: 'other', label: 'Other', icon: Layers },
];

const PropertyTypeStep = ({ formData, updateFormData }) => {
  const handleSelect = (type) => {
    updateFormData({ property_type: type });
  };

  return (
    <div>
      <p className="text-gray-600 mb-6">
        Select the type of property you want Propertree to take care of.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {PROPERTY_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = formData.property_type === type.value;

          return (
            <button
              key={type.value}
              type="button"
              onClick={() => handleSelect(type.value)}
              className={`p-6 border-2 rounded-lg transition-all hover:shadow-md ${
                isSelected
                  ? 'border-propertree-green bg-green-50'
                  : 'border-gray-300 hover:border-green-400'
              }`}
            >
              <Icon
                className={`w-12 h-12 mx-auto mb-3 ${
                  isSelected ? 'text-propertree-green' : 'text-gray-600'
                }`}
              />
              <p className={`font-medium ${isSelected ? 'text-propertree-green' : 'text-gray-900'}`}>
                {type.label}
              </p>
            </button>
          );
        })}
      </div>

      {formData.property_type && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">
            ✓ Selected Type:{' '}
            <span className="font-medium">
              {PROPERTY_TYPES.find((type) => type.value === formData.property_type)?.label}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

PropertyTypeStep.propTypes = {
  formData: PropTypes.object.isRequired,
  updateFormData: PropTypes.func.isRequired,
};

export default PropertyTypeStep;
