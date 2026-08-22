import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { StarRating } from '../components/StarRating';
import { MessageSquare, Calendar, Trash2 } from 'lucide-react';

export const MyFeedback = () => {
  const { profile } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('feedback')
        .select(`
          id,
          rating,
          comment,
          created_at,
          menu (
            date,
            day,
            meal_type,
            food_items
          )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setFeedbacks(data || []);
    } catch (err) {
      console.error('Error fetching feedbacks:', err.message);
      setError('Could not load your feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchMyFeedback();
    }
  }, [profile]);

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('feedback')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Update local state
      setFeedbacks((prev) => prev.filter((fb) => fb.id !== id));
    } catch (err) {
      console.error('Error deleting feedback:', err.message);
      alert('Failed to delete feedback. Please try again.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Feedback History</h1>
          <p style={{ color: 'var(--text-muted)' }}>Review all ratings and comments you've submitted</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your feedback history...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="empty-state">
          <MessageSquare size={48} className="empty-state-icon" />
          <h2>No Feedback Found</h2>
          <p>You haven't submitted any feedback yet. Go to the "Give Feedback" page to rate your meals.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {feedbacks.map((fb) => (
            <div key={fb.id} className="feedback-card" style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {fb.menu?.meal_type}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} />
                    {fb.menu?.date ? new Date(fb.menu.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                  </span>
                </div>

                <div style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                  <strong>Food Item:</strong> {fb.menu?.food_items || 'N/A'}
                </div>

                {fb.comment ? (
                  <p className="feedback-comment">
                    "{fb.comment}"
                  </p>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    No comment provided.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', minWidth: '120px' }}>
                <StarRating rating={fb.rating} size={18} />
                <button
                  onClick={() => handleDeleteFeedback(fb.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.85rem',
                    marginTop: '1rem',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
