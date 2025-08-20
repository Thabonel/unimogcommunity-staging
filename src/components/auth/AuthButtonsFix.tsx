import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, ChevronRight } from 'lucide-react';

export const AuthButtons: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <User className="h-4 w-4" />
          Dashboard
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/login')}
      >
        Sign In
      </Button>
      <Button
        size="sm"
        onClick={() => navigate('/signup?intent=trial')}
        className="bg-military-green hover:bg-military-green/90 flex items-center gap-2"
      >
        Start Free Trial
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Export individual buttons for flexibility
export const SignUpButton: React.FC<{ className?: string }> = ({ className }) => {
  const navigate = useNavigate();
  
  return (
    <Button
      onClick={() => navigate('/signup?intent=trial')}
      className={`bg-military-green hover:bg-military-green/90 ${className || ''}`}
    >
      Start Free Trial
    </Button>
  );
};

export const SignInButton: React.FC<{ className?: string }> = ({ className }) => {
  const navigate = useNavigate();
  
  return (
    <Button
      variant="outline"
      onClick={() => navigate('/login')}
      className={className}
    >
      Sign In
    </Button>
  );
};