import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SignupButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export const SignupButton: React.FC<SignupButtonProps> = ({ 
  className = '', 
  variant = 'default',
  size = 'default' 
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/signup?intent=trial');
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={className}
    >
      Start Free Trial
    </Button>
  );
};