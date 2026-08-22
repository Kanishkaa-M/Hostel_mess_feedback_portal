import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { StarRating } from '../components/StarRating';
import { MessageSquare, Download, Filter, RefreshCcw } from 'lucide-react';
import { jsPDF } from 'jspdf';

export const ViewFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters State
  const [filterRating, setFilterRating] = useState('all');
  const [filterMealType, setFilterMealType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAllFeedback = async () => {
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
          ),
          profiles (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setFeedbacks(data || []);
      setFilteredFeedbacks(data || []);
    } catch (err) {
      console.error('Error fetching student feedback:', err.message);
      setError('Failed to load feedback records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFeedback();
  }, []);

  // Apply filters whenever state changes
  useEffect(() => {
    let result = feedbacks;

    // Filter by Rating
    if (filterRating !== 'all') {
      const ratingVal = parseInt(filterRating, 10);
      result = result.filter((fb) => fb.rating === ratingVal);
    }

    // Filter by Meal Type
    if (filterMealType !== 'all') {
      result = result.filter((fb) => fb.menu?.meal_type === filterMealType);
    }

    if (filterDate) {
      result = result.filter((fb) => fb.menu?.date === filterDate);
    }

    // Search query (student name or food item or comment)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (fb) =>
          fb.profiles?.name?.toLowerCase().includes(query) ||
          fb.menu?.food_items?.toLowerCase().includes(query) ||
          fb.comment?.toLowerCase().includes(query)
      );
    }

    setFilteredFeedbacks(result);
  }, [filterRating, filterMealType, filterDate, searchQuery, feedbacks]);

  const handleResetFilters = () => {
    setFilterRating('all');
    setFilterMealType('all');
    setFilterDate('');
    setSearchQuery('');
  };

  const formatDate = (date) => (date ? new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'Unknown date');

  const downloadFeedbackPdf = (entries, title, fileName) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 16;
    let y = 20;

    const addText = (text, options = {}) => {
      const lines = pdf.splitTextToSize(String(text), pageWidth - margin * 2);
      if (y + lines.length * 6 > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(lines, margin, y, options);
      y += lines.length * 6;
    };

    pdf.setFontSize(18);
    addText(title);
    pdf.setFontSize(10);
    addText(`Generated on ${new Date().toLocaleString()}`);
    y += 4;

    entries.forEach((fb, index) => {
      if (y > pageHeight - 45) {
        pdf.addPage();
        y = margin;
      }
      pdf.setFontSize(12);
      addText(`${index + 1}. ${fb.profiles?.name || 'Anonymous Student'} - ${fb.rating}/5 stars`);
      pdf.setFontSize(10);
      addText(`Date: ${formatDate(fb.menu?.date)} | Meal: ${fb.menu?.meal_type || 'N/A'}`);
      addText(`Food items: ${fb.menu?.food_items || 'N/A'}`);
      addText(`Comment: ${fb.comment || 'No comment left.'}`);
      y += 4;
    });

    pdf.save(fileName);
  };

  const handleDownloadDay = () => {
    if (!filterDate) return;
    const dayFeedbacks = feedbacks.filter((fb) => fb.menu?.date === filterDate);
    downloadFeedbackPdf(dayFeedbacks, `Feedback Report - ${formatDate(filterDate)}`, `feedback-${filterDate}.pdf`);
  };

  const handleDownloadIndividual = (fb) => {
    const date = fb.menu?.date || 'feedback';
    downloadFeedbackPdf([fb], 'Individual Feedback Report', `feedback-${fb.id || date}.pdf`);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Student Feedback Log</h1>
          <p style={{ color: 'var(--text-muted)' }}>Browse and filter through all submitted ratings and comments</p>
        </div>
        <button onClick={fetchAllFeedback} className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
          <RefreshCcw size={16} style={{ marginRight: '0.25rem' }} />
          <span>Reload</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="filter-item">
          <label htmlFor="filter-rating" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
            Filter by Rating
          </label>
          <select
            id="filter-rating"
            className="form-select"
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            style={{ padding: '0.5rem' }}
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="filter-meal" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
            Filter by Meal Type
          </label>
          <select
            id="filter-meal"
            className="form-select"
            value={filterMealType}
            onChange={(e) => setFilterMealType(e.target.value)}
            style={{ padding: '0.5rem' }}
          >
            <option value="all">All Meals</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="snacks">Snacks</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="filter-date" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
            Select Day
          </label>
          <input
            id="filter-date"
            type="date"
            className="form-input"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{ padding: '0.5rem' }}
          />
        </div>

        <div className="filter-item" style={{ flex: 2 }}>
          <label htmlFor="filter-search" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
            Search
          </label>
          <input
            id="filter-search"
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, food item, or comment..."
            style={{ padding: '0.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={handleResetFilters}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Filter size={16} />
            <span>Reset</span>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={handleDownloadDay}
            className="btn"
            disabled={!filterDate || feedbacks.every((fb) => fb.menu?.date !== filterDate)}
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            title="Select a day to download all its feedback"
          >
            <Download size={16} />
            <span>Download Day PDF</span>
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading feedback records...</p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="empty-state">
          <MessageSquare size={48} className="empty-state-icon" />
          <h2>No Feedback Records Found</h2>
          <p>
            {feedbacks.length === 0
              ? "Students haven't submitted any feedback yet."
              : 'No feedback items match your selected filter criteria.'}
          </p>
          {(filterRating !== 'all' || filterMealType !== 'all' || searchQuery !== '') && (
            <button onClick={handleResetFilters} className="btn" style={{ width: 'auto', marginTop: '0.5rem' }}>
              Clear Active Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
            <span>Showing {filteredFeedbacks.length} feedback entries</span>
          </div>

          {filteredFeedbacks.map((fb) => (
            <div key={fb.id} className="feedback-card">
              <div className="feedback-card-header">
                <div className="feedback-meta">
                  <span className="feedback-author" style={{ fontSize: '1.05rem' }}>
                    {fb.profiles?.name || 'Anonymous Student'}
                  </span>
                  <span className="feedback-date-meal">
                    {fb.menu?.meal_type} •{' '}
                    {fb.menu?.date
                      ? new Date(fb.menu.date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <StarRating rating={fb.rating} size={16} />
                  <button
                    onClick={() => handleDownloadIndividual(fb)}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'auto' }}
                    title="Download this feedback as a PDF"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <strong>Food Items Served:</strong> {fb.menu?.food_items || 'N/A'}
              </div>

              {fb.comment ? (
                <p className="feedback-comment" style={{ marginTop: '0.75rem' }}>
                  "{fb.comment}"
                </p>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', marginTop: '0.5rem' }}>
                  No comment left.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
