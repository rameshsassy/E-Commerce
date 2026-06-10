import React from 'react';
import { X, Lock, UserPlus, LogIn } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOpen) return null;

  const handleNavigation = (path) => {
    onClose();
    navigate(path, { state: { from: location } });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface border border-glass-border rounded-3xl p-8 max-w-sm w-full relative shadow-2xl scale-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-white bg-black/20 p-2 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Sign In Required</h2>
          <p className="text-text-muted text-sm">Please Signup/Login to continue shopping and add items to your cart.</p>
        </div>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => handleNavigation('/login')}
            className="btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
          >
            <LogIn size={20} /> Login Now
          </button>
          
          <button 
            onClick={() => handleNavigation('/register')}
            className="btn btn-secondary w-full py-4 text-lg flex items-center justify-center gap-2 hover:border-text-muted transition-colors"
          >
            <UserPlus size={20} /> Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
