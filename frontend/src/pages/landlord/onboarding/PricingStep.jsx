/**
 * Step 8: Pricing
 */
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Input } from '../../../components/common';
import { Euro } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

const PricingStep = ({ formData, updateFormData }) => {
  const basePrice = parseFloat(formData.base_price || 0);
  const total = Number.isNaN(basePrice) ? 0 : basePrice;
  const rentalTerms = formData.rental_terms || [];
  const hasShortTerm = rentalTerms.includes('short_term');
  const hasMidTerm = rentalTerms.includes('mid_term');
  const hasLongTerm = rentalTerms.includes('long_term');
  const showBasePrice = hasShortTerm;
  const shouldAutoComputeMonthly = hasShortTerm && (hasMidTerm || hasLongTerm);
  const showMonthlyPrice = !hasShortTerm || shouldAutoComputeMonthly;
  const computedMonthly = shouldAutoComputeMonthly && total > 0 ? (total * 30).toFixed(2) : '';
  const lastComputedRef = useRef('');

  useEffect(() => {
    if (!shouldAutoComputeMonthly || !computedMonthly) {
      return;
    }

    const previousComputed = lastComputedRef.current;
    const currentMonthly = formData.monthly_price || '';
    const shouldAutofill = !currentMonthly || (
      currentMonthly === previousComputed && computedMonthly !== previousComputed
    );

    if (shouldAutofill) {
      updateFormData({ monthly_price: computedMonthly });
    }

    lastComputedRef.current = computedMonthly;
  }, [computedMonthly, formData.monthly_price, shouldAutoComputeMonthly, updateFormData]);
  
  return (
    <div>
      <p className="text-gray-600 mb-6">Set your property price</p>
      <div className="space-y-4">
        {showBasePrice && (
          <>
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
          </>
        )}
        {showMonthlyPrice && (
          <Input
            label="Total Price per Month (EUR)"
            type="number"
            name="monthly_price"
            placeholder={computedMonthly || '0.00'}
            value={formData.monthly_price || computedMonthly}
            onChange={(e) => updateFormData({ monthly_price: e.target.value })}
            leftIcon={<Euro className="w-5 h-5 text-gray-400" />}
          />
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
