import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { StarRating } from '../components/StarRating';
import { Send, AlertTriangle } from 'lucide-react';

export const GiveFeedback = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to format JS date into YYYY-MM-DD
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getLocalDateString());
  const [mealType, setMealType] = useState('lunch');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const [menuItem, setMenuItem] = useState(null);
  const [feedbackExists, setFeedbackExists] = useState(false);
  const [menuCheckLoading, setMenuCheckLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check if menu item exists and if feedback was already submitted
  useEffect(() => {
    const verifyMealAndFeedback = async () => {
      if (!profile?.id || !date || !mealType) return;

      setMenuCheckLoading(true);
      setError('');
      setMenuItem(null);
      setFeedbackExists(false);

      try {
        // 1. Fetch menu item for specified date and meal
        const { data: menuData, error: menuError } = await supabase
          .from('menu')
          .select('id, food_items')
          .eq('date', date)
          .eq('meal_type', mealType)
          .maybeSingle();

        if (menuError) throw menuError;

        if (!menuData) {
          setMenuItem(null);
          return;
        }

        setMenuItem(menuData);

        // 2. Check if student already gave feedback for this menu item
        const { data: fbData, error: fbError } = await supabase
          .from('feedback')
          .select('id')
          .eq('user_id', profile.id)
          .eq('menu_id', menuData.id)
          .maybeSingle();

        if (fbError) throw fbError;

        if (fbData) {
          setFeedbackExists(true);
        }
      } catch (err) {
        console.error('Error verifying meal context:', err.message);
        setError('Error verifying meal schedule.');
      } finally {
        setMenuCheckLoading(false);
      }
    };

    verifyMealAndFeedback();
  }, [date, mealType, profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!menuItem) {
      setError('Cannot submit feedback: No menu scheduled for this meal.');
      return;
    }

    if (feedbackExists) {
      setError('Cannot submit feedback: You have already submitted feedback for this meal.');
      return;
    }

    if (rating === 0) {
      setError('Please select a star rating (1-5 stars).');
      return;
    }

    setSubmitting(true);

    try {
      const { error: insertError } = await supabase.from('feedback').insert({
        user_id: profile.id,
        menu_id: menuItem.id,
        rating,
        comment: comment.trim(),
      });

      if (insertError) throw insertError;

      setSuccess('Feedback submitted successfully!');
      setComment('');
      setRating(0);
      setFeedbackExists(true); // Prevent further submits immediately

      setTimeout(() => {
        navigate('/student/my-feedback');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1>Give Meal Feedback</h1>
          <p style={{ color: 'var(--text-muted)' }}>Share your thoughts on today's or previous meals</p>
        </div>
      </div>

      <div className="card">
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="feedback-date">Select Date</label>
            <input
              id="feedback-date"
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="feedback-meal">Select Meal Type</label>
            <select
              id="feedback-meal"
              className="form-select"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              required
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="snacks">Snacks</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>

          {/* Validation Status Area */}
          <div style={{ marginBottom: '1.5rem' }}>
            {menuCheckLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <div className="spinner" style={{ width: '16px', height: '16px', borderSize: '2px' }}></div>
                <span>Checking menu schedule...</span>
              </div>
            ) : !menuItem ? (
              <div className="alert alert-error" style={{ margin: 0, padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} />
                <span>No menu is scheduled for this meal on this day. You cannot submit feedback.</span>
              </div>
            ) : feedbackExists ? (
              <div className="alert alert-error" style={{ margin: 0, padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} />
                <span>You have already submitted feedback for this meal ({menuItem.food_items}). Double submissions are not allowed.</span>
              </div>
            ) : (
              <div className="alert alert-success" style={{ margin: 0, padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                <div style={{ fontWeight: 600 }}>Scheduled Menu Item:</div>
                <div style={{ fontStyle: 'italic' }}>{menuItem.food_items}</div>
              </div>
            )}
          </div>

          <div className="form-group" style={{ pointerEvents: (!menuItem || feedbackExists) ? 'none' : 'auto', opacity: (!menuItem || feedbackExists) ? 0.5 : 1 }}>
            <label>Meal Rating</label>
            <div style={{ padding: '0.5rem 0' }}>
              <StarRating rating={rating} onChange={setRating} size={32} />
            </div>
          </div>

          <div className="form-group" style={{ pointerEvents: (!menuItem || feedbackExists) ? 'none' : 'auto', opacity: (!menuItem || feedbackExists) ? 0.5 : 1 }}>
            <label htmlFor="feedback-comment">Comments / Short Feedback</label>
            <textarea
              id="feedback-comment"
              className="form-textarea"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. The rice was well cooked but the sambar was spicy."
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={submitting || !menuItem || feedbackExists || rating === 0}
          >
            {submitting ? (
              'Submitting...'
            ) : (
              <>
                <Send size={18} />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
