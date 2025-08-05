import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import GoogleLoginButton from './GoogleLoginButton';

interface SignupFormProps {
  onSuccess?: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSuccess }) => {
  const { signup, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      await signup({
        name: formData.name || undefined,
        email: formData.email,
        password: formData.password,
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen pt-7 pb-7 flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 page-transition">
      {/* Back to Chat Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-700 hover:text-primary-700 smooth-transition font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Chat
      </Link>
      
      <div className="w-full max-w-md mx-auto px-8 opacity-0 animate-[fadeInUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <div className="text-center mb-5">
          <h1 className="text-3xl font-bold text-primary-700 mb-3">
            Welcome to <span className="text-primary-600">Chat with Your Notes</span>
          </h1>
          <p className="text-gray-600 text-md">
            Create your account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100/50 border border-red-300/50 rounded-2xl text-red-700 text-sm backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name (Optional)
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-4 bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none transition-all text-gray-800 placeholder-gray-500 shadow-sm"
                placeholder="Enter your full name"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-4 bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none transition-all text-gray-800 placeholder-gray-500 shadow-sm"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-12 pr-12 py-4 bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none transition-all text-gray-800 placeholder-gray-500 shadow-sm"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters long</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full pl-12 pr-12 py-4 bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none transition-all text-gray-800 placeholder-gray-500 shadow-sm"
                placeholder="Confirm your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-start">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 rounded border-gray-400 text-primary-600 focus:ring-primary-500/50 focus:ring-offset-0 mt-1"
              disabled={isLoading}
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              I agree to the{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                Privacy Policy
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <UserPlus className="h-5 w-5" />
            )}
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-400/30" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-br from-primary-100 to-primary-200 text-gray-600">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <GoogleLoginButton disabled={isLoading} />
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              to="/auth/login"
              className="text-primary-600 hover:text-primary-700 font-semibold smooth-transition"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;