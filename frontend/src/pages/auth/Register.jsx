/**
 * Register Page - User registration with modern design
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import { Alert } from '../../components/common';
import { Key, Home, X, Eye, EyeOff, Phone, Upload, User } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [identityDocument, setIdentityDocument] = useState(null);
  const [identityError, setIdentityError] = useState('');
  const [identityDragging, setIdentityDragging] = useState(false);

  // Handle profile photo selection
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    setPhotoError('');

    if (!file) {
      setProfilePhoto(null);
      setPhotoPreview(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please upload an image file');
      e.target.value = '';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size should be less than 5MB');
      e.target.value = '';
      return;
    }

    setProfilePhoto(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleIdentityDocument = (file) => {
    setIdentityError('');
    if (!file) {
      setIdentityDocument(null);
      return;
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setIdentityError('Please upload a PDF, JPG or PNG file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setIdentityError('ID document must be smaller than 10MB');
      return;
    }
    setIdentityDocument(file);
  };

  // Remove selected photo
  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    setPhotoPreview(null);
    setPhotoError('');
  };

  const formik = useFormik({
    initialValues: {
      first_name: '',
      last_name: '',
      phone_number: '',
      bio: '',
      email: '',
      password: '',
      role: 'landlord',
    },
    validationSchema: Yup.object({
      first_name: Yup.string()
        .required('First name is required'),
      last_name: Yup.string()
        .required('Last name is required'),
      phone_number: Yup.string()
        .required('Phone number is required'),
      bio: Yup.string()
        .when('role', {
          is: 'landlord',
          then: (schema) => schema.required('Please tell us about yourself as a host'),
          otherwise: (schema) => schema.notRequired(),
        }),
      email: Yup.string()
        .email('Invalid email')
        .required('Email is required'),
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
      role: Yup.string()
        .oneOf(['tenant', 'landlord'])
        .required('Please select an account type'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setError('');
        setSuccess('');

        if (values.role === 'landlord' && !identityDocument) {
          setIdentityError('A valid ID document is required for landlord registration');
          return;
        }

        // Landlord identity verification requires multipart form data.
        if (profilePhoto || identityDocument) {
          const formData = new FormData();
          formData.append('email', values.email);
          formData.append('password', values.password);
          formData.append('password2', values.password);
          formData.append('role', values.role);
          formData.append('profile.first_name', values.first_name);
          formData.append('profile.last_name', values.last_name);
          formData.append('profile.phone_number', values.phone_number);
          formData.append('profile.bio', values.bio || '');
          if (profilePhoto) formData.append('profile.profile_photo', profilePhoto);
          if (identityDocument) formData.append('profile.identity_document', identityDocument);

          // Call register with FormData (don't set Content-Type - browser will set it)
          await register(formData);
        } else {
          // Format data for backend (no photo)
          const registerData = {
            email: values.email,
            password: values.password,
            password2: values.password,
            role: values.role,
            profile: {
              first_name: values.first_name,
              last_name: values.last_name,
              phone_number: values.phone_number,
              bio: values.bio || '',
            }
          };

          await register(registerData);
        }

        setSuccess('Registration successful! Redirecting to login...');

        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } catch (err) {
        // Extract error message from response
        console.error('Full registration error:', err.response?.data || err);
        
        let errorMessage = 'Registration failed. Please try again.';
        
        if (err.response?.data) {
          const errorData = err.response.data;
          
          // Handle validation errors object
          if (errorData.errors) {
            const errorMessages = [];
            // Flatten nested error objects
            const flattenErrors = (obj, prefix = '') => {
              Object.keys(obj).forEach(key => {
                const value = obj[key];
                const fullKey = prefix ? `${prefix}.${key}` : key;
                if (typeof value === 'object' && !Array.isArray(value)) {
                  flattenErrors(value, fullKey);
                } else if (Array.isArray(value)) {
                  value.forEach(msg => errorMessages.push(`${fullKey}: ${msg}`));
                } else {
                  errorMessages.push(`${fullKey}: ${value}`);
                }
              });
            };
            flattenErrors(errorData.errors);
            errorMessage = errorMessages.length > 0 
              ? errorMessages.join(', ') 
              : errorData.message || errorMessage;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = typeof errorData.error === 'string' 
              ? errorData.error 
              : JSON.stringify(errorData.error);
          } else if (errorData.detail) {
            errorMessage = typeof errorData.detail === 'string'
              ? errorData.detail
              : JSON.stringify(errorData.detail);
          }
        }
        
        setError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 relative">
        {/* Close Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Sign Up</h1>

        {/* Alerts */}
        {error && (
          <Alert type="error" message={error} className="mb-4" />
        )}
        
        {success && (
          <Alert type="success" message={success} className="mb-4" />
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-5">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I am a:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => formik.setFieldValue('role', 'tenant')}
                className={`flex flex-col items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
                  formik.values.role === 'tenant'
                    ? 'bg-gray-800 text-white border-gray-800 shadow-md'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <Key className="w-5 h-5 mb-1" />
                <span className="text-sm font-medium">Tenant</span>
              </button>

              <button
                type="button"
                onClick={() => formik.setFieldValue('role', 'landlord')}
                className={`flex flex-col items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
                  formik.values.role === 'landlord'
                    ? 'bg-gray-800 text-white border-gray-800 shadow-md'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <Home className="w-5 h-5 mb-1" />
                <span className="text-sm font-medium">Landlord</span>
              </button>
            </div>
            {formik.touched.role && formik.errors.role && (
              <p className="mt-1.5 text-sm text-red-600">{formik.errors.role}</p>
            )}
          </div>

          {/* First Name */}
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              value={formik.values.first_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full px-4 py-3 rounded-lg border ${
                formik.touched.first_name && formik.errors.first_name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:border-propertree-green focus:ring-propertree-green'
              } focus:outline-none focus:ring-2 transition-colors`}
            />
            {formik.touched.first_name && formik.errors.first_name && (
              <p className="mt-1.5 text-sm text-red-600">{formik.errors.first_name}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              value={formik.values.last_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full px-4 py-3 rounded-lg border ${
                formik.touched.last_name && formik.errors.last_name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:border-propertree-green focus:ring-propertree-green'
              } focus:outline-none focus:ring-2 transition-colors`}
            />
            {formik.touched.last_name && formik.errors.last_name && (
              <p className="mt-1.5 text-sm text-red-600">{formik.errors.last_name}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                placeholder="+49 xxx xxx xxxx"
                value={formik.values.phone_number}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full pl-12 pr-4 py-3 rounded-lg border ${
                  formik.touched.phone_number && formik.errors.phone_number
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-propertree-green focus:ring-propertree-green'
                } focus:outline-none focus:ring-2 transition-colors`}
              />
            </div>
            {formik.touched.phone_number && formik.errors.phone_number && (
              <p className="mt-1.5 text-sm text-red-600">{formik.errors.phone_number}</p>
            )}
          </div>

          {/* Bio - Only for Landlords */}
          {formik.values.role === 'landlord' && (
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                About You as a Host <span className="text-red-500">*</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                rows="4"
                placeholder="Tell guests about yourself, your hobbies, and what makes you a great host..."
                value={formik.values.bio}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-4 py-3 rounded-lg border ${
                  formik.touched.bio && formik.errors.bio
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-propertree-green focus:ring-propertree-green'
                } focus:outline-none focus:ring-2 transition-colors resize-none`}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1.5">
                {formik.touched.bio && formik.errors.bio ? (
                  <p className="text-sm text-red-600">{formik.errors.bio}</p>
                ) : (
                  <p className="text-xs text-gray-500">This helps guests know more about their host</p>
                )}
                <p className="text-xs text-gray-400">{formik.values.bio.length}/500</p>
              </div>
            </div>
          )}

          {/* Profile Photo - Only for Landlords */}
          {formik.values.role === 'landlord' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Photo <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {/* Photo Preview */}
                <div className="flex-shrink-0">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        aria-label="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex-1">
                  <label
                    htmlFor="profile_photo"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {profilePhoto ? 'Change Photo' : 'Upload Photo'}
                  </label>
                  <input
                    id="profile_photo"
                    name="profile_photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  {photoError && (
                    <p className="mt-1.5 text-sm text-red-600">{photoError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    JPG, PNG or GIF. Max size 5MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Identity Verification - Required for Landlords */}
          {formik.values.role === 'landlord' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Identity Verification <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload a government-issued photo ID so Propertree can verify the person managing the property account.
              </p>
              <label
                htmlFor="identity_document"
                onDragOver={(event) => { event.preventDefault(); setIdentityDragging(true); }}
                onDragLeave={() => setIdentityDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIdentityDragging(false);
                  handleIdentityDocument(event.dataTransfer.files?.[0]);
                }}
                className={`block cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-colors ${identityDragging ? 'border-propertree-green bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-propertree-green'}`}
              >
                <Upload className="w-7 h-7 mx-auto text-gray-400 mb-2" />
                {identityDocument ? (
                  <>
                    <p className="text-sm font-medium text-gray-900">{identityDocument.name}</p>
                    <p className="text-xs text-green-700 mt-1">Ready for secure verification</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900">Drag and Drop Your ID Here</p>
                    <p className="text-xs text-gray-500 mt-1">or click to browse · PDF, JPG or PNG · max. 10MB</p>
                  </>
                )}
              </label>
              <input
                id="identity_document"
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={(event) => handleIdentityDocument(event.target.files?.[0])}
              />
              {identityDocument && (
                <button type="button" onClick={() => setIdentityDocument(null)} className="mt-2 text-xs text-red-600 hover:underline">
                  Remove ID Document
                </button>
              )}
              {identityError && <p className="mt-1.5 text-sm text-red-600">{identityError}</p>}
              <p className="mt-2 text-xs text-gray-500">
                Your ID is stored securely and can only be reviewed by authorized Propertree administrators.
              </p>
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full px-4 py-3 rounded-lg border ${
                formik.touched.email && formik.errors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:border-propertree-green focus:ring-propertree-green'
              } focus:outline-none focus:ring-2 transition-colors`}
            />
            {formik.touched.email && formik.errors.email && (
              <p className="mt-1.5 text-sm text-red-600">{formik.errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                  formik.touched.password && formik.errors.password
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-propertree-green focus:ring-propertree-green'
                } focus:outline-none focus:ring-2 transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="mt-1.5 text-sm text-red-600">{formik.errors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formik.isSubmitting ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-gray-900 font-semibold hover:text-propertree-green transition-colors">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
