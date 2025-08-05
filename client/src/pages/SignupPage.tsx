import React from 'react';
import { useNavigate } from 'react-router-dom';
import SignupForm from '../components/auth/SignupForm';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSignupSuccess = () => {
    navigate('/', { replace: true });
  };

  return (
    <div>
      <SignupForm onSuccess={handleSignupSuccess} />
    </div>
  );
};

export default SignupPage;