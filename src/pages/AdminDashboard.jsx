import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { StarRating } from '../components/StarRating';
import { MessageSquare, Award, AlertTriangle, Users, PlusCircle, LayoutGrid } from 'lucide-react';

export const AdminDashboard = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    todayAverage: 0,
    lowRatedCount: 0,
  });
  const [mealAverages, setMealAverages] = useState({
    breakfast: { sum: 0, count: 0, avg: 0 },
    lunch: { sum: 0, count: 0, avg: 0 },
    snacks: { sum: 0, count: 0, avg: 0 },
    dinner: { sum: 0, count: 0, avg: 0 },
  });
  const [loading, setLoading] = useState(true);

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
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
            ),
            profiles (
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const allFeedbacks = data || [];
        setFeedbacks(allFeedbacks);

        // Calculate statistics
        const todayStr = getLocalDateString();
        let totalSum = 0;
        let todaySum = 0;
        let todayCount = 0;
        let lowCount = 0;

        const meals = {
          breakfast: { sum: 0, count: 0 },
          lunch: { sum: 0, count: 0 },
          snacks: { sum: 0, count: 0 },
          dinner: { sum: 0, count: 0 },
        };

        allFeedbacks.forEach((fb) => {
          const rating = fb.rating;
          totalSum += rating;

          // Check if it's today
          if (fb.menu?.date === todayStr) {
            todaySum += rating;
            todayCount++;
          }

          // Check if low rated
          if (rating <= 2) {
            lowCount++;
          }

          // Group by meal type
          const mType = fb.menu?.meal_type;
          if (mType && mType in meals) {
            meals[mType].sum += rating;
            meals[mType].count++;
          }
        });

        const totalFeedback = allFeedbacks.length;
        const overallAverage = totalFeedback > 0 ? (totalSum / totalFeedback).toFixed(1) : 0;
        const todayAverageVal = todayCount > 0 ? (todaySum / todayCount).toFixed(1) : 0;

        setStats({
          total: totalFeedback,
          average: parseFloat(overallAverage),
          todayAverage: parseFloat(todayAverageVal),
          lowRatedCount: lowCount,
        });

        // Compute averages per meal type
        const updatedMealAverages = {};
        Object.keys(meals).forEach((key) => {
          const count = meals[key].count;
          const avg = count > 0 ? parseFloat((meals[key].sum / count).toFixed(1)) : 0;
          updatedMealAverages[key] = {
            count,
            avg,
          };
        });
        setMealAverages(updatedMealAverages);

      } catch (err) {
        console.error('Error fetching admin dashboard statistics:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading admin stats...</p>
      </div>
    );
  }

  // Get common complaints (rating <= 2)
  const complaints = feedbacks.filter((fb) => fb.rating <= 2).slice(0, 5);
  // Get recent feedback (limit 5)
  const recentFeedbackList = feedbacks.slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time statistics and hostel mess insights</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/admin/menu" className="btn" style={{ width: 'auto' }}>
            <PlusCircle size={18} />
            <span>Manage Menu</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Feedbacks</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.average > 0 ? `${stats.average} / 5` : 'N/A'}</span>
            <span className="stat-label">Overall Average</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <LayoutGrid size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.todayAverage > 0 ? `${stats.todayAverage} / 5` : 'N/A'}</span>
            <span className="stat-label">Today's Average</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon danger">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.lowRatedCount}</span>
            <span className="stat-label">Low Rated Meals (≤2★)</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Meal Type Performance Chart */}
        <div className="card">
          <h2>Meal Type Ratings</h2>
          <div className="rating-bar-container" style={{ marginTop: '1.5rem' }}>
            {Object.keys(mealAverages).map((mealKey) => {
              const { count, avg } = mealAverages[mealKey];
              // Percentage calculation for rating progress bar: 5 stars is 100%
              const percentage = (avg / 5) * 100;

              return (
                <div key={mealKey} className="rating-bar-item">
                  <span className="rating-bar-label">{mealKey}</span>
                  <div className="rating-bar-wrapper">
                    <div className="rating-bar-fill" style={{ width: `${percentage}%` }}></div>
                  </div>
                  <span className="rating-bar-value">
                    <span>★ {avg > 0 ? avg : 'N/A'}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                      ({count})
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Common Complaints */}
        <div className="card">
          <h2>
            <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
            <span>Common Complaints / Low Ratings</span>
          </h2>
          {complaints.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem', marginTop: '1rem', borderStyle: 'solid' }}>
              <p style={{ color: 'var(--success)', fontWeight: 600 }}>No complaints! All meals are rated 3 stars or above.</p>
            </div>
          ) : (
            <div className="feedback-list" style={{ marginTop: '1rem' }}>
              {complaints.map((fb) => (
                <div key={fb.id} className="feedback-card" style={{ borderColor: '#fca5a5', backgroundColor: '#fff5f5', padding: '0.85rem' }}>
                  <div className="feedback-card-header" style={{ marginBottom: '0.25rem' }}>
                    <div className="feedback-meta">
                      <span className="feedback-author">{fb.profiles?.name || 'Student'}</span>
                      <span className="feedback-date-meal">
                        {fb.menu?.meal_type} • {fb.menu?.date ? new Date(fb.menu.date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <StarRating rating={fb.rating} size={14} />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <strong>Food:</strong> {fb.menu?.food_items}
                  </div>
                  {fb.comment && (
                    <p className="feedback-comment" style={{ borderLeftColor: '#fca5a5', fontSize: '0.85rem' }}>
                      "{fb.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Feedback Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>
            <MessageSquare size={20} />
            <span>Recent Student Feedback</span>
          </h2>
          <Link to="/admin/feedback" style={{ fontSize: '0.9rem' }}>View All Feedback</Link>
        </div>
        {recentFeedbackList.length === 0 ? (
          <div className="empty-state">
            <p>No feedback received yet.</p>
          </div>
        ) : (
          <div className="feedback-list">
            {recentFeedbackList.map((fb) => (
              <div key={fb.id} className="feedback-card">
                <div className="feedback-card-header">
                  <div className="feedback-meta">
                    <span className="feedback-author">{fb.profiles?.name || 'Student'}</span>
                    <span className="feedback-date-meal">
                      {fb.menu?.meal_type} • {fb.menu?.date ? new Date(fb.menu.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                  <StarRating rating={fb.rating} size={16} />
                </div>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  <strong>Food Item:</strong> {fb.menu?.food_items}
                </div>
                {fb.comment && <p className="feedback-comment">"{fb.comment}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
