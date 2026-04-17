import React, { useState, useEffect, useReducer } from 'react';
import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service functions
const studentApi = {
  // Get all students
  getStudents: async () => {
    const response = await api.get('/students');
    return response.data;
  },

  // Get students by grade level and class
  getStudentsByGrade: async (gradeLevel, className = '') => {
    let url = `/students?level=${gradeLevel}`;
    if (className) {
      url += `&class=${className}`;
    }
    const response = await api.get(url);
    return response.data;
  },
};

const performanceApi = {
  // Save performance data
  savePerformance: async (performanceData) => {
    const response = await api.post('/performance/batch', performanceData);
    return response.data;
  },

  // Get performance data with filters
  getPerformance: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/performance?${params.toString()}`);
    return response.data;
  },

  // Get all subjects
  getSubjects: async () => {
    const response = await api.get('/performance/subjects');
    return response.data;
  },

  // Delete a performance record
  deletePerformance: async (id) => {
    const response = await api.delete(`/performance/${id}`);
    return response.data;
  },

  // Update a performance record
  updatePerformance: async (id, performanceData) => {
    const response = await api.put(`/performance/${id}`, performanceData);
    return response.data;
  }
};

// Function to get week number within month (1-4)
const getWeekNumberInMonth = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Get the first day of the month
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  
  // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = firstDayOfMonth.getDay();
  
  // Calculate the day of the month
  const dayOfMonth = date.getDate();
  
  // Calculate which week of the month it is (1-4 or 5)
  // Adjust for the starting day of the week (considering Monday as start of week)
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const weekNumber = Math.ceil((dayOfMonth + adjustedFirstDay) / 7);
  
  // Return week1 to week4 (if week 5 exists, treat it as week4)
  return `week${Math.min(weekNumber, 4)}`;
};

// Function to get month name from date
const getMonthName = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
};

// Function to get subject-wise compliments based on marks
const getSubjectCompliment = (marks, subjectName) => {
  if (marks >= 90) {
    return `Excellent work in ${subjectName}! Keep up the outstanding performance! 🌟`;
  } else if (marks >= 80) {
    return `Very good performance in ${subjectName}. You're doing great! 👍`;
  } else if (marks >= 70) {
    return `Good work in ${subjectName}. Continue to practice regularly. 📚`;
  } else if (marks >= 60) {
    return `Satisfactory performance in ${subjectName}. Try to improve with more practice. 💪`;
  } else if (marks >= 50) {
    return `Average performance in ${subjectName}. Focus more on this subject. 🎯`;
  } else if (marks >= 40) {
    return `Needs improvement in ${subjectName}. Seek help and practice more. 📖`;
  } else {
    return `Requires immediate attention in ${subjectName}. Please focus and work hard. 🚨`;
  }
};

// Reducer for complex state logic
const marksReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_PERIOD_TYPE':
      return { ...state, periodType: action.payload };
    case 'UPDATE_WEEK':
      return { 
        ...state, 
        week: action.payload.week,
        date: action.payload.date || state.date,
        year: action.payload.year || state.year
      };
    case 'UPDATE_MONTH':
      return { 
        ...state, 
        month: action.payload.month,
        date: action.payload.date || state.date,
        year: action.payload.year || state.year
      };
    case 'UPDATE_DATE':
      // When date is updated, automatically calculate and set the week and month
      const weekNumber = getWeekNumberInMonth(action.payload);
      const monthName = getMonthName(action.payload);
      return { 
        ...state, 
        date: action.payload,
        week: state.periodType === 'weekly' ? weekNumber : state.week,
        month: state.periodType === 'monthly' ? monthName : state.month,
        year: new Date(action.payload).getFullYear().toString()
      };
    case 'UPDATE_YEAR':
      return { ...state, year: action.payload };
    case 'UPDATE_MARKS':
      return {
        ...state,
        marks: {
          ...state.marks,
          [action.payload.studentId]: {
            ...(state.marks[action.payload.studentId] || {}),
            [action.payload.subjectName]: action.payload.value
          }
        }
      };
    case 'RESET_MARKS':
      // Reset but keep the current date and calculate week/month from it
      const currentDate = new Date().toISOString().split('T')[0];
      const currentWeek = getWeekNumberInMonth(currentDate);
      const currentMonth = getMonthName(currentDate);
      const currentYear = new Date().getFullYear().toString();
      
      return {
        periodType: 'weekly',
        week: currentWeek,
        month: currentMonth,
        date: currentDate,
        year: currentYear,
        marks: {}
      };
    case 'SET_MARKS_DATA':
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
};

// Updated Chart Component for Week-wise Performance
const SubjectChart = ({ data, title, type = 'bar', selectedWeek = '' }) => {
  // Filter data based on selected week
  const filteredData = selectedWeek ? 
    data.filter(item => item.week === selectedWeek) : 
    data;

  const maxValue = Math.max(...filteredData.map(item => item.value), 100);
  
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px',
      border: '1px solid #e1e8ed',
      animation: 'slideInUp 0.6s ease-out'
    }}>
      <h3 style={{
        margin: '0 0 15px 0',
        color: '#2c3e50',
        fontSize: '18px',
        fontWeight: '600',
        textAlign: 'center'
      }}>
        {title}
      </h3>
      
      {filteredData.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#7f8c8d',
          fontSize: '14px'
        }}>
          No data available for {selectedWeek ? `Week ${selectedWeek.replace('week', '')}` : 'selected period'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredData.map((item, index) => {
            const percentage = (item.value / maxValue) * 100;
            const color = item.value >= 80 ? '#4caf50' : 
                         item.value >= 60 ? '#ffc107' : 
                         item.value >= 40 ? '#ff9800' : '#f44336';
            
            return (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '15px', animation: `fadeIn 0.8s ease-out ${index * 0.1}s both` }}>
                <span style={{
                  minWidth: '80px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2c3e50'
                }}>
                  {item.label}
                </span>
                
                <div style={{
                  flex: 1,
                  height: '30px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '15px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: color,
                    borderRadius: '15px',
                    transition: 'width 1.5s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '10px',
                    animation: `growWidth 1.5s ease-out ${index * 0.2}s both`
                  }}>
                    <span style={{
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      textShadow: '1px 1px 1px rgba(0,0,0,0.3)',
                      animation: 'fadeIn 0.5s ease-out 1s both'
                    }}>
                      {item.value}%
                    </span>
                  </div>
                </div>
                
                <div style={{
                  minWidth: '50px',
                  textAlign: 'right',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: color,
                  animation: `bounceIn 0.6s ease-out ${index * 0.15}s both`
                }}>
                  {item.value}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Performance Summary Card Component
const PerformanceCard = ({ title, value, subtitle, color = '#3498db' }) => (
  <div style={{
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
    border: `2px solid ${color}`,
    minWidth: '150px',
    animation: 'zoomIn 0.8s ease-out',
    transition: 'all 0.3s ease',
    transform: 'translateY(0)',
    cursor: 'pointer'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-10px) scale(1.05)';
    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0) scale(1)';
    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  }}>
    <div style={{
      fontSize: '24px',
      fontWeight: '700',
      color: color,
      marginBottom: '5px',
      animation: 'countUp 1.5s ease-out'
    }}>
      {value}
    </div>
    <div style={{
      fontSize: '14px',
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '5px'
    }}>
      {title}
    </div>
    <div style={{
      fontSize: '12px',
      color: '#7f8c8d'
    }}>
      {subtitle}
    </div>
  </div>
);

// Individual Student Performance Card
const StudentPerformanceCard = ({ studentData }) => {
  if (!studentData || !studentData.subjects) return null;

  // Calculate overall average
  const totalMarks = studentData.subjects.reduce((sum, subject) => sum + (subject.score || 0), 0);
  const average = studentData.subjects.length > 0 ? totalMarks / studentData.subjects.length : 0;
  
  // Get grade and remarks
  const getGradeAndRemarks = (marks) => {
    if (marks >= 90) return { grade: 'A+', remarks: 'Excellent', color: '#4caf50' };
    if (marks >= 80) return { grade: 'A', remarks: 'Very Good', color: '#8bc34a' };
    if (marks >= 70) return { grade: 'B+', remarks: 'Good', color: '#cddc39' };
    if (marks >= 60) return { grade: 'B', remarks: 'Satisfactory', color: '#ffeb3b' };
    if (marks >= 50) return { grade: 'C', remarks: 'Average', color: '#ffc107' };
    if (marks >= 40) return { grade: 'D', remarks: 'Weak', color: '#ff9800' };
    return { grade: 'F', remarks: 'Fail', color: '#f44336' };
  };

  const { grade, remarks, color: overallColor } = getGradeAndRemarks(average);

  // State for hover animation
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '25px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginBottom: '25px',
      border: `2px solid ${overallColor}`,
      animation: 'slideInDown 0.8s ease-out',
      transition: 'all 0.3s ease',
      transform: isHovered ? 'translateY(-5px) scale(1.02)' : 'translateY(0) scale(1)',
      cursor: 'pointer'
    }}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '2px solid #e1e8ed'
      }}>
        <h3 style={{
          margin: 0,
          color: '#2c3e50',
          fontSize: '20px',
          fontWeight: '600',
          animation: 'fadeInLeft 0.8s ease-out',
          transition: 'all 0.3s ease',
          transform: isHovered ? 'translateX(10px)' : 'translateX(0)'
        }}>
          📊 Student Performance Summary
        </h3>
        <div style={{
          padding: '10px 20px',
          backgroundColor: overallColor,
          color: 'white',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '16px',
          animation: 'bounceIn 1s ease-out 0.3s both',
          transition: 'all 0.3s ease',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)'
        }}>
          Overall: {average.toFixed(1)}% ({grade})
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <PerformanceCard 
          title="Overall Average" 
          value={`${average.toFixed(1)}%`} 
          subtitle="All Subjects" 
          color="#3498db"
        />
        <PerformanceCard 
          title="Grade" 
          value={grade} 
          subtitle="Overall Grade" 
          color={overallColor}
        />
        <PerformanceCard 
          title="Remarks" 
          value={remarks} 
          subtitle="Performance" 
          color="#9b59b6"
        />
        <PerformanceCard 
          title="Subjects" 
          value={studentData.subjects.length} 
          subtitle="Total Subjects" 
          color="#e67e22"
        />
      </div>

      {/* Subject-wise Performance */}
      <div>
        <h4 style={{
          margin: '0 0 15px 0',
          color: '#2c3e50',
          fontSize: '18px',
          fontWeight: '600',
          animation: 'fadeIn 0.8s ease-out 0.4s both',
          transition: 'all 0.3s ease',
          transform: isHovered ? 'translateX(5px)' : 'translateX(0)'
        }}>
          Subject-wise Performance
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '15px'
        }}>
          {studentData.subjects.map((subject, index) => {
            const { grade: subjectGrade, color: subjectColor } = getGradeAndRemarks(subject.score || 0);
            const compliment = getSubjectCompliment(subject.score || 0, subject.name);
            
            return (
              <div key={index} style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                border: `2px solid ${subjectColor}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                transition: 'all 0.3s ease',
                transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: '#2c3e50',
                      fontSize: '16px',
                      marginBottom: '5px'
                    }}>
                      {subject.name}
                    </div>
                    <div style={{
                      color: '#7f8c8d',
                      fontSize: '14px'
                    }}>
                      Grade: {subjectGrade}
                    </div>
                  </div>
                  <div style={{
                    textAlign: 'right'
                  }}>
                    <div style={{
                      fontWeight: '700',
                      color: subjectColor,
                      fontSize: '20px',
                      marginBottom: '5px',
                      animation: `pulse 2s infinite ${index * 0.2}s`
                    }}>
                      {subject.score || 0}%
                    </div>
                    <div style={{
                      color: '#7f8c8d',
                      fontSize: '12px'
                    }}>
                      out of 100
                    </div>
                  </div>
                </div>
                
                {/* Subject-wise Compliment */}
                <div style={{
                  padding: '10px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  borderLeft: `4px solid ${subjectColor}`,
                  fontSize: '14px',
                  color: '#2c3e50',
                  fontStyle: 'italic',
                  lineHeight: '1.4',
                  animation: `fadeIn 0.8s ease-out ${index * 0.15 + 0.5}s both`
                }}>
                  💡 {compliment}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StudentPerformance = () => {
  // State declarations
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [groupedStudents, setGroupedStudents] = useState({});
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Initialize marksData with current week and month
  const currentDate = new Date().toISOString().split('T')[0];
  const initialWeek = getWeekNumberInMonth(currentDate);
  const initialMonth = getMonthName(currentDate);
  const initialYear = new Date().getFullYear().toString();
  
  const [marksData, dispatch] = useReducer(marksReducer, {
    periodType: 'weekly',
    week: initialWeek,
    month: initialMonth,
    date: currentDate,
    year: initialYear,
    marks: {},
  });
  
  const [viewMode, setViewMode] = useState('entry');
  const [activeGradeLevel, setActiveGradeLevel] = useState('primary');
  const [activeClass, setActiveClass] = useState('');
  const [classes, setClasses] = useState([]);
  const [allClasses, setAllClasses] = useState({});
  const [viewMarks, setViewMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [viewMarksLoading, setViewMarksLoading] = useState(false);
  const [viewMarksError, setViewMarksError] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewPeriodType, setViewPeriodType] = useState('weekly');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Chart and analytics states
  const [classPerformance, setClassPerformance] = useState({});
  const [subjectAnalytics, setSubjectAnalytics] = useState({});
  const [overallStats, setOverallStats] = useState({});
  const [individualStudentData, setIndividualStudentData] = useState(null);

  // Edit functionality states
  const [editingRecord, setEditingRecord] = useState(null);
  const [editMarks, setEditMarks] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Grade levels
  const gradeLevels = [
    { value: 'primary', label: 'Primary (1st - 3rd)' },
    { value: 'secondary', label: 'Secondary (4th - 5th)' },
    { value: 'high-school', label: 'High School (6th - 7th)' },
    { value: 'senior', label: 'Senior (8th - 10th)' }
  ];

  // Week options - simplified without date ranges
  const weekOptions = [
    { value: '', label: 'All Weeks' },
    { value: 'week1', label: 'Week 1' },
    { value: 'week2', label: 'Week 2' },
    { value: 'week3', label: 'Week 3' },
    { value: 'week4', label: 'Week 4' }
  ];

  // Month options
  const monthOptions = [
    { value: '', label: 'All Months' },
    { value: 'january', label: 'January' },
    { value: 'february', label: 'February' },
    { value: 'march', label: 'March' },
    { value: 'april', label: 'April' },
    { value: 'may', label: 'May' },
    { value: 'june', label: 'June' },
    { value: 'july', label: 'July' },
    { value: 'august', label: 'August' },
    { value: 'september', label: 'September' },
    { value: 'october', label: 'October' },
    { value: 'november', label: 'November' },
    { value: 'december', label: 'December' }
  ];

  // Year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString()
  }));

  // Default subjects
  const defaultSubjects = [
    { _id: '1', name: 'Mathematics', selected: false },
    { _id: '2', name: 'Science', selected: false },
    { _id: '3', name: 'English', selected: false },
    { _id: '4', name: 'Social Studies', selected: false },
    { _id: '5', name: 'Hindi', selected: false }
  ];

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format week label for display - simplified to show only week name
  const formatWeekLabel = (weekValue) => {
    if (!weekValue) return 'All Weeks';
    // Simply capitalize the first letter of week value (week1 -> Week 1)
    return weekValue.charAt(0).toUpperCase() + weekValue.slice(1).replace('week', ' Week ');
  };

  // Calculate analytics from performance data
  const calculateAnalytics = (performanceData, selectedStudentId = null) => {
    if (!performanceData || performanceData.length === 0) {
      setClassPerformance({});
      setSubjectAnalytics({});
      setOverallStats({});
      setIndividualStudentData(null);
      return;
    }

    // If a specific student is selected, calculate individual analytics
    if (selectedStudentId) {
      let individualData = null;
      
      // Find the student's performance data across all records
      performanceData.forEach(record => {
        if (record.students) {
          const studentRecord = record.students.find(s => s.studentId === selectedStudentId);
          if (studentRecord) {
            individualData = studentRecord;
          }
        }
      });

      setIndividualStudentData(individualData);

      // Calculate week-wise analytics for the individual student
      if (individualData && individualData.subjects) {
        const subjectChartData = {};
        
        // Group performance data by week for each subject
        performanceData.forEach(record => {
          if (record.students) {
            const studentRecord = record.students.find(s => s.studentId === selectedStudentId);
            if (studentRecord && studentRecord.subjects) {
              studentRecord.subjects.forEach(subject => {
                const subjectName = subject.name;
                const week = record.week || 'week1'; // Default to week1 if no week specified
                
                if (!subjectChartData[subjectName]) {
                  subjectChartData[subjectName] = [];
                }
                
                // Check if we already have data for this week
                const existingWeekData = subjectChartData[subjectName].find(item => item.week === week);
                
                if (!existingWeekData) {
                  subjectChartData[subjectName].push({
                    label: `Week ${week.replace('week', '')}`,
                    value: subject.score || 0,
                    week: week
                  });
                }
              });
            }
          }
        });

        setSubjectAnalytics(subjectChartData);

        // Calculate overall statistics for the individual student
        const totalMarks = individualData.subjects.reduce((sum, subject) => sum + (subject.score || 0), 0);
        const average = individualData.subjects.length > 0 ? totalMarks / individualData.subjects.length : 0;
        
        setOverallStats({
          average: Math.round(average),
          totalSubjects: individualData.subjects.length,
          totalRecords: performanceData.length
        });
      }
    } else {
      // Calculate class-level analytics (when no specific student is selected)
      const classStats = {};
      const subjectStats = {};
      let totalStudents = 0;
      let totalMarks = 0;
      let totalRecords = 0;

      // Group data by subject and week for class-level analytics
      performanceData.forEach(record => {
        if (!record.students) return;

        const week = record.week || 'week1';
        
        record.students.forEach(studentRecord => {
          totalStudents++;
          
          studentRecord.subjects.forEach(subject => {
            const subjectName = subject.name;
            const score = subject.score || 0;
            
            // Initialize subject stats if not exists
            if (!subjectStats[subjectName]) {
              subjectStats[subjectName] = {
                weeks: {}
              };
            }
            
            // Initialize week data if not exists
            if (!subjectStats[subjectName].weeks[week]) {
              subjectStats[subjectName].weeks[week] = {
                total: 0,
                count: 0
              };
            }
            
            // Update week stats
            subjectStats[subjectName].weeks[week].total += score;
            subjectStats[subjectName].weeks[week].count++;
            
            totalMarks += score;
            totalRecords++;
          });
        });
      });

      // Calculate averages and prepare chart data for each subject
      const subjectChartData = {};
      Object.keys(subjectStats).forEach(subjectName => {
        subjectChartData[subjectName] = [];
        
        // Create data for each week
        Object.keys(subjectStats[subjectName].weeks).forEach(week => {
          const weekData = subjectStats[subjectName].weeks[week];
          const avg = weekData.total / weekData.count;
          
          subjectChartData[subjectName].push({
            label: `Week ${week.replace('week', '')}`,
            value: Math.round(avg),
            week: week
          });
        });
        
        // Sort by week number
        subjectChartData[subjectName].sort((a, b) => {
          const weekA = parseInt(a.week.replace('week', ''));
          const weekB = parseInt(b.week.replace('week', ''));
          return weekA - weekB;
        });
      });

      // Calculate overall statistics
      const overallAverage = totalRecords > 0 ? totalMarks / totalRecords : 0;
      
      setSubjectAnalytics(subjectChartData);
      setClassPerformance(classStats);
      setOverallStats({
        average: Math.round(overallAverage),
        totalStudents,
        totalRecords
      });
      setIndividualStudentData(null);
    }
  };

  // Get grade and remarks based on marks
  const getGradeAndRemarks = (marks) => {
    if (marks >= 90) return { grade: 'A+', remarks: 'Excellent', color: '#4caf50' };
    if (marks >= 80) return { grade: 'A', remarks: 'Very Good', color: '#8bc34a' };
    if (marks >= 70) return { grade: 'B+', remarks: 'Good', color: '#cddc39' };
    if (marks >= 60) return { grade: 'B', remarks: 'Satisfactory', color: '#ffeb3b' };
    if (marks >= 50) return { grade: 'C', remarks: 'Average', color: '#ffc107' };
    if (marks >= 40) return { grade: 'D', remarks: 'Weak', color: '#ff9800' };
    return { grade: 'F', remarks: 'Fail', color: '#f44336' };
  };

  // Effect to automatically set week and month when date changes
  useEffect(() => {
    if (marksData.date) {
      const weekNumber = getWeekNumberInMonth(marksData.date);
      const monthName = getMonthName(marksData.date);
      
      if (marksData.periodType === 'weekly') {
        dispatch({ 
          type: 'UPDATE_WEEK', 
          payload: { week: weekNumber, date: marksData.date } 
        });
      }
      
      if (marksData.periodType === 'monthly') {
        dispatch({ 
          type: 'UPDATE_MONTH', 
          payload: { month: monthName, date: marksData.date } 
        });
      }
    }
  }, [marksData.date, marksData.periodType]);

  // Effect to fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch students
        const studentsResponse = await studentApi.getStudents();
        
        // Store all students for search dropdown
        setAllStudents(studentsResponse.data || []);
        
        // Extract unique classes from students by grade level
        const classesByGrade = {};
        const grouped = (studentsResponse.data || []).reduce((acc, student) => {
          const level = student.level || 'primary';
          if (!acc[level]) {
            acc[level] = [];
          }
          acc[level].push(student);
          
          // Add class to classesByGrade
          if (!classesByGrade[level]) {
            classesByGrade[level] = new Set();
          }
          if (student.class) {
            classesByGrade[level].add(student.class);
          }
          
          return acc;
        }, {});
        
        // Convert Sets to Arrays and sort in descending order
        Object.keys(classesByGrade).forEach(level => {
          classesByGrade[level] = Array.from(classesByGrade[level])
            .sort((a, b) => parseInt(b) - parseInt(a));
        });
        
        setAllClasses(classesByGrade);
        setGroupedStudents(grouped);
        setStudents(grouped.primary || []);
        setClasses(classesByGrade.primary || []);
        
        // Use default subjects
        setSubjects(defaultSubjects);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setSaveError('Failed to load student data');
        setSubjects(defaultSubjects);
        setLoading(false);
      }
    };
  
    fetchInitialData();
  }, []);

  // Handle grade level change
  const handleGradeLevelChange = async (level) => {
    try {
      setLoading(true);
      setActiveGradeLevel(level);
      setActiveClass('');
      
      // Filter classes based on grade level
      let filteredClasses = [];
      if (level === 'primary') {
        filteredClasses = (allClasses[level] || [])
          .filter(className => ['1', '2', '3'].includes(className))
          .sort((a, b) => parseInt(b) - parseInt(a));
      } else {
        filteredClasses = (allClasses[level] || [])
          .sort((a, b) => parseInt(b) - parseInt(a));
      }
      
      setClasses(filteredClasses);
      
      // If we already have students for this grade level, use them
      if (groupedStudents[level] && groupedStudents[level].length > 0) {
        setStudents(groupedStudents[level]);
      } else {
        // Otherwise, fetch students for this grade level
        const response = await studentApi.getStudentsByGrade(level);
        setStudents(response.data || []);
        
        // Update grouped students
        setGroupedStudents(prev => ({
          ...prev,
          [level]: response.data || []
        }));
      }
      
      // Clear selections when changing grade level
      setSelectedStudents([]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students for grade level:', error);
      setSaveError('Failed to load students for this grade level');
      setLoading(false);
    }
  };

  // Handle class change
  const handleClassChange = async (className) => {
    try {
      setLoading(true);
      setActiveClass(className);
      
      // Filter students by class within the current grade level
      if (className === '') {
        setStudents(groupedStudents[activeGradeLevel] || []);
      } else {
        const filteredStudents = (groupedStudents[activeGradeLevel] || []).filter(
          student => student.class === className
        );
        setStudents(filteredStudents);
      }
      
      // Clear selections when changing class
      setSelectedStudents([]);
      setLoading(false);
    } catch (error) {
      console.error('Error filtering students by class:', error);
      setSaveError('Failed to filter students by class');
      setLoading(false);
    }
  };

  // Handle subject selection
  const handleSubjectChange = (id) => {
    setSubjects(subjects.map(subject => 
      subject._id === id ? { ...subject, selected: !subject.selected } : subject
    ));
  };

  // Handle student selection
  const handleStudentSelect = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // Select all students
  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(student => student._id));
    }
  };

  // Handle marks input change
  const handleMarksChange = (studentId, subjectName, value) => {
    // Allow empty value (to clear the input)
    if (value === '') {
      dispatch({
        type: 'UPDATE_MARKS',
        payload: { studentId, subjectName, value: '' }
      });
      return;
    }
    
    // Validate input (0-100)
    const numericValue = parseInt(value);
    if (isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
      return;
    }
    
    dispatch({
      type: 'UPDATE_MARKS',
      payload: { studentId, subjectName, value: numericValue }
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (marksData.periodType === 'weekly' && !marksData.week) {
      alert('Please select a date to automatically determine the week');
      return;
    }
    
    if (marksData.periodType === 'monthly' && !marksData.month) {
      alert('Please select a date to automatically determine the month');
      return;
    }
    
    if (!marksData.date) {
      alert('Please select a date');
      return;
    }
    
    if (!marksData.year) {
      alert('Please select a year');
      return;
    }
    
    const selectedSubjects = subjects.filter(s => s.selected);
    if (selectedSubjects.length === 0) {
      alert('Please select at least one subject');
      return;
    }
    
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }
    
    // Prepare data for submission
    const performanceRecords = selectedStudents.map(studentId => {
      const studentMarks = marksData.marks[studentId] || {};
      const subjectScores = selectedSubjects
        .filter(subject => subject.selected)
        .map(subject => ({
          name: subject.name,
          score: studentMarks[subject.name] || 0,
          total: 100,
          grade: ''
        }));
      
      return {
        studentId,
        testType: marksData.periodType,
        date: marksData.date,
        month: marksData.periodType === 'monthly' ? marksData.month : getMonthName(marksData.date),
        week: marksData.periodType === 'weekly' ? marksData.week : '',
        year: marksData.year,
        subjects: subjectScores
      };
    });
  
    // Save performance data using API
    try {
      setSaving(true);
      setSaveError(null);
      
      const response = await performanceApi.savePerformance({ records: performanceRecords });
      
      if (response.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        dispatch({ type: 'RESET_MARKS' });
        setSelectedStudents([]);
        setSubjects(subjects.map(s => ({ ...s, selected: false })));
      } else {
        throw new Error(response.message || 'Failed to save performance data');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save performance data';
      setSaveError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // Fetch performance data for viewing with class filter
  const fetchMarks = async () => {
    try {
      setViewMarksLoading(true);
      setViewMarksError(null);
      setHasSearched(true);
      
      // Prepare filters based on current state
      const filters = {
        gradeLevel: activeGradeLevel
      };
      
      // Add class filter if a specific class is selected
      if (activeClass) {
        filters.class = activeClass;
      }
      
      // Add student filter if a specific student is selected
      if (selectedStudent) {
        filters.studentId = selectedStudent._id;
      }
      
      // Add test type filter
      filters.testType = viewPeriodType;
      
      // Add period filters
      if (viewPeriodType === 'weekly') {
        if (selectedWeek) {
          filters.week = selectedWeek;
        }
        if (selectedMonth) {
          filters.month = selectedMonth;
        }
      } else if (viewPeriodType === 'monthly') {
        if (selectedMonth) {
          filters.month = selectedMonth;
        }
        filters.week = '';
      }
      
      // Add year filter
      if (selectedYear) {
        filters.year = selectedYear;
      }
      
      const response = await performanceApi.getPerformance(filters);
      
      if (response.success) {
        let filteredData = response.data || [];
        
        // If we're filtering by a specific student, only show that student's data
        if (selectedStudent) {
          filteredData = filteredData.filter(record => 
            record.students && record.students.some(student => 
              student.studentId === selectedStudent._id
            )
          );
          
          const studentSpecificData = filteredData.map(record => {
            const studentData = record.students.find(student => 
              student.studentId === selectedStudent._id
            );
            
            return {
              ...record,
              students: studentData ? [studentData] : []
            };
          });
          
          setViewMarks(studentSpecificData);
        } else {
          setViewMarks(filteredData);
        }

        // Calculate analytics for charts - pass selected student ID if any
        calculateAnalytics(filteredData, selectedStudent ? selectedStudent._id : null);
      } else {
        throw new Error(response.message || 'Failed to fetch performance data');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch performance data';
      console.error('Error fetching performance data:', error);
      setViewMarksError(errorMsg);
      setViewMarks([]);
      setSubjectAnalytics({});
      setIndividualStudentData(null);
    } finally {
      setViewMarksLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsEditing(true);
    // Initialize edit marks with current values
    const initialEditMarks = {};
    if (record.students && record.students.length > 0) {
      record.students.forEach(student => {
        initialEditMarks[student.studentId] = {};
        student.subjects.forEach(subject => {
          initialEditMarks[student.studentId][subject.name] = subject.score || '';
        });
      });
    }
    setEditMarks(initialEditMarks);
  };

  // Handle edit marks change - FIXED: Now properly handles empty values
  const handleEditMarksChange = (studentId, subjectName, value) => {
    // Allow empty value to clear the input
    if (value === '') {
      setEditMarks(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [subjectName]: ''
        }
      }));
      return;
    }
    
    // Validate input (0-100)
    const numericValue = parseInt(value);
    if (isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
      return;
    }
    
    setEditMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectName]: numericValue
      }
    }));
  };

  // Handle update performance
  const handleUpdatePerformance = async () => {
    if (!editingRecord) return;
    
    try {
      setUpdateLoading(true);
      setUpdateError(null);
      
      // Prepare updated data
      const updatedStudents = editingRecord.students.map(student => ({
        ...student,
        subjects: student.subjects.map(subject => ({
          ...subject,
          score: editMarks[student.studentId]?.[subject.name] || subject.score || 0
        }))
      }));
      
      const updateData = {
        ...editingRecord,
        students: updatedStudents
      };
      
      const response = await performanceApi.updatePerformance(editingRecord._id, updateData);
      
      if (response.success) {
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
        setIsEditing(false);
        setEditingRecord(null);
        setEditMarks({});
        // Refresh the data
        fetchMarks();
      } else {
        throw new Error(response.message || 'Failed to update performance data');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update performance data';
      setUpdateError(errorMsg);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle delete performance
  const handleDeletePerformance = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this performance record? This action cannot be undone.')) {
      return;
    }
    
    try {
      setUpdateLoading(true);
      const response = await performanceApi.deletePerformance(recordId);
      
      if (response.success) {
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
        // Refresh the data
        fetchMarks();
      } else {
        throw new Error(response.message || 'Failed to delete performance data');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete performance data';
      setUpdateError(errorMsg);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingRecord(null);
    setEditMarks({});
    setUpdateError(null);
  };

  // Filter students for search dropdown
  const filteredStudents = allStudents.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const admissionNo = student.admissionNo ? student.admissionNo.toLowerCase() : '';
    return fullName.includes(searchTerm.toLowerCase()) || 
           admissionNo.includes(searchTerm.toLowerCase());
  });

  // Handle student selection from dropdown
  const handleStudentSelectFromDropdown = (student) => {
    setSelectedStudent(student);
    setSearchTerm(`${student.firstName} ${student.lastName}`);
    setShowDropdown(false);
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setHasSearched(false);
    if (mode === 'view') {
      setViewMarks([]);
      setSubjectAnalytics({});
      setIndividualStudentData(null);
    }
  };

  // Loading component
  const LoadingSpinner = ({ message = "Loading..." }) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '300px'
    }}>
      <div style={{
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite',
        marginBottom: '15px'
      }}></div>
      <p style={{ color: '#7f8c8d', fontSize: '16px' }}>{message}</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  // Error display component
  const ErrorMessage = ({ message, onRetry }) => (
    <div style={{
      padding: '15px',
      margin: '10px 0',
      backgroundColor: '#ffebee',
      color: '#c62828',
      borderRadius: '8px',
      border: '1px solid #ffcdd2',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      animation: 'shake 0.5s ease-in-out'
    }}>
      <span style={{ fontWeight: '500' }}>{message}</span>
      {onRetry && (
        <button 
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            backgroundColor: '#c62828',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
        >
          Retry
        </button>
      )}
    </div>
  );

  // Success message component
  const SuccessMessage = ({ message }) => (
    <div style={{
      padding: '15px',
      margin: '10px 0',
      backgroundColor: '#e8f5e9',
      color: '#2e7d32',
      borderRadius: '8px',
      border: '1px solid #c8e6c9',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      fontWeight: '500',
      animation: 'bounceIn 0.8s ease-out'
    }}>
      {message}
    </div>
  );

  if (loading) {
    return <LoadingSpinner message="Loading student data..." />;
  }

  return (
    <div style={{
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      maxWidth: '1400px',
      margin: '0 auto',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInUp {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInDown {
          from { 
            opacity: 0;
            transform: translateY(-30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from { 
            opacity: 0;
            transform: translateX(-30px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from { 
            opacity: 0;
            transform: translateX(30px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes zoomIn {
          from { 
            opacity: 0;
            transform: scale(0.8);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes bounceIn {
          0% { 
            opacity: 0;
            transform: scale(0.3);
          }
          50% { 
            opacity: 1;
            transform: scale(1.05);
          }
          70% { 
            transform: scale(0.9);
          }
          100% { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes growWidth {
          from { width: 0%; }
          to { width: attr(style); }
        }
        
        @keyframes countUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .performance-analytics-section {
          animation: slideInUp 0.8s ease-out;
        }
        
        .analytics-title {
          animation: fadeIn 0.8s ease-out 0.2s both;
        }
        
        .stats-grid {
          animation: zoomIn 0.8s ease-out 0.4s both;
        }
        
        .subject-charts-grid {
          animation: slideInUp 0.8s ease-out 0.6s both;
        }
      `}</style>
      
      <h1 style={{
        textAlign: 'center',
        color: '#2c3e50',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        fontSize: '28px',
        fontWeight: '600',
        borderLeft: '5px solid #3498db',
        animation: 'slideInDown 0.8s ease-out'
      }}>
        Student Performance Management System
      </h1>
      
      {/* Status messages */}
      {saveError && <ErrorMessage message={saveError} />}
      {saveSuccess && <SuccessMessage message="Performance data saved successfully!" />}
      {updateError && <ErrorMessage message={updateError} />}
      {updateSuccess && <SuccessMessage message="Performance data updated successfully!" />}
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '30px',
        gap: '10px'
      }}>
        <button 
          style={{
            padding: '12px 30px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: viewMode === 'entry' ? '#3498db' : '#ecf0f1',
            color: viewMode === 'entry' ? 'white' : '#7f8c8d',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '16px',
            boxShadow: viewMode === 'entry' ? '0 4px 8px rgba(52, 152, 219, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
            transform: viewMode === 'entry' ? 'translateY(-2px)' : 'none',
            animation: 'fadeIn 0.8s ease-out'
          }}
          onClick={() => handleViewModeChange('entry')}
        >
          📝 Enter Marks
        </button>
        <button 
          style={{
            padding: '12px 30px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: viewMode === 'view' ? '#3498db' : '#ecf0f1',
            color: viewMode === 'view' ? 'white' : '#7f8c8d',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '16px',
            boxShadow: viewMode === 'view' ? '0 4px 8px rgba(52, 152, 219, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
            transform: viewMode === 'view' ? 'translateY(-2px)' : 'none',
            animation: 'fadeIn 0.8s ease-out 0.2s both'
          }}
          onClick={() => handleViewModeChange('view')}
        >
          📊 View Performance
        </button>
      </div>

      {viewMode === 'entry' ? (
        <form onSubmit={handleSubmit} style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          border: '1px solid #e1e8ed',
          animation: 'slideInUp 0.8s ease-out'
        }}>
          {/* Period Selection Section */}
          <div style={{ marginBottom: '35px' }}>
            <h2 style={{ 
              color: '#2c3e50', 
              marginTop: 0, 
              marginBottom: '20px',
              fontSize: '22px',
              fontWeight: '600',
              paddingBottom: '10px',
              borderBottom: '2px solid #3498db'
            }}>
              Select Period
            </h2>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              flexWrap: 'wrap',
              marginBottom: '20px'
            }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: marksData.periodType === 'weekly' ? '#e3f2fd' : 'transparent',
                borderRadius: '8px',
                border: `2px solid ${marksData.periodType === 'weekly' ? '#3498db' : '#ddd'}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: '500'
              }}>
                <input
                  type="radio"
                  value="weekly"
                  checked={marksData.periodType === 'weekly'}
                  onChange={() => dispatch({ type: 'UPDATE_PERIOD_TYPE', payload: 'weekly' })}
                  style={{ cursor: 'pointer' }}
                />
                📅 Weekly
              </label>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: marksData.periodType === 'monthly' ? '#e3f2fd' : 'transparent',
                borderRadius: '8px',
                border: `2px solid ${marksData.periodType === 'monthly' ? '#3498db' : '#ddd'}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: '500'
              }}>
                <input
                  type="radio"
                  value="monthly"
                  checked={marksData.periodType === 'monthly'}
                  onChange={() => dispatch({ type: 'UPDATE_PERIOD_TYPE', payload: 'monthly' })}
                  style={{ cursor: 'pointer' }}
                />
                📆 Monthly
              </label>
            </div>
            
            {marksData.periodType === 'weekly' ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap'
              }}>
                {/* Week display */}
                <div style={{
                  padding: '12px 16px',
                  border: '2px solid #e1e8ed',
                  borderRadius: '8px',
                  minWidth: '180px',
                  backgroundColor: '#f8f9fa',
                  color: '#495057',
                  fontWeight: '500',
                  fontSize: '16px'
                }}>
                  <strong>📅 Week: </strong>
                  {marksData.week ? formatWeekLabel(marksData.week) : 'Select a date'}
                </div>
                
                {/* Date selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                    Select Date:
                  </label>
                  <input
                    type="date"
                    value={marksData.date}
                    onChange={(e) => dispatch({ type: 'UPDATE_DATE', payload: e.target.value })}
                    required
                    style={{
                      padding: '12px 16px',
                      border: '2px solid #e1e8ed',
                      borderRadius: '8px',
                      minWidth: '180px',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                    Year:
                  </label>
                  <select
                    value={marksData.year}
                    onChange={(e) => dispatch({ type: 'UPDATE_YEAR', payload: e.target.value })}
                    required
                    style={{
                      padding: '12px 16px',
                      border: '2px solid #e1e8ed',
                      borderRadius: '8px',
                      minWidth: '140px',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                  >
                    <option value="">Select Year</option>
                    {yearOptions.map(year => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap'
              }}>
                {/* Month display */}
                <div style={{
                  padding: '12px 16px',
                  border: '2px solid #e1e8ed',
                  borderRadius: '8px',
                  minWidth: '180px',
                  backgroundColor: '#f8f9fa',
                  color: '#495057',
                  fontWeight: '500',
                  fontSize: '16px'
                }}>
                  <strong>📆 Month: </strong>
                  {marksData.month ? marksData.month.charAt(0).toUpperCase() + marksData.month.slice(1) : 'Select a date'}
                </div>
                
                {/* Date selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                    Select Date:
                  </label>
                  <input
                    type="date"
                    value={marksData.date}
                    onChange={(e) => dispatch({ type: 'UPDATE_DATE', payload: e.target.value })}
                    required
                    style={{
                      padding: '12px 16px',
                      border: '2px solid #e1e8ed',
                      borderRadius: '8px',
                      minWidth: '180px',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                    Year:
                  </label>
                  <select
                    value={marksData.year}
                    onChange={(e) => dispatch({ type: 'UPDATE_YEAR', payload: e.target.value })}
                    required
                    style={{
                      padding: '12px 16px',
                      border: '2px solid #e1e8ed',
                      borderRadius: '8px',
                      minWidth: '140px',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                  >
                    <option value="">Select Year</option>
                    {yearOptions.map(year => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            {/* Information text */}
            <div style={{
              marginTop: '15px',
              padding: '15px',
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#1565c0',
              border: '1px solid #bbdefb',
              lineHeight: '1.5'
            }}>
              <strong>💡 Note:</strong> {marksData.periodType === 'weekly' 
                ? 'Week is automatically determined from the selected date (Week 1: 1st-7th, Week 2: 8th-14th, Week 3: 15th-21st, Week 4: 22nd-31st)' 
                : 'Month is automatically determined from the selected date'}
            </div>
          </div>

          {/* Grade Level Selection */}
          <div style={{ marginBottom: '35px' }}>
            <h2 style={{ 
              color: '#2c3e50', 
              marginTop: 0, 
              marginBottom: '20px',
              fontSize: '22px',
              fontWeight: '600',
              paddingBottom: '10px',
              borderBottom: '2px solid #3498db'
            }}>
              Select Grade Level
            </h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {gradeLevels.map(level => (
                <button
                  key={level.value}
                  type="button"
                  style={{
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: activeGradeLevel === level.value ? '#3498db' : '#ecf0f1',
                    color: activeGradeLevel === level.value ? 'white' : '#7f8c8d',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '15px',
                    boxShadow: activeGradeLevel === level.value ? '0 4px 8px rgba(52, 152, 219, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                    transform: activeGradeLevel === level.value ? 'translateY(-2px)' : 'none'
                  }}
                  onClick={() => handleGradeLevelChange(level.value)}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Class Selection */}
          {classes.length > 0 && (
            <div style={{ marginBottom: '35px' }}>
              <h2 style={{ 
                color: '#2c3e50', 
                marginTop: 0, 
                marginBottom: '20px',
                fontSize: '22px',
                fontWeight: '600',
                paddingBottom: '10px',
                borderBottom: '2px solid #3498db'
              }}>
                Select Class
              </h2>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <button
                  key="all"
                  type="button"
                  style={{
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: activeClass === '' ? '#3498db' : '#ecf0f1',
                    color: activeClass === '' ? 'white' : '#7f8c8d',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '15px',
                    boxShadow: activeClass === '' ? '0 4px 8px rgba(52, 152, 219, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                    transform: activeClass === '' ? 'translateY(-2px)' : 'none'
                  }}
                  onClick={() => handleClassChange('')}
                >
                  All Classes
                </button>
                {classes.map(className => (
                  <button
                    key={className}
                    type="button"
                    style={{
                      padding: '12px 20px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: activeClass === className ? '#3498db' : '#ecf0f1',
                      color: activeClass === className ? 'white' : '#7f8c8d',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '15px',
                      boxShadow: activeClass === className ? '0 4px 8px rgba(52, 152, 219, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                      transform: activeClass === className ? 'translateY(-2px)' : 'none'
                    }}
                    onClick={() => handleClassChange(className)}
                  >
                    Class {className}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subject Selection */}
          <div style={{ marginBottom: '35px' }}>
            <h2 style={{ 
              color: '#2c3e50', 
              marginTop: 0, 
              marginBottom: '20px',
              fontSize: '22px',
              fontWeight: '600',
              paddingBottom: '10px',
              borderBottom: '2px solid #3498db'
            }}>
              Select Subjects
            </h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              {subjects.map(subject => (
                <label key={subject._id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 18px',
                  backgroundColor: subject.selected ? '#e3f2fd' : 'white',
                  borderRadius: '8px',
                  border: `2px solid ${subject.selected ? '#3498db' : '#e1e8ed'}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: '500',
                  fontSize: '15px',
                  boxShadow: subject.selected ? '0 4px 8px rgba(52, 152, 219, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                  transform: subject.selected ? 'translateY(-2px)' : 'none'
                }}>
                  <input
                    type="checkbox"
                    checked={subject.selected}
                    onChange={() => handleSubjectChange(subject._id)}
                    style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                  />
                  {subject.name}
                </label>
              ))}
            </div>
          </div>

          {/* Student Selection and Marks Entry */}
          <div style={{ marginBottom: '35px' }}>
            <h2 style={{ 
              color: '#2c3e50', 
              marginTop: 0, 
              marginBottom: '20px',
              fontSize: '22px',
              fontWeight: '600',
              paddingBottom: '10px',
              borderBottom: '2px solid #3498db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>Select Students and Enter Marks</span>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
              >
                {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
              </button>
            </h2>
            <div style={{ 
              overflowX: 'auto',
              borderRadius: '8px',
              border: '1px solid #e1e8ed',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                marginTop: '10px',
                fontSize: '14px'
              }}>
                <thead>
                  <tr>
                    <th style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      backgroundColor: '#3498db', 
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '15px',
                      borderBottom: '2px solid #2980b9'
                    }}>
                      Select
                    </th>
                    <th style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      backgroundColor: '#3498db', 
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '15px',
                      borderBottom: '2px solid #2980b9'
                    }}>
                      Student Name
                    </th>
                    <th style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      backgroundColor: '#3498db', 
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '15px',
                      borderBottom: '2px solid #2980b9'
                    }}>
                      Class
                    </th>
                    <th style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      backgroundColor: '#3498db', 
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '15px',
                      borderBottom: '2px solid #2980b9'
                    }}>
                      Admission No
                    </th>
                    {subjects.filter(s => s.selected).map(subject => (
                      <th key={subject._id} style={{ 
                        padding: '16px', 
                        textAlign: 'left', 
                        backgroundColor: '#3498db', 
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '15px',
                        borderBottom: '2px solid #2980b9'
                      }}>
                        {subject.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.length > 0 ? (
                    students.map(student => (
                      <tr key={student._id} style={{ 
                        borderBottom: '1px solid #e1e8ed', 
                        backgroundColor: selectedStudents.includes(student._id) ? '#f8f9fa' : 'white',
                        transition: 'background-color 0.3s ease'
                      }}>
                        <td style={{ padding: '14px' }}>
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student._id)}
                            onChange={() => handleStudentSelect(student._id)}
                            style={{ 
                              cursor: 'pointer',
                              transform: 'scale(1.2)'
                            }}
                          />
                        </td>
                        <td style={{ padding: '14px', fontWeight: '500' }}>
                          {`${student.firstName} ${student.lastName}`}
                        </td>
                        <td style={{ padding: '14px', color: '#7f8c8d' }}>
                          {student.class}
                        </td>
                        <td style={{ padding: '14px', color: '#7f8c8d' }}>
                          {student.admissionNo}
                        </td>
                        {subjects.filter(s => s.selected).map(subject => (
                          <td key={subject._id} style={{ padding: '14px' }}>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              disabled={!selectedStudents.includes(student._id)}
                              value={marksData.marks[student._id]?.[subject.name] || ''}
                              onChange={(e) => handleMarksChange(student._id, subject.name, e.target.value)}
                              style={{
                                width: '70px',
                                padding: '8px',
                                border: '2px solid #e1e8ed',
                                borderRadius: '6px',
                                textAlign: 'center',
                                fontWeight: '500',
                                transition: 'all 0.3s ease',
                                outline: 'none',
                                backgroundColor: selectedStudents.includes(student._id) ? 'white' : '#f8f9fa'
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={subjects.filter(s => s.selected).length + 4} style={{ 
                        padding: '30px', 
                        textAlign: 'center',
                        color: '#7f8c8d',
                        fontSize: '16px'
                      }}>
                        No students found for this grade level and class.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={saving} 
            style={{
              padding: '15px 40px',
              backgroundColor: saving ? '#95a5a6' : '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'block',
              margin: '30px auto',
              transition: 'all 0.3s ease',
              fontWeight: '600',
              boxShadow: saving ? 'none' : '0 4px 8px rgba(46, 204, 113, 0.3)',
              transform: saving ? 'none' : 'translateY(-2px)',
              animation: saving ? 'pulse 1.5s infinite' : 'bounceIn 0.8s ease-out'
            }}
          >
            {saving ? '⏳ Saving...' : '💾 Save Marks'}
          </button>
        </form>
      ) : (
        /* View Performance Section */
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          border: '1px solid #e1e8ed',
          animation: 'slideInUp 0.8s ease-out'
        }}>
          <h2 style={{ 
            color: '#2c3e50', 
            marginTop: 0,
            marginBottom: '25px',
            fontSize: '24px',
            fontWeight: '600',
            paddingBottom: '12px',
            borderBottom: '2px solid #3498db',
            animation: 'fadeIn 0.8s ease-out'
          }}>
            Student Performance Overview
          </h2>
          
          {/* Search and Filter Section */}
          <div style={{ 
            marginBottom: '25px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '12px',
            border: '1px solid #e1e8ed',
            animation: 'slideInUp 0.8s ease-out 0.2s both'
          }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '20px',
              fontSize: '20px',
              fontWeight: '600',
              color: '#2c3e50',
              animation: 'fadeIn 0.8s ease-out 0.4s both'
            }}>
              🔍 Search and Filter
            </h3>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
              {/* Student Search */}
              <div style={{ flex: '1', minWidth: '280px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                  Search Student:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search by name or admission number"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowDropdown(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowDropdown(searchTerm.length > 0)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e1e8ed',
                      borderRadius: '8px',
                      fontSize: '15px',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                  />
                  {showDropdown && filteredStudents.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '2px solid #3498db',
                      borderRadius: '8px',
                      maxHeight: '250px',
                      overflowY: 'auto',
                      zIndex: 10,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}>
                      {filteredStudents.map(student => (
                        <div
                          key={student._id}
                          onClick={() => handleStudentSelectFromDropdown(student)}
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f1f1',
                            transition: 'background-color 0.2s ease',
                            fontSize: '14px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f8f9fa';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'white';
                          }}
                        >
                          {`${student.firstName} ${student.lastName} (${student.admissionNo || 'No ID'}) - Class ${student.class || 'N/A'}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedStudent && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '12px', 
                    backgroundColor: '#e3f2fd', 
                    borderRadius: '8px',
                    border: '1px solid #bbdefb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    animation: 'bounceIn 0.6s ease-out'
                  }}>
                    <span style={{ fontWeight: '500' }}>
                      👤 Selected: {selectedStudent.firstName} {selectedStudent.lastName}
                    </span>
                    <button 
                      onClick={() => {
                        setSelectedStudent(null);
                        setSearchTerm('');
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '13px'
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              
              {/* Period Type */}
              <div style={{ flex: '1', minWidth: '160px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                  Period Type:
                </label>
                <select
                  value={viewPeriodType}
                  onChange={(e) => setViewPeriodType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '15px',
                    backgroundColor: 'white',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                >
                  <option value="weekly">📅 Weekly</option>
                  <option value="monthly">📆 Monthly</option>
                </select>
              </div>
              
              {/* Week Selection */}
              <div style={{ flex: '1', minWidth: '160px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                  {viewPeriodType === 'weekly' ? 'Select Week:' : 'Filter by Week:'}
                </label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '15px',
                    backgroundColor: 'white',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                >
                  {weekOptions.map(week => (
                    <option key={week.value} value={week.value}>
                      {week.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Month Selection */}
              <div style={{ flex: '1', minWidth: '160px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                  {viewPeriodType === 'monthly' ? 'Select Month:' : 'Filter by Month:'}
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '15px',
                    backgroundColor: 'white',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                >
                  {monthOptions.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Year Selection */}
              <div style={{ flex: '1', minWidth: '140px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                  Select Year:
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '15px',
                    backgroundColor: 'white',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                >
                  {yearOptions.map(year => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                      </option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              onClick={fetchMarks}
              disabled={viewMarksLoading}
              style={{
                padding: '12px 24px',
                backgroundColor: viewMarksLoading ? '#95a5a6' : '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: viewMarksLoading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                animation: viewMarksLoading ? 'pulse 1.5s infinite' : 'bounceIn 0.8s ease-out 0.6s both'
              }}
            >
              {viewMarksLoading ? '⏳ Loading...' : '🔍 Apply Filters'}
            </button>
          </div>

          {/* Performance Analytics Section */}
          {hasSearched && (
            <div className="performance-analytics-section" style={{ marginBottom: '35px' }}>
              <h3 className="analytics-title" style={{ 
                marginTop: 0, 
                marginBottom: '20px',
                fontSize: '22px',
                fontWeight: '600',
                color: '#2c3e50',
                paddingBottom: '10px',
                borderBottom: '2px solid #3498db'
              }}>
                📊 Performance Analytics
              </h3>
              
              {selectedStudent ? (
                // Individual Student Analytics
                <div>
                  {individualStudentData ? (
                    <div>
                      {/* Individual Student Performance Card */}
                      <StudentPerformanceCard studentData={individualStudentData} />
                      
                      {/* Subject-wise Charts for Individual Student */}
                      {Object.keys(subjectAnalytics).length > 0 && (
                        <div>
                          <h4 style={{
                            margin: '25px 0 15px 0',
                            color: '#2c3e50',
                            fontSize: '20px',
                            fontWeight: '600',
                            animation: 'fadeIn 0.8s ease-out 0.4s both'
                          }}>
                            Week-wise Performance Charts
                          </h4>
                          <div className="subject-charts-grid" style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                            gap: '20px'
                          }}>
                            {Object.keys(subjectAnalytics).map(subjectName => (
                              <SubjectChart
                                key={subjectName}
                                title={`${subjectName} Performance`}
                                data={subjectAnalytics[subjectName]}
                                type="bar"
                                selectedWeek={selectedWeek}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '12px',
                      color: '#7f8c8d',
                      fontSize: '16px',
                      animation: 'fadeIn 0.8s ease-out'
                    }}>
                      <p>📊 No performance data available for {selectedStudent.firstName} {selectedStudent.lastName} with the selected filters.</p>
                    </div>
                  )}
                </div>
              ) : (
                // Class-level Analytics
                <div>
                  {/* Overall Statistics */}
                  {Object.keys(subjectAnalytics).length > 0 && (
                    <div className="stats-grid" style={{ 
                      display: 'flex', 
                      gap: '20px', 
                      marginBottom: '30px',
                      flexWrap: 'wrap'
                    }}>
                      <PerformanceCard 
                        title="Overall Average" 
                        value={`${overallStats.average || 0}%`} 
                        subtitle="Class Performance" 
                        color="#3498db"
                      />
                      <PerformanceCard 
                        title="Total Students" 
                        value={overallStats.totalStudents || 0} 
                        subtitle="Analyzed" 
                        color="#9b59b6"
                      />
                      <PerformanceCard 
                        title="Records" 
                        value={overallStats.totalRecords || 0} 
                        subtitle="Performance Entries" 
                        color="#e67e22"
                      />
                    </div>
                  )}
                  
                  {/* Subject-wise Charts */}
                  {Object.keys(subjectAnalytics).length > 0 ? (
                    <div className="subject-charts-grid" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                      gap: '20px'
                    }}>
                      {Object.keys(subjectAnalytics).map(subjectName => (
                        <SubjectChart
                          key={subjectName}
                          title={`${subjectName} Performance`}
                          data={subjectAnalytics[subjectName]}
                          type="bar"
                          selectedWeek={selectedWeek}
                        />
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '12px',
                      color: '#7f8c8d',
                      fontSize: '16px',
                      animation: 'fadeIn 0.8s ease-out'
                    }}>
                      <p>📊 No performance data available for the selected filters.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Performance Data Display */}
          {hasSearched ? (
            viewMarksLoading ? (
              <LoadingSpinner message="Loading performance data..." />
            ) : viewMarksError ? (
              <ErrorMessage message={viewMarksError} onRetry={fetchMarks} />
            ) : viewMarks.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '50px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '12px',
                color: '#7f8c8d',
                fontSize: '18px',
                animation: 'fadeIn 0.8s ease-out'
              }}>
                <p>📊 No performance data available for the selected filters.</p>
                <p style={{ fontSize: '14px', marginTop: '10px' }}>Try adjusting your search criteria</p>
              </div>
            ) : (
              viewMarks.map(record => (
                <div key={record._id} style={{ 
                  marginBottom: '35px', 
                  padding: '20px', 
                  border: '2px solid #e1e8ed', 
                  borderRadius: '12px',
                  backgroundColor: '#f8fafc',
                  animation: 'slideInUp 0.8s ease-out'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '20px',
                    paddingBottom: '15px',
                    borderBottom: '2px solid #e1e8ed'
                  }}>
                    <h3 style={{ 
                      color: '#2c3e50', 
                      marginTop: 0,
                      fontSize: '20px',
                      fontWeight: '600'
                    }}>
                      {record.testType === 'weekly' ? 
                        `📅 ${formatWeekLabel(record.week)}` : 
                        `📆 ${record.month ? record.month.charAt(0).toUpperCase() + record.month.slice(1) : 'All Months'}`}
                      <span style={{ 
                        fontSize: '14px', 
                        color: '#7f8c8d', 
                        marginLeft: '15px',
                        fontWeight: 'normal'
                      }}>
                        (Date: {formatDate(record.date)}, Year: {record.year})
                      </span>
                    </h3>
                  </div>
                  
                  {/* Edit Mode */}
                  {isEditing && editingRecord && editingRecord._id === record._id && (
                    <div style={{
                      marginBottom: '20px',
                      padding: '20px',
                      backgroundColor: '#fff3cd',
                      border: '2px solid #ffeaa7',
                      borderRadius: '8px',
                      animation: 'slideInDown 0.5s ease-out'
                    }}>
                      <h4 style={{
                        margin: '0 0 15px 0',
                        color: '#856404',
                        fontSize: '18px',
                        fontWeight: '600'
                      }}>
                        ✏️ Edit Mode - Update Marks
                      </h4>
                      
                      <div style={{ 
                        overflowX: 'auto',
                        borderRadius: '8px',
                        border: '1px solid #e1e8ed'
                      }}>
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse',
                          fontSize: '14px'
                        }}>
                          <thead>
                            <tr>
                              <th style={{ 
                                padding: '16px', 
                                textAlign: 'left', 
                                backgroundColor: '#f39c12', 
                                color: 'white',
                                fontWeight: '600',
                                fontSize: '15px'
                              }}>
                                Student Name
                              </th>
                              <th style={{ 
                                padding: '16px', 
                                textAlign: 'left', 
                                backgroundColor: '#f39c12', 
                                color: 'white',
                                fontWeight: '600',
                                fontSize: '15px'
                              }}>
                                Class
                              </th>
                              {defaultSubjects.map(subject => (
                                <th key={subject._id} style={{ 
                                  padding: '16px', 
                                  textAlign: 'left', 
                                  backgroundColor: '#f39c12', 
                                  color: 'white',
                                  fontWeight: '600',
                                  fontSize: '15px'
                                }}>
                                  {subject.name}
                                </th>
                              ))}
                              <th style={{ 
                                padding: '16px', 
                                textAlign: 'left', 
                                backgroundColor: '#f39c12', 
                                color: 'white',
                                fontWeight: '600',
                                fontSize: '15px'
                              }}>
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.students && record.students.map(studentRecord => {
                              const student = allStudents.find(s => s._id === studentRecord.studentId) || { 
                                firstName: 'Unknown', 
                                lastName: 'Student', 
                                class: 'N/A' 
                              };
                              
                              return (
                                <tr key={studentRecord.studentId}>
                                  <td style={{ padding: '14px', fontWeight: '500' }}>
                                    {`${student.firstName} ${student.lastName}`}
                                  </td>
                                  <td style={{ padding: '14px', color: '#7f8c8d' }}>
                                    {student.class}
                                  </td>
                                  
                                  {/* Editable marks for each subject */}
                                  {defaultSubjects.map(subject => {
                                    const subjectScore = studentRecord.subjects.find(s => s.name === subject.name);
                                    return (
                                      <td key={subject._id} style={{ padding: '14px' }}>
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={editMarks[studentRecord.studentId]?.[subject.name] ?? subjectScore?.score ?? ''}
                                          onChange={(e) => handleEditMarksChange(studentRecord.studentId, subject.name, e.target.value)}
                                          style={{
                                            width: '70px',
                                            padding: '8px',
                                            border: '2px solid #3498db',
                                            borderRadius: '6px',
                                            textAlign: 'center',
                                            fontWeight: '500',
                                            backgroundColor: 'white',
                                            transition: 'all 0.3s ease',
                                            outline: 'none'
                                          }}
                                        />
                                      </td>
                                    );
                                  })}
                                  
                                  {/* Action buttons for each student */}
                                  <td style={{ padding: '14px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button
                                        onClick={handleUpdatePerformance}
                                        disabled={updateLoading}
                                        style={{
                                          padding: '6px 12px',
                                          backgroundColor: updateLoading ? '#95a5a6' : '#2ecc71',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: updateLoading ? 'not-allowed' : 'pointer',
                                          fontWeight: '500',
                                          fontSize: '12px',
                                          transition: 'all 0.3s ease'
                                        }}
                                      >
                                        {updateLoading ? '⏳' : '💾'}
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        style={{
                                          padding: '6px 12px',
                                          backgroundColor: '#95a5a6',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontWeight: '500',
                                          fontSize: '12px',
                                          transition: 'all 0.3s ease'
                                        }}
                                      >
                                        ❌
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button
                          onClick={handleUpdatePerformance}
                          disabled={updateLoading}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: updateLoading ? '#95a5a6' : '#2ecc71',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: updateLoading ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {updateLoading ? '⏳ Updating...' : '💾 Update All Marks'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#95a5a6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Performance Table */}
                  <div style={{ 
                    overflowX: 'auto',
                    borderRadius: '8px',
                    border: '1px solid #e1e8ed'
                  }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr>
                          <th style={{ 
                            padding: '16px', 
                            textAlign: 'left', 
                            backgroundColor: '#3498db', 
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '15px'
                          }}>
                            Student Name
                          </th>
                          <th style={{ 
                            padding: '16px', 
                            textAlign: 'left', 
                            backgroundColor: '#3498db', 
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '15px'
                          }}>
                            Class
                          </th>
                          {defaultSubjects.map(subject => (
                            <th key={subject._id} style={{ 
                              padding: '16px', 
                              textAlign: 'left', 
                              backgroundColor: '#3498db', 
                              color: 'white',
                              fontWeight: '600',
                              fontSize: '15px'
                            }}>
                              {subject.name}
                            </th>
                          ))}
                          <th style={{ 
                            padding: '16px', 
                            textAlign: 'left', 
                            backgroundColor: '#3498db', 
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '15px'
                          }}>
                            Average
                          </th>
                          <th style={{ 
                            padding: '16px', 
                            textAlign: 'left', 
                            backgroundColor: '#3498db', 
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '15px'
                          }}>
                            Grade
                          </th>
                          <th style={{ 
                            padding: '16px', 
                            textAlign: 'left', 
                            backgroundColor: '#3498db', 
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '15px'
                          }}>
                            Remarks
                          </th>
                          <th style={{ 
                            padding: '16px', 
                            textAlign: 'left', 
                            backgroundColor: '#3498db', 
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '15px'
                          }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {record.students && record.students.map(studentRecord => {
                          const student = allStudents.find(s => s._id === studentRecord.studentId) || { 
                            firstName: 'Unknown', 
                            lastName: 'Student', 
                            class: 'N/A' 
                          };
                          
                          // Calculate total and average
                          const totalMarks = studentRecord.subjects.reduce((sum, subject) => sum + (subject.score || 0), 0);
                          const average = studentRecord.subjects.length > 0 ? totalMarks / studentRecord.subjects.length : 0;
                          const { grade, remarks, color } = getGradeAndRemarks(average);
                          
                          return (
                            <tr key={studentRecord.studentId}>
                              <td style={{ padding: '14px', fontWeight: '500' }}>
                                {`${student.firstName} ${student.lastName}`}
                              </td>
                              <td style={{ padding: '14px', color: '#7f8c8d' }}>
                                {student.class}
                              </td>
                              
                              {/* Show marks for each subject */}
                              {defaultSubjects.map(subject => {
                                const subjectScore = studentRecord.subjects.find(s => s.name === subject.name);
                                return (
                                  <td key={subject._id} style={{ padding: '14px' }}>
                                    <span style={{ 
                                      fontWeight: '600', 
                                      fontSize: '16px',
                                      color: '#2c3e50'
                                    }}>
                                      {subjectScore ? subjectScore.score : '-'}
                                    </span>
                                    <span style={{ 
                                      fontSize: '12px', 
                                      color: '#7f8c8d', 
                                      display: 'block'
                                    }}>
                                      /100
                                    </span>
                                  </td>
                                );
                              })}
                              
                              <td style={{ padding: '14px' }}>
                                <span style={{ 
                                  fontWeight: 'bold', 
                                  color: '#2c3e50',
                                  fontSize: '16px'
                                }}>
                                  {average.toFixed(1)}%
                                </span>
                              </td>
                              <td style={{ 
                                padding: '14px', 
                                fontWeight: 'bold', 
                                color: color,
                                fontSize: '16px'
                              }}>
                                {grade}
                              </td>
                              <td style={{ 
                                padding: '14px', 
                                color: color,
                                fontWeight: '500'
                              }}>
                                {remarks}
                              </td>
                              <td style={{ padding: '14px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => handleEdit(record)}
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#3498db',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontWeight: '500',
                                      fontSize: '12px',
                                      transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = '#2980b9';
                                      e.target.style.transform = 'scale(1.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = '#3498db';
                                      e.target.style.transform = 'scale(1)';
                                    }}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeletePerformance(record._id)}
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#e74c3c',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontWeight: '500',
                                      fontSize: '12px',
                                      transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = '#c0392b';
                                      e.target.style.transform = 'scale(1.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = '#e74c3c';
                                      e.target.style.transform = 'scale(1)';
                                    }}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '12px',
              color: '#6c757d',
              fontSize: '18px',
              animation: 'fadeIn 0.8s ease-out'
            }}>
              <p>🔍 Please search for a student and apply filters to view performance data.</p>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>Use the filters above to get started</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentPerformance;