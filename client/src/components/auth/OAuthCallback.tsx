import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { googleAuth } from '../../services/auth';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthFromOAuth } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('Processing OAuth callback...');
        const { token, error } = googleAuth.handleCallback(searchParams);
        
        // Prioritize token over error - sometimes both may be present during redirects
        if (token) {
          console.log('Token received, attempting authentication...');
          try {
            // Use the OAuth-specific auth method that handles everything including data migration
            await setAuthFromOAuth(token);
            
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            
            // Give enough time for state to update before redirect
            setTimeout(() => {
              console.log('Redirecting to home page...');
              navigate('/', { replace: true });
            }, 1500);
          } catch (authError) {
            console.error('OAuth authentication error:', authError);
            setStatus('error');
            setMessage('Failed to complete authentication. Please try again.');
          }
        } else if (error) {
          console.log('Error received from OAuth:', error);
          setStatus('error');
          setMessage(getErrorMessage(error));
        } else {
          console.log('No token or error received');
          // Give a bit more time in case this is a timing issue
          setTimeout(() => {
            if (status === 'loading') {
              setStatus('error');
              setMessage('Authentication timeout. Please try again.');
            }
          }, 3000);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred during authentication.');
      }
    };

    // Add a small delay to prevent race conditions
    const timer = setTimeout(processCallback, 100);
    return () => clearTimeout(timer);
  }, [searchParams, navigate, setAuthFromOAuth, status]);

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'oauth_failed':
        return 'Google authentication failed. Please try again.';
      case 'token_failed':
        return 'Failed to generate authentication token. Please try again.';
      default:
        return `Authentication error: ${error}`;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Processing Authentication
              </h1>
              <p className="text-gray-600">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Successful!
              </h1>
              <p className="text-gray-600">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Failed
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/auth/login')}
                  className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Continue Without Account
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;