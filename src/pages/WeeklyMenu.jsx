import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export const WeeklyMenu = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(null);
  const [weekDays, setWeekDays] = useState([]);
  const [menuItems, setMenuItems] = useState({});
  const [loading, setLoading] = useState(true);

  // Get the Monday of the week for a given date
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(date.setDate(diff));
  };

  // Generate 7 days starting from a given Monday
  const generateWeekDays = (monday) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  };

  // Format date to local YYYY-MM-DD
  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize to current week's Monday
  useEffect(() => {
    const today = new Date();
    const monday = getMonday(today);
    setCurrentWeekStart(monday);
  }, []);

  // Update week days list whenever currentWeekStart changes
  useEffect(() => {
    if (currentWeekStart) {
      setWeekDays(generateWeekDays(currentWeekStart));
    }
  }, [currentWeekStart]);

  // Fetch menu data for the current weekDays
  useEffect(() => {
    const fetchWeekMenu = async () => {
      if (weekDays.length === 0) return;
      setLoading(true);

      const dateStrings = weekDays.map((d) => formatDateString(d));

      try {
        const { data, error } = await supabase
          .from('menu')
          .select('*')
          .in('date', dateStrings);

        if (error) throw error;

        // Group menu items by date and then meal_type
        const grouped = {};
        dateStrings.forEach((dStr) => {
          grouped[dStr] = {
            breakfast: 'Not Scheduled',
            lunch: 'Not Scheduled',
            snacks: 'Not Scheduled',
            dinner: 'Not Scheduled',
          };
        });

        if (data) {
          data.forEach((item) => {
            if (grouped[item.date]) {
              grouped[item.date][item.meal_type] = item.food_items;
            }
          });
        }

        setMenuItems(grouped);
      } catch (err) {
        console.error('Error fetching weekly menu:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeekMenu();
  }, [weekDays]);

  // Pagination Handlers
  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  const handleCurrentWeek = () => {
    const today = new Date();
    setCurrentWeekStart(getMonday(today));
  };

  const getWeekRangeLabel = () => {
    if (weekDays.length === 0) return '';
    const start = weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const end = weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Weekly Mess Menu</h1>
          <p style={{ color: 'var(--text-muted)' }}>Browse meals scheduled for this week</p>
        </div>

        <div className="page-actions" style={{ alignItems: 'center' }}>
          <button onClick={handlePrevWeek} className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem' }}>
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', minWidth: '180px', textAlign: 'center' }}>
            {getWeekRangeLabel()}
          </span>
          <button onClick={handleNextWeek} className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem' }}>
            <ChevronRight size={20} />
          </button>
          <button onClick={handleCurrentWeek} className="btn btn-secondary" style={{ width: 'auto', fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
            <RefreshCw size={16} style={{ marginRight: '0.25rem' }} />
            <span>Today's Week</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading weekly menu...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-container" style={{ display: 'none', display: 'block' }}>
            <table className="menu-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Day / Date</th>
                  <th style={{ width: '21%' }}>Breakfast</th>
                  <th style={{ width: '21%' }}>Lunch</th>
                  <th style={{ width: '21%' }}>Snacks</th>
                  <th style={{ width: '21%' }}>Dinner</th>
                </tr>
              </thead>
              <tbody>
                {weekDays.map((dayObj) => {
                  const dateStr = formatDateString(dayObj);
                  const meals = menuItems[dateStr] || {
                    breakfast: 'Not Scheduled',
                    lunch: 'Not Scheduled',
                    snacks: 'Not Scheduled',
                    dinner: 'Not Scheduled',
                  };
                  const isToday = formatDateString(new Date()) === dateStr;

                  return (
                    <tr key={dateStr} style={{ backgroundColor: isToday ? 'var(--primary-light)' : 'transparent' }}>
                      <td>
                        <div style={{ fontWeight: 700, color: isToday ? 'var(--primary)' : 'var(--text-main)' }}>
                          {dayObj.toLocaleDateString(undefined, { weekday: 'long' })}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {dayObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        {isToday && (
                          <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--primary)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '0.25rem', display: 'inline-block' }}>
                            TODAY
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ color: meals.breakfast === 'Not Scheduled' ? 'var(--text-muted)' : 'var(--text-main)', fontStyle: meals.breakfast === 'Not Scheduled' ? 'italic' : 'normal' }}>
                          {meals.breakfast}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: meals.lunch === 'Not Scheduled' ? 'var(--text-muted)' : 'var(--text-main)', fontStyle: meals.lunch === 'Not Scheduled' ? 'italic' : 'normal' }}>
                          {meals.lunch}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: meals.snacks === 'Not Scheduled' ? 'var(--text-muted)' : 'var(--text-main)', fontStyle: meals.snacks === 'Not Scheduled' ? 'italic' : 'normal' }}>
                          {meals.snacks}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: meals.dinner === 'Not Scheduled' ? 'var(--text-muted)' : 'var(--text-main)', fontStyle: meals.dinner === 'Not Scheduled' ? 'italic' : 'normal' }}>
                          {meals.dinner}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (Responsive styles in index.css handle visibility/grid) */}
          <div className="menu-grid" style={{ display: 'none' /* Will be displayed via css query if needed, but since we are simple we render the table which handles scroll. But providing a mobile view helper is great! */ }}>
          </div>
        </>
      )}
    </div>
  );
};
