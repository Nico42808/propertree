/**
 * Step 8: Pricing
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Input } from '../../../components/common';
import { Euro } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

const PricingStep = ({ formData, updateFormData }) => {
  const total = parseFloat(formData.base_price || 0);
  
  return (
    <div>
      <p className="text-gray-600 mb-6">Set your property price</p>
      <div className="space-y-4">
        <Input
          label="Base Price per Night (€)"
          type="number"
          name="base_price"
          placeholder="150.00"
          value={formData.base_price}
          onChange={(e) => updateFormData({ base_price: e.target.value })}
          leftIcon={<Euro className="w-5 h-5 text-gray-400" />}
          required
        />
        {total > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              Estimated total: <strong>{formatCurrency(total)}</strong> per night
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

PricingStep.propTypes = {
  formData: PropTypes.object.isRequired,
  updateFormData: PropTypes.func.isRequired,
};

export default PricingStep;
