import React, { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const HelpfulReviewButton = ({ reviewId, initialVotes = [], productId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [votes, setVotes] = useState(initialVotes);
  const [loading, setLoading] = useState(false);

  const hasVoted = user ? votes.includes(user._id) : false;

  const handleVote = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/products/${productId}/reviews/${reviewId}/helpful`);
      
      if (hasVoted) {
        setVotes(votes.filter(id => id !== user._id));
      } else {
        setVotes([...votes, user._id]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleVote}
      disabled={loading}
      className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-colors border ${
        hasVoted 
          ? 'bg-primary/20 text-primary border-primary/30' 
          : 'bg-surface hover:bg-surface-hover text-text-muted hover:text-text border-glass-border'
      }`}
    >
      <ThumbsUp size={14} className={hasVoted ? 'fill-primary' : ''} />
      {votes.length > 0 ? `Helpful (${votes.length})` : 'Helpful'}
    </button>
  );
};

export default HelpfulReviewButton;
