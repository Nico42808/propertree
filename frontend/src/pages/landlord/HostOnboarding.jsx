/**
 * Property onboarding - streamlined owner/property-management setup
 */
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks';
import { Container } from '../../components/layout';
import { Button, Card } from '../../components/common';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';

import PropertyTypeStep from './onboarding/PropertyTypeStep';
import PlaceTypeStep from './onboarding/PlaceTypeStep';
import PropertyInfoStep from './onboarding/PropertyInfoStep';
import AddressStep from './onboarding/AddressStep';
import PhotosStep from './onboarding/PhotosStep';
import HouseRulesStep from './onboarding/HouseRulesStep';
import ReviewStep from './onboarding/ReviewStep';
import PropertyVerificationStep from './onboarding/PropertyVerificationStep';
import { uploadPropertyDocument } from '../../services/propertyDocumentService';

const BASE_STEPS = [
  { key: 'propertyType', title: 'Property Type', component: PropertyTypeStep },
  { key: 'placeType', title: 'Area To Take Care Of', component: PlaceTypeStep },
  { key: 'propertyInfo', title: 'Property Information', component: PropertyInfoStep },
  { key: 'address', title: 'Address', component: AddressStep },
  { key: 'photos', title: 'Photos', component: PhotosStep },
  { key: 'verification', title: 'Property Verification', component: PropertyVerificationStep },
  { key: 'description', title: 'Description Of Your Property', component: HouseRulesStep },
  { key: 'review', title: 'Review & Submit', component: ReviewStep },
];

const HostOnboarding = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const isAdminUser = isAdmin();
  const isLandlordVerified = isAdminUser || Boolean(user?.is_verified);
  const steps = useMemo(
    () => BASE_STEPS.map((step, index) => ({
      ...step,
      title: isAdminUser && step.key === 'review' ? 'Review & Create' : step.title,
      id: index + 1,
    })),
    [isAdminUser]
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    propertyId: null,
    property_type: '',
    place_type: '',
    bedrooms: 1,
    bathrooms: 1,
    beds: 1,
    max_guests: 1,
    address: '',
    city: '',
    state: 'Nova Scotia',
    country: 'Canada',
    postal_code: '',
    photos: [],
    verification_relationship: '',
    verification_document: null,
    title: '',
    description: '',
  });

  const currentStepComponent = steps.find((step) => step.id === currentStep);
  const StepComponent = currentStepComponent?.component;

  useEffect(() => {
    if (currentStep > steps.length) {
      setCurrentStep(steps.length);
    }
  }, [currentStep, steps.length]);

  useEffect(() => {
    if (!isLandlordVerified) {
      toast.error('Your identity must be verified before you can add a property.');
      navigate('/landlord/properties', { replace: true });
    }
  }, [isLandlordVerified, navigate]);

  const handleNext = () => {
    if (
      !isAdminUser
      && currentStepComponent?.key === 'verification'
      && (!formData.verification_relationship || !formData.verification_document)
    ) {
      toast.error('Please Upload a Property Verification Document to Continue');
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepChange = (stepId) => {
    const verificationStep = steps.find((step) => step.key === 'verification');
    if (
      !isAdminUser
      && verificationStep
      && stepId > verificationStep.id
      && (!formData.verification_relationship || !formData.verification_document)
    ) {
      toast.error('Complete Property Verification Before Continuing');
      setCurrentStep(verificationStep.id);
      return;
    }

    setCurrentStep(stepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateFormData = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const buildPropertyPayload = (status) => {
    const propertyType = Array.isArray(formData.property_type)
      ? formData.property_type[0]
      : formData.property_type || 'apartment';

    return {
      title: formData.title || 'Untitled Property',
      description: formData.description || 'No description provided',
      property_type: propertyType,
      address: formData.address,
      city: formData.city,
      state: formData.state || 'Nova Scotia',
      country: formData.country || 'Canada',
      postal_code: formData.postal_code,
      bedrooms: parseInt(formData.bedrooms, 10) || 1,
      bathrooms: parseFloat(formData.bathrooms) || 1,
      max_guests: 1,
      price_per_night: 0,
      approval_type: isAdminUser ? 'admin' : 'landlord',
      rental_terms: [],
      amenities: [],
      photos: formData.photos || [],
      status,
    };
  };

  const handleSaveDraft = async () => {
    if (!isLandlordVerified) {
      toast.error('Your identity must be verified before you can add a property.');
      return;
    }

    try {
      const response = await api.post(
        '/properties/landlord/create/',
        buildPropertyPayload(isAdminUser ? 'approved' : 'draft')
      );
      toast.success('Draft saved successfully!');
      setFormData((prev) => ({ ...prev, propertyId: response.data.id }));
    } catch (error) {
      console.error('Error saving draft:', error?.response?.data || error);
      toast.error('Error saving draft');
    }
  };

  const handleSubmit = async () => {
    if (!isLandlordVerified) {
      toast.error('Your identity must be verified before you can add a property.');
      navigate('/landlord/properties');
      return;
    }

    if (!isAdminUser && (!formData.verification_relationship || !formData.verification_document)) {
      toast.error('Please Upload a Property Verification Document');
      const verificationStep = steps.find((step) => step.key === 'verification');
      if (verificationStep) setCurrentStep(verificationStep.id);
      return;
    }

    try {
      const createResponse = await api.post(
        '/properties/landlord/create/',
        buildPropertyPayload(isAdminUser ? 'approved' : 'draft')
      );
      const createdProperty = createResponse.data;

      if (isAdminUser) {
        if (formData.verification_relationship && formData.verification_document) {
          await uploadPropertyDocument(createdProperty.id, {
            title: formData.verification_relationship === 'owner' ? 'Proof of Ownership' : 'Lease Agreement',
            category: formData.verification_relationship === 'owner' ? 'proof_of_ownership' : 'lease_agreement',
            notes: 'Uploaded during property onboarding for verification.',
            file: formData.verification_document,
          });
        }
        toast.success('Property created successfully!');
        navigate('/admin/properties');
        return;
      }

      await uploadPropertyDocument(createdProperty.id, {
        title: formData.verification_relationship === 'owner' ? 'Proof of Ownership' : 'Lease Agreement',
        category: formData.verification_relationship === 'owner' ? 'proof_of_ownership' : 'lease_agreement',
        notes: 'Uploaded during property onboarding for verification.',
        file: formData.verification_document,
      });

      await api.post(`/properties/landlord/${createdProperty.id}/submit/`);
      toast.success('Property submitted successfully!');
      navigate('/landlord/properties');
    } catch (error) {
      console.error('Error submitting property:', error?.response?.data || error);
      toast.error('Error submitting property');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">Add Property</h1>
            <span className="text-sm text-gray-600">
              Step {currentStep} of {steps.length}
            </span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => handleStepChange(step.id)}
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-medium text-sm transition-all ${
                    step.id < currentStep
                      ? 'bg-green-600 text-white'
                      : step.id === currentStep
                        ? 'bg-propertree-blue text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.id < currentStep ? <Check className="w-5 h-5" /> : step.id}
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-1 ${
                      step.id < currentStep ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-propertree-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <Card className="mb-6">
          <Card.Header>
            <Card.Title>{currentStepComponent?.title}</Card.Title>
          </Card.Header>

          <Card.Body>
            {StepComponent && (
              <StepComponent
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
          </Card.Body>

          <Card.Footer>
            <div className="flex justify-between items-center">
              <div>
                {currentStep > 1 && (
                  <Button variant="outline" onClick={handleBack} leftIcon={<ChevronLeft />}>
                    Back
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleSaveDraft}>
                  Save Draft
                </Button>

                {currentStep < steps.length ? (
                  <Button variant="primary" onClick={handleNext} rightIcon={<ChevronRight />}>
                    Next
                  </Button>
                ) : (
                  <Button variant="success" onClick={handleSubmit}>
                    {isAdminUser ? 'Create Property' : 'Submit Property'}
                  </Button>
                )}
              </div>
            </div>
          </Card.Footer>
        </Card>

        <div className="text-center text-sm text-gray-600">
          <p>You can save your progress at any time and continue later.</p>
        </div>
      </Container>
    </div>
  );
};

export default HostOnboarding;
