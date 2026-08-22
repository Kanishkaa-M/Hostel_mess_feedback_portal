import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { StarRating } from '../components/StarRating';
import { Calendar, MessageSquare, PlusCircle, Award, Clock } from 'lucide-react';

export const StudentDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [todayMenu, setTodayMenu] = useState({
    breakfast: 'Not Scheduled',
    lunch: 'Not Scheduled',
    snacks: 'Not Scheduled',
    dinner: 'Not Scheduled',
  });
  const [overallAvgRating, setOverallAvgRating] = useState(0);
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to format JS date into YYYY-MM-DD in local time
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const todayStr = getLocalDateString();

        // 1. Fetch Today's Menu
        const { data: menuData, error: menuError } = await supabase
          .from('menu')
          .select('*')
          .eq('date', todayStr);

        if (menuError) throw menuError;

        if (menuData && menuData.length > 0) {
          const updatedMenu = { ...todayMenu };
          menuData.forEach((item) => {
            if (item.meal_type in updatedMenu) {
              updatedMenu[item.meal_type] = item.food_items;
            }
          });
          setTodayMenu(updatedMenu);
        }

        // 2. Fetch overall average rating across all feedback
        const { data: ratingData, error: ratingError } = await supabase
          .from('feedback')
          .select('rating');

        if (ratingError) throw ratingError;

        if (ratingData && ratingData.length > 0) {
          const sum = ratingData.reduce((acc, curr) => acc + curr.rating, 0);
          setOverallAvgRating(parseFloat((sum / ratingData.length).toFixed(1)));
        }

        // 3. Fetch student's own recent feedback (limit 3)
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('feedback')
          .select(`
            id,
            rating,
            comment,
            created_at,
            menu (
              date,
              meal_type,
              food_items
            )
          `)
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (feedbackError) throw feedbackError;
        setRecentFeedbacks(feedbackData || []);

      } catch (error) {
        console.error('Error loading student dashboard details:', error.message);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.id) {
      loadDashboardData();
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Welcome, {profile?.name}!</h1>
          <p style={{ color: 'var(--text-muted)' }}>Student Dashboard • Keep track of your mess ratings and menus</p>
        </div>
        <Link to="/student/give-feedback" className="btn" style={{ width: 'auto' }}>
          <PlusCircle size={18} />
          <span>Give Feedback</span>
        </Link>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{overallAvgRating > 0 ? `${overallAvgRating} / 5` : 'N/A'}</span>
            <span className="stat-label">Overall Mess Rating</span>
          </div>
          {overallAvgRating > 0 && (
            <div style={{ marginLeft: 'auto' }}>
              <StarRating rating={Math.round(overallAvgRating)} />
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Today's Menu Card */}
        <div className="card">
          <h2>
            <Calendar size={20} />
            <span>Today's Menu</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div className="meal-item">
              <span className="meal-header">Breakfast</span>
              <span className="meal-items-text">{todayMenu.breakfast}</span>
            </div>
            <div className="meal-item">
              <span className="meal-header">Lunch</span>
              <span className="meal-items-text">{todayMenu.lunch}</span>
            </div>
            <div className="meal-item">
              <span className="meal-header">Snacks</span>
              <span className="meal-items-text">{todayMenu.snacks}</span>
            </div>
            <div className="meal-item">
              <span className="meal-header">Dinner</span>
              <span className="meal-items-text">{todayMenu.dinner}</span>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link to="/student/menu" style={{ fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={16} />
              <span>View Full Weekly Menu</span>
            </Link>
          </div>
        </div>

        {/* Recent Feedback Card */}
        <div className="card">
          <h2>
            <MessageSquare size={20} />
            <span>Your Recent Feedback</span>
          </h2>
          {recentFeedbacks.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem', marginTop: '1rem' }}>
              <MessageSquare size={32} className="empty-state-icon" />
              <p>You haven't submitted any feedback yet.</p>
              <Link to="/student/give-feedback" style={{ fontSize: '0.9rem' }}>Submit your first rating</Link>
            </div>
          ) : (
            <div className="feedback-list" style={{ marginTop: '1rem' }}>
              {recentFeedbacks.map((fb) => (
                <div key={fb.id} className="feedback-card" style={{ padding: '1rem' }}>
                  <div className="feedback-card-header" style={{ marginBottom: '0.25rem' }}>
                    <div className="feedback-meta">
                      <span className="feedback-author" style={{ textTransform: 'capitalize' }}>
                        {fb.menu?.meal_type}
                      </span>
                      <span className="feedback-date-meal">
                        {fb.menu?.date ? new Date(fb.menu.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                    <StarRating rating={fb.rating} size={14} />
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <strong>Food:</strong> {fb.menu?.food_items}
                  </div>
                  {fb.comment && (
                    <p className="feedback-comment" style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>
                      "{fb.comment}"
                    </p>
                  )}
                </div>
              ))}
              <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                <Link to="/student/my-feedback" style={{ fontSize: '0.9rem' }}>
                  View All Feedback History
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
