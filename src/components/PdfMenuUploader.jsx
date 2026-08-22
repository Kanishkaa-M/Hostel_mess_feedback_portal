import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Upload, FileText, Calendar, Check, RefreshCw, X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Set pdfjs worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'snacks', 'dinner'];

export const PdfMenuUploader = ({ isOpen, onClose, onSuccess }) => {
  const [weekStartDate, setWeekStartDate] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [rawText, setRawText] = useState('');
  const [showRawText, setShowRawText] = useState(false);

  // Matrix: { "Monday": { breakfast: '', lunch: '', snacks: '', dinner: '' }, ... }
  const [gridData, setGridData] = useState(() => {
    const initial = {};
    DAYS_OF_WEEK.forEach((d) => {
      initial[d] = { breakfast: '', lunch: '', snacks: '', dinner: '' };
    });
    return initial;
  });

  // Calculate default week start date (nearest/current Monday)
  useEffect(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today.setDate(diff));
    
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const d = String(monday.getDate()).padStart(2, '0');
    setWeekStartDate(`${year}-${month}-${d}`);
  }, []);

  if (!isOpen) return null;

  // Helper to format date string for day offset
  const getDateForDayIndex = (startDateStr, dayIndex) => {
    if (!startDateStr) return '';
    const parts = startDateStr.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() + dayIndex);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Process text extracted from PDF
  const parsePdfTextToGrid = (fullText) => {
    setRawText(fullText);
    const newGrid = {};
    DAYS_OF_WEEK.forEach((d) => {
      newGrid[d] = { breakfast: '', lunch: '', snacks: '', dinner: '' };
    });

    const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);

    let currentDay = null;
    let currentMeal = null;

    lines.forEach((line) => {
      const lower = line.toLowerCase();

      // Check if line matches day
      const foundDay = DAYS_OF_WEEK.find((d) => lower.includes(d.toLowerCase()));
      if (foundDay) {
        currentDay = foundDay;
      }

      // Check if line matches meal type
      if (lower.includes('breakfast')) currentMeal = 'breakfast';
      else if (lower.includes('lunch')) currentMeal = 'lunch';
      else if (lower.includes('snack') || lower.includes('tea')) currentMeal = 'snacks';
      else if (lower.includes('dinner') || lower.includes('supper')) currentMeal = 'dinner';

      // If text content looks like food items (not just headers)
      if (currentDay && currentMeal) {
        const isHeader =
          DAYS_OF_WEEK.some((d) => line.toLowerCase() === d.toLowerCase()) ||
          ['breakfast', 'lunch', 'snacks', 'snack', 'tea', 'dinner'].some((m) => line.toLowerCase() === m);

        if (!isHeader) {
          if (newGrid[currentDay][currentMeal]) {
            newGrid[currentDay][currentMeal] += `, ${line}`;
          } else {
            newGrid[currentDay][currentMeal] = line;
          }
        }
      }
    });

    // Fallback: If day/meal header extraction yielded sparse items, split text among days evenly
    let totalItemsFound = 0;
    DAYS_OF_WEEK.forEach((d) => {
      MEAL_TYPES.forEach((m) => {
        if (newGrid[d][m]) totalItemsFound++;
      });
    });

    if (totalItemsFound === 0 && lines.length > 0) {
      const chunkSize = Math.ceil(lines.length / 7);
      DAYS_OF_WEEK.forEach((dayName, idx) => {
        const dayLines = lines.slice(idx * chunkSize, (idx + 1) * chunkSize);
        if (dayLines.length >= 4) {
          newGrid[dayName].breakfast = dayLines[0] || '';
          newGrid[dayName].lunch = dayLines[1] || '';
          newGrid[dayName].snacks = dayLines[2] || '';
          newGrid[dayName].dinner = dayLines.slice(3).join(', ') || '';
        } else {
          newGrid[dayName].breakfast = dayLines.join(', ') || '';
        }
      });
    }

    setGridData(newGrid);
  };

  // Handle PDF file selection
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError('Please upload a valid PDF file (.pdf).');
      return;
    }

    setFileName(file.name);
    setParsing(true);
    setError('');
    setSuccessMsg('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      parsePdfTextToGrid(fullText);
      setSuccessMsg(`PDF "${file.name}" parsed successfully! Review and edit individual entries below.`);
    } catch (err) {
      console.error('PDF parsing error:', err);
      setError('Failed to extract text from PDF file. Please ensure it is a valid PDF or enter items manually.');
    } finally {
      setParsing(false);
    }
  };

  // Handle cell edit
  const handleCellChange = (dayName, mealType, value) => {
    setGridData((prev) => ({
      ...prev,
      [dayName]: {
        ...prev[dayName],
        [mealType]: value,
      },
    }));
  };

  // Clear specific cell
  const handleClearCell = (dayName, mealType) => {
    handleCellChange(dayName, mealType, '');
  };

  // Bulk Save all 28 entries
  const handleSaveWeeklyMenu = async () => {
    if (!weekStartDate) {
      setError('Please select a week start date (Monday).');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');

    const recordsToInsert = [];

    DAYS_OF_WEEK.forEach((dayName, index) => {
      const dateStr = getDateForDayIndex(weekStartDate, index);
      MEAL_TYPES.forEach((mealType) => {
        const items = gridData[dayName][mealType].trim();
        if (items) {
          recordsToInsert.push({
            date: dateStr,
            day: dayName,
            meal_type: mealType,
            food_items: items,
          });
        }
      });
    });

    if (recordsToInsert.length === 0) {
      setError('No menu items to save. Please enter food items for at least one meal.');
      setSaving(false);
      return;
    }

    try {
      const { error: upsertError } = await supabase
        .from('menu')
        .upsert(recordsToInsert, { onConflict: 'date,meal_type' });

      if (upsertError) throw upsertError;

      setSuccessMsg(`Successfully saved ${recordsToInsert.length} menu items for the week starting ${weekStartDate}!`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error saving weekly menu:', err.message);
      setError(err.message || 'Failed to save menu items to database.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText className="icon" style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Upload & Parse Weekly Mess Menu PDF</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem 0' }}>
          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          {successMsg && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{successMsg}</div>}

          {/* Configuration Header: Week Selector & PDF Upload */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="week-start" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={16} /> Select Week Start Date (Monday)
              </label>
              <input
                id="week-start"
                type="date"
                className="form-input"
                value={weekStartDate}
                onChange={(e) => setWeekStartDate(e.target.value)}
                required
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Dates for Tue–Sun will be calculated automatically based on this Monday.
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Upload size={16} /> Upload Weekly Menu PDF
              </label>
              <label
                htmlFor="pdf-input"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  border: '2px dashed var(--primary-light)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#f8fafc',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                {parsing ? (
                  <>
                    <RefreshCw size={16} className="spinner" />
                    <span>Parsing PDF...</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    <span>{fileName ? `File: ${fileName}` : 'Choose PDF File'}</span>
                  </>
                )}
              </label>
              <input
                id="pdf-input"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={parsing}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                PDF items will auto-populate the table below for review and manual editing.
              </small>
            </div>
          </div>

          {/* Toggle Raw Text view */}
          {rawText && (
            <div style={{ marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setShowRawText(!showRawText)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
              >
                {showRawText ? 'Hide extracted raw PDF text' : 'View extracted raw PDF text'}
              </button>
              {showRawText && (
                <pre style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', maxHeight: '150px', overflowY: 'auto', marginTop: '0.5rem' }}>
                  {rawText}
                </pre>
              )}
            </div>
          )}

          {/* Interactive Weekly Preview & Edit Grid */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 700 }}>
                Weekly Schedule Preview & Individual Meal Editor
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Click any cell to edit food items individually before saving.
              </span>
            </div>

            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="menu-table" style={{ fontSize: '0.85rem', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '14%', minWidth: '120px' }}>Day & Date</th>
                    <th style={{ width: '21.5%', minWidth: '180px' }}>Breakfast</th>
                    <th style={{ width: '21.5%', minWidth: '180px' }}>Lunch</th>
                    <th style={{ width: '21.5%', minWidth: '180px' }}>Snacks</th>
                    <th style={{ width: '21.5%', minWidth: '180px' }}>Dinner</th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS_OF_WEEK.map((dayName, idx) => {
                    const calculatedDate = getDateForDayIndex(weekStartDate, idx);
                    return (
                      <tr key={dayName}>
                        <td style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}>
                          <div>{dayName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                            {calculatedDate || `Day ${idx + 1}`}
                          </div>
                        </td>
                        {MEAL_TYPES.map((mealType) => (
                          <td key={mealType} style={{ padding: '0.4rem' }}>
                            <div style={{ position: 'relative' }}>
                              <textarea
                                className="form-textarea"
                                rows={2}
                                style={{
                                  fontSize: '0.82rem',
                                  padding: '0.4rem',
                                  paddingRight: '1.5rem',
                                  resize: 'vertical',
                                  borderColor: gridData[dayName][mealType] ? 'var(--primary-light)' : '#e2e8f0',
                                }}
                                value={gridData[dayName][mealType]}
                                onChange={(e) => handleCellChange(dayName, mealType, e.target.value)}
                                placeholder={`Enter ${mealType}...`}
                              />
                              {gridData[dayName][mealType] && (
                                <button
                                  type="button"
                                  onClick={() => handleClearCell(dayName, mealType)}
                                  title="Clear meal"
                                  style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: '2px',
                                  }}
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ width: 'auto' }}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveWeeklyMenu}
            className="btn"
            style={{ width: 'auto' }}
            disabled={saving || parsing}
          >
            {saving ? (
              <>
                <RefreshCw size={16} className="spinner" />
                <span>Saving Schedule...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Save Weekly Menu to Schedule</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
