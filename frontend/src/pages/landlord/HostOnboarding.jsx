/**
 * Host Onboarding - 11-step wizard for becoming a host
 */
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks';
import { Container } from '../../components/layout';
import { Button, Card } from '../../components/common';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';

// Import all step components
import PropertyTypeStep from './onboarding/PropertyTypeStep';
import PlaceTypeStep from './onboarding/PlaceTypeStep';
import PropertyInfoStep from './onboarding/PropertyInfoStep';
import AddressStep from './onboarding/AddressStep';
import PhotosStep from './onboarding/PhotosStep';
import AmenitiesStep from './onboarding/AmenitiesStep';
import RentalTermStep from './onboarding/RentalTermStep';
import PricingStep from './onboarding/PricingStep';
import BookingApprovalStep from './onboarding/BookingApprovalStep';
import HouseRulesStep from './onboarding/HouseRulesStep';
import ReviewStep from './onboarding/ReviewStep';

const BASE_STEPS = [
  { key: 'propertyType', title: 'Property Type', component: PropertyTypeStep },
  { key: 'placeType', title: 'Place Type', component: PlaceTypeStep },
  { key: 'propertyInfo', title: 'Property Information', component: PropertyInfoStep },
  { key: 'address', title: 'Address', component: AddressStep },
  { key: 'photos', title: 'Photos', component: PhotosStep },
  { key: 'amenities', title: 'Amenities', component: AmenitiesStep },
  { key: 'rentalTerm', title: 'Rental Term', component: RentalTermStep },
  { key: 'pricing', title: 'Pricing', component: PricingStep },
  { key: 'bookingApproval', title: 'Booking Approval', component: BookingApprovalStep },
  { key: 'houseRules', title: 'House Rules', component: HouseRulesStep },
  { key: 'review', title: 'Review & Submit', component: ReviewStep },
];

const HostOnboarding = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isAdminUser = isAdmin();
  const steps = useMemo(() => {
    const filteredSteps = isAdminUser
      ? BASE_STEPS.filter((step) => step.key !== 'bookingApproval')
      : BASE_STEPS;
    return filteredSteps.map((step, index) => ({
      ...step,
      title: isAdminUser && step.key === 'review' ? 'Review & Create' : step.title,
      id: index + 1,
    }));
  }, [isAdminUser]);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Property ID (set after creation)
    propertyId: null,
    // Step 1
    property_type: '',
    // Step 2
    place_type: '',
    // Step 3
    bedrooms: 1,
    bathrooms: 1,
    beds: 1,
    max_guests: 1,
    // Step 4
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    // Step 5
    photos: [],
    // Step 6
    amenities: [],
    // Step 7
    rental_terms: [],
    short_term_check_in_time: '',
    short_term_check_out_time: '',
    // Step 8
    base_price: '',
    monthly_price: '',
    service_fee_percent: 10,
    currency: 'EUR',
    // Step 9
    approval_type: isAdminUser ? 'admin' : 'landlord',
    // Step 10
    title: '',
    description: '',
    house_rules: '',
    allows_pets: false,
    allows_smoking: false,
    allows_events: false,
    minimum_stay: 1,
    maximum_stay: null,
  });

  const currentStepComponent = steps.find(step => step.id === currentStep);
  const StepComponent = currentStepComponent?.component;

  useEffect(() => {
    if (isAdminUser && formData.approval_type !== 'admin') {
      setFormData(prev => ({ ...prev, approval_type: 'admin' }));
    }
  }, [isAdminUser, formData.approval_type]);

  useEffect(() => {
    if (currentStep > steps.length) {
      setCurrentStep(steps.length);
    }
  }, [currentStep, steps.length]);

  const handleNext = () => {
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
    setCurrentStep(stepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSaveDraft = async () => {
    try {
      // Map form data to simplified property model
      // Ensure property_type is a string (not array)
      const propertyType = Array.isArray(formData.property_type) 
        ? formData.property_type[0] 
        : formData.property_type || 'apartment';
      
      const propertyData = {
        title: formData.title || 'Untitled Property',
        description: formData.description || 'No description provided',
        property_type: propertyType,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postal_code: formData.postal_code,
        bedrooms: parseInt(formData.bedrooms) || 1,
        bathrooms: parseFloat(formData.bathrooms) || 1,
        max_guests: parseInt(formData.max_guests) || 1,
        price_per_night: parseFloat(formData.base_price) || 0,
        monthly_price: formData.monthly_price !== '' ? parseFloat(formData.monthly_price) || 0 : null,
        approval_type: formData.approval_type || 'landlord',
        rental_terms: formData.rental_terms || [],
        amenities: formData.amenities || [],
        photos: formData.photos || [],
        status: isAdminUser ? 'approved' : 'draft'
      };

      const response = await api.post('/properties/landlord/create/', propertyData);
      toast.success('Draft saved successfully!');
      // Store property ID for future updates
      setFormData(prev => ({ ...prev, propertyId: response.data.id }));
    } catch (error) {
      console.error('Error saving draft:', error?.response?.data || error);
      toast.error('Error saving draft');
    }
  };

  const handleSubmit = async () => {
    try {
      // Step 1: Create property as draft first
      // Ensure property_type is a string (not array)
      const propertyType = Array.isArray(formData.property_type) 
        ? formData.property_type[0] 
        : formData.property_type || 'apartment';
      
      const propertyData = {
        title: formData.title || 'Untitled Property',
        description: formData.description || 'No description provided',
        property_type: propertyType,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postal_code: formData.postal_code,
        bedrooms: parseInt(formData.bedrooms) || 1,
        bathrooms: parseFloat(formData.bathrooms) || 1,
        max_guests: parseInt(formData.max_guests) || 1,
        price_per_night: parseFloat(formData.base_price) || 0,
        monthly_price: formData.monthly_price !== '' ? parseFloat(formData.monthly_price) || 0 : null,
        approval_type: formData.approval_type || 'landlord',
        rental_terms: formData.rental_terms || [],
        amenities: formData.amenities || [],
        photos: formData.photos || [],
        status: 'draft'
      };

      const createResponse = await api.post('/properties/landlord/create/', propertyData);
      const createdProperty = createResponse.data;
      if (isAdminUser) {
        toast.success('Property created successfully!');
        navigate('/admin/properties');
        return;
      }

      // Step 2: Submit for approval
      await api.post(`/properties/landlord/${createdProperty.id}/submit/`);
      toast.success('Property submitted for approval!');
      navigate('/landlord/properties');
    } catch (error) {
      console.error('Error submitting property:', error?.response?.data || error);
      toast.error('Error submitting property');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">Add Property</h1>
            <span className="text-sm text-gray-600">
              Step {currentStep} of {steps.length}
            </span>
          </div>
          
          {/* Progress Steps */}
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
                  {step.id < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
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

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-propertree-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
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

          {/* Navigation Buttons */}
          <Card.Footer>
            <div className="flex justify-between items-center">
              <div>
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    leftIcon={<ChevronLeft />}
                  >
                    Back
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={handleSaveDraft}
                >
                  Save Draft
                </Button>

                {currentStep < steps.length ? (
                  <Button
                    variant="primary"
                    onClick={handleNext}
                    rightIcon={<ChevronRight />}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    onClick={handleSubmit}
                  >
                    {isAdminUser ? 'Create Property' : 'Submit for Approval'}
                  </Button>
                )}
              </div>
            </div>
          </Card.Footer>
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-600">
          <p>
            You can save your progress at any time and continue later.
          </p>
        </div>
      </Container>
    </div>
  );
};

export default HostOnboarding;
