import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar, Plus, Edit2, Trash2, X, Check } from 'lucide-react';

export const ManageMenu = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // Null for Add, ID for Edit
  const [date, setDate] = useState('');
  const [day, setDay] = useState('Monday');
  const [mealType, setMealType] = useState('breakfast');
  const [foodItems, setFoodItems] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('menu')
        .select('*')
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;
      setMenus(data || []);
    } catch (err) {
      console.error('Error fetching menus:', err.message);
      setError('Failed to fetch menu items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleDateChange = (val) => {
    setDate(val);
    if (val) {
      // In JS, new Date('YYYY-MM-DD') can sometimes be off by timezone. 
      // To get the correct day name, split it or replace hyphens with slashes.
      const dateParts = val.split('-');
      const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      setDay(days[dateObj.getDay()]);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setDate('');
    setDay('Monday');
    setMealType('breakfast');
    setFoodItems('');
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleOpenEdit = (menuItem) => {
    setEditingId(menuItem.id);
    setDate(menuItem.date);
    setDay(menuItem.day);
    setMealType(menuItem.meal_type);
    setFoodItems(menuItem.food_items);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item? All related feedback will be deleted.')) return;
    setError('');
    setSuccess('');

    try {
      const { error: deleteError } = await supabase
        .from('menu')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSuccess('Menu item deleted successfully.');
      setMenus((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Error deleting menu item:', err.message);
      setError('Failed to delete menu item.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const payload = {
      date,
      day,
      meal_type: mealType,
      food_items: foodItems.trim(),
    };

    try {
      if (editingId) {
        // Edit Operation
        const { error: updateError } = await supabase
          .from('menu')
          .update(payload)
          .eq('id', editingId);

        if (updateError) {
          if (updateError.code === '23505') {
            throw new Error('A menu item for this date and meal type already exists.');
          }
          throw updateError;
        }

        setSuccess('Menu item updated successfully.');
      } else {
        // Add Operation
        const { error: insertError } = await supabase
          .from('menu')
          .insert(payload);

        if (insertError) {
          if (insertError.code === '23505') {
            throw new Error('A menu item for this date and meal type already exists.');
          }
          throw insertError;
        }

        setSuccess('Menu item added successfully.');
      }

      // Refresh and Close
      await fetchMenus();
      setTimeout(() => {
        setShowModal(false);
      }, 1000);

    } catch (err) {
      console.error('Error saving menu item:', err.message);
      setError(err.message || 'Failed to save menu item. Verify date/meal uniqueness.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Manage Mess Menu</h1>
          <p style={{ color: 'var(--text-muted)' }}>Add, edit, or remove menu options scheduled by date</p>
        </div>
        <button onClick={handleOpenAdd} className="btn" style={{ width: 'auto' }}>
          <Plus size={18} />
          <span>Add Menu Item</span>
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading menu items...</p>
        </div>
      ) : menus.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} className="empty-state-icon" />
          <h2>No Menu Items Found</h2>
          <p>There are no scheduled menu items. Click "Add Menu Item" to start scheduling.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="menu-table">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Date</th>
                <th style={{ width: '12%' }}>Day</th>
                <th style={{ width: '15%' }}>Meal Type</th>
                <th style={{ width: '43%' }}>Food Items</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((item) => (
                <tr key={item.id}>
                  <td>
                    {new Date(item.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.day}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {item.meal_type}
                    </span>
                  </td>
                  <td>{item.food_items}</td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                        title="Edit Menu Item"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                        title="Delete Menu Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal Overlay */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
                {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

                <div className="form-group">
                  <label htmlFor="menu-date">Date</label>
                  <input
                    id="menu-date"
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="menu-day">Day of the Week</label>
                  <input
                    id="menu-day"
                    type="text"
                    className="form-input"
                    value={day}
                    disabled
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Autofilled based on date selection</small>
                </div>

                <div className="form-group">
                  <label htmlFor="menu-meal">Meal Type</label>
                  <select
                    id="menu-meal"
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

                <div className="form-group">
                  <label htmlFor="menu-food">Food Items</label>
                  <textarea
                    id="menu-food"
                    className="form-textarea"
                    rows={3}
                    value={foodItems}
                    onChange={(e) => setFoodItems(e.target.value)}
                    required
                    placeholder="e.g. Idli, Sambar, Coconut Chutney, Tea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  style={{ width: 'auto' }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ width: 'auto' }}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : (
                    <>
                      <Check size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
