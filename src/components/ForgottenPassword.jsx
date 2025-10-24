import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Mail, Lock, Check, AlertCircle, HelpCircle } from 'lucide-react';
import { useApi, useDetails } from './context/ContextProvider';

// Validation schemas
const emailSchema = Yup.object({
  email: Yup.string().email('Invalid email format').required('Email is required'),
});
const otpSchema = Yup.object({
  otp: Yup.string().matches(/^\d{6}$/, 'OTP must be a 6-digit number').required('OTP is required'),
});
const resetSchema = Yup.object({
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match').required('Confirm password is required'),
});

const ForgottenPassword = () => {
  const api = useApi();
  const {setErrors, setSuccess} = useDetails();
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // email, otp, secret, reset
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(null);

  // Handle email submission
  const handleEmailSubmit = async (values, { setSubmitting }) => {
    try {
      const res = await api.post(`/auth/forgot-password`, { email: values.email });
      setEmail(values.email);
      setRole(res.data.role);
      setStep(res.data.role === 'super_admin' ? 'secret' : 'otp');
      setSuccess(res.data.message || 'OTP sent to your email');
      setErrors(null);
    } catch (err) {
      console.error('Email submit error:', err.response?.data);
      setErrors(err.response?.data?.error || 'Failed to send OTP');
      setSuccess(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle OTP verification
  const handleOtpSubmit = async (values, { setSubmitting }) => {
    try {
      await api.post(`/auth/verify-otp`, { email, otp: values.otp });
      setStep('reset');
      setSuccess('OTP verified successfully');
      setErrors(null);
    } catch (err) {
      console.error('OTP verify error:', err.response?.data);
      setErrors(err.response?.data?.error || 'Invalid or expired OTP');
      setSuccess(null);
    } finally {
      setSubmitting(false);
    }
  };


  // Handle password reset
  const handleResetSubmit = async (values, { setSubmitting }) => {
    try {
      await api.patch(`/auth/reset-password`, { email, password:values.password });
      setSuccess('Password reset successfully. Redirecting to login...');
      setErrors(null);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Password reset error:', err.response?.data);
      setErrors(err.response?.data?.error || 'Failed to reset password');
      setSuccess(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">Forgot Password</h2>

        {/* Messages */}
        {/* {error && <p className="text-red-500 dark:text-red-400 mb-4 flex items-center"><AlertCircle size={16} className="mr-2" /> {error}</p>}
        {success && <p className="text-green-500 dark:text-green-400 mb-4 flex items-center"><Check size={16} className="mr-2" /> {success}</p>} */}

        {/* Step Forms */}
        {step === 'email' && (
          <Formik initialValues={{ email: '' }} validationSchema={emailSchema} onSubmit={handleEmailSubmit}>
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Registered Email</label>
                  <div className="relative">
                    <Field name="email" type="email" className="w-full p-2 pl-10 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <Mail size={20} className="absolute left-2 top-2.5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <ErrorMessage name="email" component="p" className="text-red-500 dark:text-red-400 text-sm" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-400 transition disabled:opacity-50">
                  <Mail size={16} className="mr-2" /> Send OTP
                </button>
                <button type="button" onClick={() => navigate('/login')} className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">Back to Login</button>
              </Form>
            )}
          </Formik>
        )}

        {step === 'otp' && (
          <Formik initialValues={{ otp: '' }} validationSchema={otpSchema} onSubmit={handleOtpSubmit}>
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Enter OTP</label>
                  <div className="relative">
                    <Field name="otp" type="text" className="w-full p-2 pl-10 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <Check size={20} className="absolute left-2 top-2.5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <ErrorMessage name="otp" component="p" className="text-red-500 dark:text-red-400 text-sm" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-400 transition disabled:opacity-50">
                  <Check size={16} className="mr-2" /> Verify OTP
                </button>
                <button type="button" onClick={() => setStep('email')} className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">Back to Email</button>
              </Form>
            )}
          </Formik>
        )}
        {step === 'reset' && (
          <Formik initialValues={{ password: '', confirmPassword: '' }} validationSchema={resetSchema} onSubmit={handleResetSubmit}>
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                  <div className="relative">
                    <Field name="password" type="password" className="w-full p-2 pl-10 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <Lock size={20} className="absolute left-2 top-2.5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <ErrorMessage name="password" component="p" className="text-red-500 dark:text-red-400 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                  <div className="relative">
                    <Field name="confirmPassword" type="password" className="w-full p-2 pl-10 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <Lock size={20} className="absolute left-2 top-2.5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <ErrorMessage name="confirmPassword" component="p" className="text-red-500 dark:text-red-400 text-sm" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-400 transition disabled:opacity-50">
                  <Lock size={16} className="mr-2" /> Reset Password
                </button>
                <button type="button" onClick={() => navigate('/login')} className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">Back to Login</button>
              </Form>
            )}
          </Formik>
        )}
      </div>
    </div>
  );
};

export default ForgottenPassword;
