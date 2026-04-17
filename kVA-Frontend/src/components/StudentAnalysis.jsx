import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Modal Component
const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

// Weekly Calendar Component - Updated to be smaller and inline
const WeeklyCalendar = ({ selectedDate, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  
  // Get the first day of the month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  // Get the last day of the month
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Get the number of days in the month
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Get the day of the week for the first day
  const firstDayOfWeek = firstDayOfMonth.getDay();
  
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  // Get week number for a date
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };
  
  // Handle date selection
  const handleDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    onDateSelect(newDate);
  };
  
  // Generate calendar days
  const renderCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
      
      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          {day}
        </div>
      );
    }
    
    return days;
  };
  
  return (
    <div className="weekly-calendar inline">
      <div className="calendar-header">
        <button className="nav-btn" onClick={prevMonth}>&lt;</button>
        <h5>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h5>
        <button className="nav-btn" onClick={nextMonth}>&gt;</button>
      </div>
      
      <div className="calendar-weekdays">
        {dayNames.map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>
      
      <div className="calendar-days">
        {renderCalendarDays()}
      </div>
      
      {selectedDate && (
        <div className="selected-week-info">
          Week {getWeekNumber(selectedDate)}
        </div>
      )}
    </div>
  );
};

// Student Form Component
const StudentForm = ({ 
  newStudent, 
  setNewStudent, 
  classLevels, 
  handleAddStudent, 
  newPerformance,
  handleSubjectChange,
  handleMonthlyTestChange,
  handleWeeklyTestChange,
  addMonthlyTest,
  addWeeklyTest,
  removeMonthlyTest,
  removeWeeklyTest,
  loading
}) => {
  const [selectedWeekDate, setSelectedWeekDate] = useState(null);

  const handleWeekDateSelect = (date) => {
    setSelectedWeekDate(date);
    const weekNumber = Math.ceil(((date - new Date(date.getFullYear(), 0, 1)) / 86400000 + new Date(date.getFullYear(), 0, 1).getDay() + 1) / 7);
    handleWeeklyTestChange(0, 'week', `Week ${weekNumber}`);
  };

  return (
    <div className="add-edit-forms">
      <div className="card">
        <h2 className="bounce-in">Add New Student</h2>
        
        <div className="filter-section">
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={newStudent.name}
                onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                placeholder="Enter student name"
              />
            </div>
            <div className="form-group">
              <label>Class</label>
              <input 
                type="text" 
                value={newStudent.class}
                onChange={(e) => setNewStudent({...newStudent, class: e.target.value})}
                placeholder="e.g. 10th A"
              />
            </div>
            <div className="form-group">
              <label>Class Level</label>
              <select
                value={newStudent.level}
                onChange={(e) => setNewStudent({...newStudent, level: e.target.value})}
              >
                <option value="">Select level...</option>
                {classLevels.map(level => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Join Date</label>
              <input 
                type="date" 
                value={newStudent.joinDate}
                onChange={(e) => setNewStudent({...newStudent, joinDate: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Roll Number</label>
              <input 
                type="text" 
                value={newStudent.rollNumber}
                onChange={(e) => setNewStudent({...newStudent, rollNumber: e.target.value})}
                placeholder="e.g. KVA001"
              />
            </div>
          </div>
        </div>

        <h3>Subject-wise Performance</h3>
        <div className="subject-form-grid">
          {newPerformance.subjects.map((subject, index) => (
            <div key={index} className="subject-card">
              <h4>{subject.name}</h4>
              <div className="subject-stats">
                <div className="stat">
                  <span className="label">Score:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={subject.score}
                    onChange={(e) => handleSubjectChange(index, 'score', e.target.value)}
                    placeholder="0-100"
                    className="value-input"
                  />
                </div>
                <div className="stat">
                  <span className="label">Last Test:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={subject.lastTest}
                    onChange={(e) => handleSubjectChange(index, 'lastTest', e.target.value)}
                    placeholder="0-100"
                    className="value-input"
                  />
                </div>
                <div className="stat">
                  <span className="label">Grade:</span>
                  <span className="value">{subject.grade}</span>
                </div>
                <div className="stat">
                  <span className="label">Performance:</span>
                  <span 
                    className="value performance-badge"
                    style={{ 
                      backgroundColor: subject.performance === 'strong' ? '#2e7d2e' : 
                                     subject.performance === 'average' ? '#ff9800' : '#f44336'
                    }}
                  >
                    {subject.performance}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h3>Weekly Test Results</h3>
        <div className="weekly-calendar-container">
          <h4>Select Week for Test</h4>
          <WeeklyCalendar 
            selectedDate={selectedWeekDate} 
            onDateSelect={handleWeekDateSelect} 
          />
        </div>
        
        {newPerformance.weeklyTests.map((test, index) => (
          <div key={index} className="test-form-card weekly-test">
            <div className="form-group">
              <label>Week</label>
              <input
                type="text"
                value={test.week}
                onChange={(e) => handleWeeklyTestChange(index, 'week', e.target.value)}
                placeholder="e.g. Week 1"
              />
            </div>
            <div className="test-scores-grid">
              <div className="form-group">
                <label>Math</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={test.math}
                  onChange={(e) => handleWeeklyTestChange(index, 'math', e.target.value)}
                  placeholder="Score"
                />
              </div>
              <div className="form-group">
                <label>Physics</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={test.physics}
                  onChange={(e) => handleWeeklyTestChange(index, 'physics', e.target.value)}
                  placeholder="Score"
                />
              </div>
              <div className="form-group">
                <label>Chemistry</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={test.chemistry}
                  onChange={(e) => handleWeeklyTestChange(index, 'chemistry', e.target.value)}
                  placeholder="Score"
                />
              </div>
              <div className="form-group">
                <label>English</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={test.english}
                  onChange={(e) => handleWeeklyTestChange(index, 'english', e.target.value)}
                  placeholder="Score"
                />
              </div>
            </div>
            {index === newPerformance.weeklyTests.length - 1 ? (
              <button 
                className="add-test-button"
                onClick={addWeeklyTest}
              >
                + Add Another Week
              </button>
            ) : (
              <button 
                className="remove-test-button"
                onClick={() => removeWeeklyTest(index)}
              >
                Remove
              </button>
            )}
          </div>
        ))}

        <h3>Monthly Test Results</h3>
        {newPerformance.monthlyTests.map((test, index) => (
          <div key={index} className="test-form-card">
            <div className="form-group">
              <label>Select Month</label>
              <div className="month-year-inputs">
                <select
                  value={test.month}
                  onChange={(e) => handleMonthlyTestChange(index, 'month', e.target.value)}
                >
                  <option value="">Select month...</option>
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                </select>
                <input
                  type="number"
                  min="2020"
                  max="2030"
                  value={test.year}
                  onChange={(e) => handleMonthlyTestChange(index, 'year', e.target.value)}
                  placeholder="Year"
                  className="year-input"
                />
              </div>
            </div>
            <div className="test-scores-grid">
              <div className="form-group">
                <label>Math</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={test.math}
                  onChange={(e) => handleMonthlyTestChange(index, 'math', e.target.value)}
                  placeholder="Score"
                />
              </div>
              <div className="form-group">
                <label>Physics</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={test.physics}
                  onChange={(e) => handleMonthlyTestChange(index, 'physics', e.target.value)}
                  placeholder="Score"
                />
              </div>
              <div className="form-group">
                <label>Chemistry</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={test.chemistry}
                  onChange={(e) => handleMonthlyTestChange(index, 'chemistry', e.target.value)}
                  placeholder="Score"
                />
              </div>
            </div>
            {index === newPerformance.monthlyTests.length - 1 ? (
              <button 
                className="add-test-button"
                onClick={addMonthlyTest}
              >
                + Add Another Month
              </button>
            ) : (
              <button 
                className="remove-test-button"
                onClick={() => removeMonthlyTest(index)}
              >
                Remove
              </button>
            )}
          </div>
        ))}

        <div className="form-actions">
          <button 
            className="save-button"
            onClick={handleAddStudent}
            disabled={!newStudent.name || !newStudent.class || !newStudent.level || loading}
          >
            {loading ? 'Saving...' : 'Save Student Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentAnalysis = () => {
  // API base URL
  const API_BASE_URL = 'http://localhost:5000/api/scholars';

  // State for all scholars
  const [scholars, setScholars] = useState([]);
  // State for selected class level filter
  const [selectedLevel, setSelectedLevel] = useState('');
  // State for selected student
  const [selectedStudent, setSelectedStudent] = useState('');
  // State for active tab (performance, weekly, monthly)
  const [activeTab, setActiveTab] = useState('add');
  // State for modal
  const [showModal, setShowModal] = useState(false);
  // State for loading
  const [loading, setLoading] = useState(false);

  // New student form state
  const [newStudent, setNewStudent] = useState({
    name: '',
    class: '',
    level: '',
    joinDate: new Date().toISOString().split('T')[0],
    rollNumber: ''
  });

  // New performance data form state with empty fields instead of zeros
  const [newPerformance, setNewPerformance] = useState({
    subjects: [
      { name: 'Mathematics', score: '', lastTest: '', grade: 'N/A', performance: 'weak' },
      { name: 'Physics', score: '', lastTest: '', grade: 'N/A', performance: 'weak' },
      { name: 'Chemistry', score: '', lastTest: '', grade: 'N/A', performance: 'weak' },
      { name: 'English', score: '', lastTest: '', grade: 'N/A', performance: 'weak' }
    ],
    weeklyTests: [{ week: '', math: '', physics: '', chemistry: '', english: '' }],
    monthlyTests: [{ month: '', year: new Date().getFullYear(), math: '', physics: '', chemistry: '', english: '' }]
  });

  // Class level categories
  const classLevels = [
    { id: 'primary', name: 'Primary (1-3)' },
    { id: 'secondary', name: 'Secondary (4-5)' },
    { id: 'highschool', name: 'High School (6-7)' },
    { id: 'senior', name: 'Senior (8-10)' }
  ];

  // Function to calculate grade based on score
  const calculateGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  // Function to determine performance
  const determinePerformance = (score) => {
    if (score >= 85) return 'strong';
    if (score >= 70) return 'average';
    return 'weak';
  };

  // Function to add a new student
  const handleAddStudent = async () => {
    try {
      setLoading(true);
      
      // Prepare the data for the new scholar - convert empty strings to 0
      const scholarData = {
        name: newStudent.name,
        class: newStudent.class,
        level: newStudent.level,
        joinDate: newStudent.joinDate,
        rollNumber: newStudent.rollNumber,
        subjects: newPerformance.subjects.map(subject => ({
          ...subject,
          score: subject.score === '' ? 0 : parseInt(subject.score),
          lastTest: subject.lastTest === '' ? 0 : parseInt(subject.lastTest),
          grade: subject.score === '' ? 'N/A' : calculateGrade(parseInt(subject.score)),
          performance: subject.score === '' ? 'weak' : determinePerformance(parseInt(subject.score))
        })),
        weeklyTests: newPerformance.weeklyTests
          .filter(w => w.week) // Only include tests with week specified
          .map(test => ({
            week: test.week,
            math: test.math === '' ? 0 : parseInt(test.math),
            physics: test.physics === '' ? 0 : parseInt(test.physics),
            chemistry: test.chemistry === '' ? 0 : parseInt(test.chemistry),
            english: test.english === '' ? 0 : parseInt(test.english)
          })),
        monthlyTests: newPerformance.monthlyTests
          .filter(m => m.month && m.year) // Only include tests with month and year
          .map(test => ({
            month: test.month,
            year: test.year,
            math: test.math === '' ? 0 : parseInt(test.math),
            physics: test.physics === '' ? 0 : parseInt(test.physics),
            chemistry: test.chemistry === '' ? 0 : parseInt(test.chemistry),
            english: test.english === '' ? 0 : parseInt(test.english)
          }))
      };
      
      // Send to backend
      const response = await axios.post(API_BASE_URL, scholarData);
      const newScholar = response.data;
      
      // Update scholars state
      setScholars([...scholars, newScholar]);
      
      // Reset forms
      setNewStudent({
        name: '',
        class: '',
        level: '',
        joinDate: new Date().toISOString().split('T')[0],
        rollNumber: ''
      });
      
      setNewPerformance({
        subjects: [
          { name: 'Mathematics', score: '', lastTest: '', grade: 'N/A', performance: 'weak' },
          { name: 'Physics', score: '', lastTest: '', grade: 'N/A', performance: 'weak' },
          { name: 'Chemistry', score: '', lastTest: '', grade: 'N/A', performance: 'weak' },
          { name: 'English', score: '', lastTest: '', grade: 'N/A', performance: 'weak' }
        ],
        weeklyTests: [{ week: '', math: '', physics: '', chemistry: '', english: '' }],
        monthlyTests: [{ month: '', year: new Date().getFullYear(), math: '', physics: '', chemistry: '', english: '' }]
      });
      
      setShowModal(true);
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Error adding student. Please try again. Details: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Function to handle subject score change
  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...newPerformance.subjects];
    updatedSubjects[index] = {
      ...updatedSubjects[index],
      [field]: value
    };
    
    // Auto-calculate grade and performance for score changes
    if (field === 'score' && value !== '') {
      const scoreValue = parseInt(value);
      if (!isNaN(scoreValue)) {
        updatedSubjects[index].grade = calculateGrade(scoreValue);
        updatedSubjects[index].performance = determinePerformance(scoreValue);
      }
    }
    
    setNewPerformance({
      ...newPerformance,
      subjects: updatedSubjects
    });
  };

  // Function to handle monthly test change
  const handleMonthlyTestChange = (index, field, value) => {
    const updatedMonthlyTests = [...newPerformance.monthlyTests];
    updatedMonthlyTests[index] = {
      ...updatedMonthlyTests[index],
      [field]: value
    };
    
    setNewPerformance({
      ...newPerformance,
      monthlyTests: updatedMonthlyTests
    });
  };

  // Function to handle weekly test change
  const handleWeeklyTestChange = (index, field, value) => {
    const updatedWeeklyTests = [...newPerformance.weeklyTests];
    updatedWeeklyTests[index] = {
      ...updatedWeeklyTests[index],
      [field]: value
    };
    
    setNewPerformance({
      ...newPerformance,
      weeklyTests: updatedWeeklyTests
    });
  };

  // Function to add a new monthly test entry
  const addMonthlyTest = () => {
    setNewPerformance({
      ...newPerformance,
      monthlyTests: [
        ...newPerformance.monthlyTests,
        { month: '', year: new Date().getFullYear(), math: '', physics: '', chemistry: '', english: '' }
      ]
    });
  };

  // Function to add a new weekly test entry
  const addWeeklyTest = () => {
    setNewPerformance({
      ...newPerformance,
      weeklyTests: [
        ...newPerformance.weeklyTests,
        { week: '', math: '', physics: '', chemistry: '', english: '' }
      ]
    });
  };

  // Function to remove a monthly test entry
  const removeMonthlyTest = (index) => {
    const updatedMonthlyTests = [...newPerformance.monthlyTests];
    updatedMonthlyTests.splice(index, 1);
    setNewPerformance({
      ...newPerformance,
      monthlyTests: updatedMonthlyTests
    });
  };

  // Function to remove a weekly test entry
  const removeWeeklyTest = (index) => {
    const updatedWeeklyTests = [...newPerformance.weeklyTests];
    updatedWeeklyTests.splice(index, 1);
    setNewPerformance({
      ...newPerformance,
      weeklyTests: updatedWeeklyTests
    });
  };

  // Function to fetch scholars from backend
  const fetchScholars = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_BASE_URL);
      setScholars(response.data);
    } catch (error) {
      console.error('Error fetching scholars:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch scholars on component mount
  useEffect(() => {
    fetchScholars();
  }, []);

  return (
    <div className="student-performance">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      <div className="card">
        <h2 className="bounce-in">Student Performance Analysis</h2>
        
        {/* Navigation Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'add' ? 'active pulse' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add Student
          </button>
        </div>
        
        {/* Student Form */}
        {activeTab === 'add' && (
          <StudentForm
            newStudent={newStudent}
            setNewStudent={setNewStudent}
            classLevels={classLevels}
            handleAddStudent={handleAddStudent}
            newPerformance={newPerformance}
            handleSubjectChange={handleSubjectChange}
            handleMonthlyTestChange={handleMonthlyTestChange}
            handleWeeklyTestChange={handleWeeklyTestChange}
            addMonthlyTest={addMonthlyTest}
            addWeeklyTest={addWeeklyTest}
            removeMonthlyTest={removeMonthlyTest}
            removeWeeklyTest={removeWeeklyTest}
            loading={loading}
          />
        )}
      </div>
      
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="Success"
      >
        <p>Student data has been successfully saved!</p>
        <button 
          className="save-button"
          onClick={() => setShowModal(false)}
        >
          OK
        </button>
      </Modal>

      {/* Component styles */}
      <style>{`
        .student-performance {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          position: relative;
        }
        
        /* Loading Animation */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 5px solid #f3f3f3;
          border-top: 5px solid #FF8C00;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 25px;
          margin-bottom: 20px;
          animation: fadeIn 0.5s ease;
        }
        
        h2, h3, h4, h5 {
          color: #333;
          margin-top: 0;
        }
        
        h2 {
          margin-bottom: 20px;
          font-size: 24px;
          animation: bounceIn 0.8s ease;
        }
        
        h3 {
          margin-bottom: 15px;
          font-size: 18px;
          padding-bottom: 8px;
          border-bottom: 2px solid #f0f0f0;
        }
        
        h4 {
          margin: 0;
          font-size: 16px;
        }
        
        .filter-section {
          margin-bottom: 20px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #555;
        }
        
        input, select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
          background-color: white;
        }
        
        input[type="number"] {
          -moz-appearance: textfield;
        }
        
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        .value-input {
          width: 80px;
          text-align: center;
        }
        
        .month-year-inputs {
          display: flex;
          gap: 10px;
        }
        
        .month-year-inputs select {
          flex: 2;
        }
        
        .month-year-inputs .year-input {
          flex: 1;
        }
        
        /* Weekly Calendar Styles - Updated for inline appearance */
        .weekly-calendar-container {
          margin-bottom: 20px;
        }
        
        .weekly-calendar.inline {
          display: inline-block;
          background: white;
          border-radius: 6px;
          padding: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border: 1px solid #e0e0e0;
          max-width: 280px;
        }
        
        .weekly-calendar.inline .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding: 0 2px;
        }
        
        .weekly-calendar.inline .calendar-header h5 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
        }
        
        .weekly-calendar.inline .nav-btn {
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 3px;
          padding: 2px 6px;
          cursor: pointer;
          font-size: 10px;
          min-width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .weekly-calendar.inline .nav-btn:hover {
          background: #e0e0e0;
        }
        
        .weekly-calendar.inline .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          margin-bottom: 3px;
        }
        
        .weekly-calendar.inline .weekday {
          text-align: center;
          font-weight: 600;
          font-size: 11px;
          color: #555;
          padding: 3px 0;
        }
        
        .weekly-calendar.inline .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
        }
        
        .weekly-calendar.inline .calendar-day {
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #eee;
          border-radius: 2px;
          cursor: pointer;
          font-size: 11px;
          background: white;
        }
        
        .weekly-calendar.inline .calendar-day:hover {
          background: #f0f0f0;
        }
        
        .weekly-calendar.inline .calendar-day.today {
          background: #e6f7ff;
          border-color: #91d5ff;
          font-weight: bold;
        }
        
        .weekly-calendar.inline .calendar-day.selected {
          background: #FF8C00;
          color: white;
          font-weight: bold;
        }
        
        .weekly-calendar.inline .calendar-day.empty {
          background: #f9f9f9;
          cursor: default;
          border: 1px solid transparent;
        }
        
        .weekly-calendar.inline .selected-week-info {
          margin-top: 8px;
          text-align: center;
          font-size: 11px;
          padding: 5px;
          background: #f0f0f0;
          border-radius: 3px;
          font-weight: 600;
        }
        
        /* Tabs */
        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 2px solid #eee;
        }
        
        .tab {
          padding: 10px 20px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #666;
          border-bottom: 2px solid transparent;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .tab:hover {
          color: #FF8C00;
        }
        
        .tab.active {
          color: #FF8C00;
          border-bottom-color: #FF8C00;
        }
        
        .tab.pulse {
          animation: pulse 1s;
        }
        
        .tab::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: #FF8C00;
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }
        
        .tab:hover::after {
          transform: translateX(0);
        }
        
        /* Add/Edit form styles */
        .add-edit-forms {
          margin: 20px 0;
          max-height: 70vh;
          overflow-y: auto;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .subject-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .subject-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .subject-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        
        .subject-stats {
          margin-top: 10px;
        }
        
        .stat {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding: 5px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .stat:last-child {
          border-bottom: none;
        }
        
        .label {
          font-weight: 600;
          color: #555;
        }
        
        .value {
          color: #333;
        }
        
        .performance-badge {
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .test-form-card {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
          border-left: 3px solid #4CAF50;
        }
        
        .weekly-test {
          border-left: 3px solid #2196F3;
        }
        
        .test-scores-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
          margin: 10px 0;
        }
        
        .add-test-button, .remove-test-button {
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        
        .add-test-button {
          background: #4CAF50;
          color: white;
        }
        
        .add-test-button:hover {
          background: #3e8e41;
        }
        
        .remove-test-button {
          background: #f44336;
          color: white;
        }
        
        .remove-test-button:hover {
          background: #d32f2f;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        
        .save-button {
          padding: 10px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.3s ease;
        }
        
        .save-button:hover {
          background: #3e8e41;
        }
        
        .save-button:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
        
        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal {
          background: white;
          border-radius: 8px;
          max-width: 500px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .modal-header {
          padding: 15px 20px;
          border-bottom: 1px solid #ddd;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }
        
        .modal-content {
          padding: 20px;
        }
        
        /* Loading overlay */
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1001;
        }
        
        /* Animations */
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes bounceIn {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          60% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(255, 140, 0, 0.7);
          }
          70% {
            transform: scale(1.05);
            box-shadow: 0 0 0 10px rgba(255, 140, 0, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(255, 140, 0, 0);
          }
        }
        
        @media (max-width: 768px) {
          .form-grid, .subject-form-grid {
            grid-template-columns: 1fr;
          }
          
          .tabs {
            flex-direction: column;
          }
          
          .month-year-inputs {
            flex-direction: column;
          }
          
          .weekly-calendar.inline {
            max-width: 100%;
          }
          
          .weekly-calendar.inline .calendar-days, 
          .weekly-calendar.inline .calendar-weekdays {
            grid-template-columns: repeat(7, 1fr);
          }
          
          .weekly-calendar.inline .calendar-day {
            height: 25px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentAnalysis;