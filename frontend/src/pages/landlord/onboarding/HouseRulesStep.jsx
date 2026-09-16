/**
 * Step 6: Property Description
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Input, TextArea } from '../../../components/common';

const HouseRulesStep = ({ formData, updateFormData }) => (
  <div>
    <p className="text-gray-600 mb-6">
      Add a clear name and description so our team understands the property and how it should be taken care of.
    </p>

    <div className="space-y-4">
      <Input
        label="Property Name"
        name="title"
        placeholder="Lake House Nova Scotia"
        value={formData.title}
        onChange={(e) => updateFormData({ title: e.target.value })}
        required
      />

      <TextArea
        label="Description Of Your Property"
        name="description"
        placeholder="Describe the property, important features, access information and anything our property management team should know..."
        value={formData.description}
        onChange={(e) => updateFormData({ description: e.target.value })}
        rows={6}
        maxLength={1200}
        required
      />
    </div>
  </div>
);

HouseRulesStep.propTypes = {
  formData: PropTypes.object.isRequired,
  updateFormData: PropTypes.func.isRequired,
};

export default HouseRulesStep;
