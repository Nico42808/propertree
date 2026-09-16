/**
 * Step 2: Area Type Selection
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Home, DoorOpen, Users } from 'lucide-react';

const PLACE_TYPES = [
  {
    value: 'entire_place',
    label: 'Entire Place',
    description: 'We take care of the full property, including all interior areas.',
    icon: Home,
  },
  {
    value: 'private_room',
    label: 'Private Room',
    description: 'We take care of a specific room or defined interior area of the property.',
    icon: DoorOpen,
  },
  {
    value: 'external_area',
    label: 'External Area',
    description: 'We take care of outdoor areas such as gardens, driveways, decks or other exterior spaces.',
    icon: Users,
  },
];

const PlaceTypeStep = ({ formData, updateFormData }) => {
  const handleSelect = (type) => {
    updateFormData({ place_type: type });
  };

  return (
    <div>
      <p className="text-gray-600 mb-6">
        What type of place should we take care of?
      </p>

      <div className="space-y-4">
        {PLACE_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = formData.place_type === type.value;

          return (
            <button
              key={type.value}
              type="button"
              onClick={() => handleSelect(type.value)}
              className={`w-full p-6 border-2 rounded-lg transition-all text-left hover:shadow-md ${
                isSelected
                  ? 'border-propertree-green bg-green-50'
                  : 'border-gray-300 hover:border-green-400'
              }`}
            >
              <div className="flex items-start">
                <Icon
                  className={`w-8 h-8 mr-4 flex-shrink-0 ${
                    isSelected ? 'text-propertree-green' : 'text-gray-600'
                  }`}
                />
                <div>
                  <p className={`font-semibold text-lg mb-1 ${isSelected ? 'text-propertree-green' : 'text-gray-900'}`}>
                    {type.label}
                  </p>
                  <p className="text-gray-600 text-sm">{type.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

PlaceTypeStep.propTypes = {
  formData: PropTypes.object.isRequired,
  updateFormData: PropTypes.func.isRequired,
};

export default PlaceTypeStep;
