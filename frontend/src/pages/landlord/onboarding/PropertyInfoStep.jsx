/**
 * Step 3: Property Information
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Plus, Minus } from 'lucide-react';

const Counter = ({ label, value, onChange, min = 0, max = 50 }) => {
  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg">
      <span className="font-medium text-gray-900">{label}</span>
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-propertree-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-lg font-semibold w-8 text-center">{value}</span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-propertree-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

Counter.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
};

const PropertyInfoStep = ({ formData, updateFormData }) => (
  <div>
    <p className="text-gray-600 mb-6">
      Share some basic details about the property we should take care of.
    </p>

    <div className="space-y-4">
      <Counter
        label="Bedrooms"
        value={formData.bedrooms}
        onChange={(val) => updateFormData({ bedrooms: val })}
        min={0}
      />
      <Counter
        label="Bathrooms"
        value={formData.bathrooms}
        onChange={(val) => updateFormData({ bathrooms: val })}
        min={1}
      />
      <Counter
        label="Beds"
        value={formData.beds}
        onChange={(val) => updateFormData({ beds: val })}
        min={1}
      />
    </div>

    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-blue-800 text-sm">
        💡 <strong>Tip:</strong> You can always edit this information later.
      </p>
    </div>
  </div>
);

PropertyInfoStep.propTypes = {
  formData: PropTypes.object.isRequired,
  updateFormData: PropTypes.func.isRequired,
};

export default PropertyInfoStep;
