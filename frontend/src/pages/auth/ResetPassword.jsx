/**
 * Reset Password Page
 * Reached via the link emailed by the forgot-password flow:
 * /reset-password?uid=...&token=...
 */
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Card, Input, Button, Alert } from '../../components/common';
import { Lock, ArrowLeft } from 'lucide-react';
import { authService } from '../../services';

const ResetPassword = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');
  const missingLinkData = !uid || !token;

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setError('');
        setSuccess('');

        await authService.resetPassword({ uid, token, password: values.password });
        setSuccess('Your password has been reset. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } catch (err) {
        const data = err.response?.data;
        const message =
          data?.error ||
          (Array.isArray(data?.non_field_errors) && data.non_field_errors[0]) ||
          'This reset link is invalid or has expired. Please request a new one.';
        setError(Array.isArray(message) ? message[0] : message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div>
      <Card>
        <Card.Header>
          <Card.Title className="text-center">Reset Password</Card.Title>
          <p className="text-center text-gray-600 mt-2">
            Choose a new password for your account
          </p>
        </Card.Header>

        <Card.Body>
          {missingLinkData && (
            <Alert
              type="error"
              message="This reset link is missing information. Please request a new password reset email."
              className="mb-4"
            />
          )}

          {error && <Alert type="error" message={error} className="mb-4" />}

          {success && <Alert type="success" message={success} className="mb-4" />}

          {!missingLinkData && !success && (
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.password}
                touched={formik.touched.password}
                leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.confirmPassword}
                touched={formik.touched.confirmPassword}
                leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={formik.isSubmitting}
              >
                Reset Password
              </Button>
            </form>
          )}
        </Card.Body>

        <Card.Footer>
          <Link
            to="/login"
            className="flex items-center justify-center text-sm font-medium text-rose-600 hover:text-rose-500"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to login
          </Link>
        </Card.Footer>
      </Card>
    </div>
  );
};

export default ResetPassword;
