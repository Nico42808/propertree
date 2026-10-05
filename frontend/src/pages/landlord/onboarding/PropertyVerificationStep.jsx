import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FileCheck2, UploadCloud, X } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const PropertyVerificationStep = ({ formData, updateFormData }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const selectFile = (file) => {
    setError('');
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a PDF, JPG or PNG file.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('The verification document must be smaller than 10 MB.');
      return;
    }
    updateFormData({ verification_document: file });
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <p className="text-gray-600 mb-6">
        Help us verify that you are authorized to request property management services for this property.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => updateFormData({ verification_relationship: 'owner', verification_document: null })}
          className={`rounded-xl border-2 p-5 text-left transition-all ${formData.verification_relationship === 'owner' ? 'border-propertree-green bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <p className="font-semibold text-gray-900">I Own This Property</p>
          <p className="text-sm text-gray-600 mt-1">Upload a property title, deed or other proof of ownership.</p>
        </button>
        <button
          type="button"
          onClick={() => updateFormData({ verification_relationship: 'tenant', verification_document: null })}
          className={`rounded-xl border-2 p-5 text-left transition-all ${formData.verification_relationship === 'tenant' ? 'border-propertree-green bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <p className="font-semibold text-gray-900">I Rent This Property</p>
          <p className="text-sm text-gray-600 mt-1">Upload the current lease showing that you are authorized to use the property.</p>
        </button>
      </div>

      {formData.verification_relationship && (
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${dragging ? 'border-propertree-green bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-propertree-green'}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={(event) => selectFile(event.target.files?.[0])}
          />
          {formData.verification_document ? (
            <div className="flex items-center justify-center gap-3">
              <FileCheck2 className="w-7 h-7 text-propertree-green" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{formData.verification_document.name}</p>
                <p className="text-xs text-gray-500">Ready for secure verification</p>
              </div>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); updateFormData({ verification_document: null }); }}
                className="ml-2 p-1 text-gray-400 hover:text-red-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <UploadCloud className="w-10 h-10 mx-auto text-gray-400 mb-3" />
              <p className="font-medium text-gray-900">Drag and Drop Your Verification Document</p>
              <p className="text-sm text-gray-500 mt-1">or click to browse · PDF, JPG or PNG · max. 10 MB</p>
            </>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-4 text-xs text-gray-500">
        Verification documents are stored securely and are only available to authorized Propertree administrators for verification.
      </p>
    </div>
  );
};

PropertyVerificationStep.propTypes = {
  formData: PropTypes.object.isRequired,
  updateFormData: PropTypes.func.isRequired,
};

export default PropertyVerificationStep;
