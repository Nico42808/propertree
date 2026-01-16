/**
 * Step 7: Rental Term Selection
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Clock } from 'lucide-react';
import { Input } from '../../../components/common';

const RENTAL_TERMS = [
  { value: 'short_term', label: 'Short Term', description: 'Up to a month' },
  { value: 'mid_term', label: 'Mid-Term', description: 'Up to a year' },
  { value: 'long_term', label: 'Long Term', description: '1 year and above' },
];

const RentalTermStep = ({ formData, updateFormData }) => {
  const selectedTerms = formData.rental_terms || [];
  const isShortTermSelected = selectedTerms.includes('short_term');

  const handleToggle = (termValue) => {
    const isSelected = selectedTerms.includes(termValue);
    const updated = isSelected
      ? selectedTerms.filter((term) => term !== termValue)
      : [...selectedTerms, termValue];

    const nextData = { rental_terms: updated };
    if (termValue === 'short_term' && isSelected) {
      nextData.short_term_check_in_time = '';
      nextData.short_term_check_out_time = '';
    }

    updateFormData(nextData);
  };

  return (
    <div>
      <p className="text-gray-600 mb-6">
        Choose the rental terms you want to offer.
      </p>

      <div className="space-y-4">
        {RENTAL_TERMS.map((term) => {
          const isSelected = selectedTerms.includes(term.value);
          const isShortTerm = term.value === 'short_term';

          return (
            <div
              key={term.value}
              className={`w-full border-2 rounded-lg transition-all ${
                isSelected
                  ? 'border-propertree-green bg-green-50'
                  : 'border-gray-300 hover:border-green-400'
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggle(term.value)}
                className="w-full p-6 text-left"
              >
                <p className={`font-semibold text-lg mb-1 ${isSelected ? 'text-propertree-green' : 'text-gray-900'}`}>
                  {term.label}
                </p>
                <p className="text-gray-600 text-sm">{term.description}</p>
              </button>

              {isShortTerm && isSelected && (
                <div className="px-6 pb-6">
                  <div className="p-4 border border-green-200 rounded-lg bg-white">
                    <p className="text-gray-600 text-sm mb-4">
                      Define the check-in and check-out times for short-term stays.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Check-in Time"
                        type="time"
                        name="short_term_check_in_time"
                        value={formData.short_term_check_in_time}
                        onChange={(e) => updateFormData({ short_term_check_in_time: e.target.value })}
                        leftIcon={<Clock className="w-5 h-5 text-gray-400" />}
                        required
                      />
                      <Input
                        label="Check-out Time"
                        type="time"
                        name="short_term_check_out_time"
                        value={formData.short_term_check_out_time}
                        onChange={(e) => updateFormData({ short_term_check_out_time: e.target.value })}
                        leftIcon={<Clock className="w-5 h-5 text-gray-400" />}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

RentalTermStep.propTypes = {
  formData: PropTypes.object.isRequired,
  updateFormData: PropTypes.func.isRequired,
};

export default RentalTermStep;
