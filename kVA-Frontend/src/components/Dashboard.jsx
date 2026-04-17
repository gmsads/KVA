import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import StudentForm from './StudentForm';
import ManagementDetails from './ManagementDetails';
import AllStudents from './AllStudents';
import Attendance from './Attendance';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, Line
} from 'recharts';

const Dashboard = () => {
  // State declarations for statistics
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    primaryStudents: 0,
    secondaryStudents: 0,
    highSchoolStudents: 0,
    seniorStudents: 0
  });

  // State declarations for staff statistics
  const [staffStats, setStaffStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    teachingStaff: 0,
    monthlySalary: 0
  });

  // State declarations for performance data
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [admissionReferenceData, setAdmissionReferenceData] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allPerformanceData, setAllPerformanceData] = useState([]);

  // State declarations for loading states
  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(true);
  const [refLoading, setRefLoading] = useState(true);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // State declarations for modal visibility
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [studentsFilter, setStudentsFilter] = useState('all');

  // State declarations for distribution filters
  const [distributionFilter, setDistributionFilter] = useState('all');
  const [distributionMonth, setDistributionMonth] = useState(new Date().getMonth() + 1);
  const [distributionYear, setDistributionYear] = useState(new Date().getFullYear());

  // State declarations for reference filters
  const [referenceFilter, setReferenceFilter] = useState('all');
  const [referenceMonth, setReferenceMonth] = useState(new Date().getMonth() + 1);
  const [referenceYear, setReferenceYear] = useState(new Date().getFullYear());

  // State declarations for performance filters
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [performanceMonth, setPerformanceMonth] = useState(new Date().getMonth() + 1);
  const [performanceYear, setPerformanceYear] = useState(new Date().getFullYear());

  // State declarations for reference student details
  const [selectedReference, setSelectedReference] = useState(null);
  const [referenceStudents, setReferenceStudents] = useState([]);

  // State declarations for attendance data
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceFilter, setAttendanceFilter] = useState("month");
  const [attendanceMonth, setAttendanceMonth] = useState(new Date().getMonth() + 1);
  const [attendanceYear, setAttendanceYear] = useState(new Date().getFullYear());
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  // Month names array for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Week options matching Student Performance module - FIXED as per requirements
  const weekOptions = [
    { value: 'week1', label: 'Week 1: 1st to 7th' },
    { value: 'week2', label: 'Week 2: 8th to 14th' },
    { value: 'week3', label: 'Week 3: 15th to 21st' },
    { value: 'week4', label: 'Week 4: 22nd to 31st' }
  ];

  // Function to get date range for each week (FIXED to exact requirements)
  const getWeekDateRange = (weekValue, month, year) => {
    // Define fixed date ranges exactly as specified
    const weekRanges = {
      week1: { start: 1, end: 7 },
      week2: { start: 8, end: 14 },
      week3: { start: 15, end: 21 },
      week4: { start: 22, end: 31 } // Fixed to 31st as per requirements
    };

    return weekRanges[weekValue] || { start: 1, end: 7 };
  };

  // Function to get week label with date range (FIXED)
  const getWeekLabelWithRange = (weekValue, month, year) => {
    const range = getWeekDateRange(weekValue, month, year);
    const monthAbbr = monthNames[month - 1]?.substring(0, 3) || 'Unknown';
    return `Week ${weekValue.replace('week', '')} (${range.start}-${range.end})`;
  };

  // Function to determine which week a date falls into (FIXED to exact requirements)
  const getWeekFromDate = (date, month, year) => {
    const day = date.getDate();
    
    // Fixed week ranges exactly as specified
    if (day >= 1 && day <= 7) return 'week1';
    if (day >= 8 && day <= 14) return 'week2';
    if (day >= 15 && day <= 21) return 'week3';
    if (day >= 22 && day <= 31) return 'week4'; // Fixed to include up to 31st
    
    return 'week1'; // Fallback
  };

  // Function to normalize date strings
  const normalizeDate = (dateString) => {
    if (!dateString) return null;

    if (dateString instanceof Date) {
      return dateString;
    }

    if (typeof dateString === 'string') {
      let date = new Date(dateString);

      if (isNaN(date.getTime())) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          date = new Date(parts[0], parts[1] - 1, parts[2]);
        }

        if (isNaN(date.getTime())) {
          const altParts = dateString.split('/');
          if (altParts.length === 3) {
            date = new Date(altParts[2], altParts[0] - 1, altParts[1]);
          }
        }
      }

      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  };

  // Function to process admission reference data
  const processAdmissionReferences = (students, filterType = 'all', month = null, year = null) => {
    let filteredStudents = students;

    if (filterType === 'monthly' && month && year) {
      filteredStudents = students.filter(student => {
        const admissionDate = normalizeDate(student.admissionDate || student.dateOfAdmission);
        if (!admissionDate) return false;

        return admissionDate.getMonth() + 1 === month &&
          admissionDate.getFullYear() === year;
      });
    } else if (filterType === 'yearly' && year) {
      filteredStudents = students.filter(student => {
        const admissionDate = normalizeDate(student.admissionDate || student.dateOfAdmission);
        if (!admissionDate) return false;

        return admissionDate.getFullYear() === year;
      });
    }

    const refCounts = {
      'walk-in': 0,
      'referral': 0,
      'online-ad': 0,
      'social-media': 0,
      'other': 0
    };

    filteredStudents.forEach(student => {
      const ref = student.admissionReference || student.referenceSource || 'other';
      const normalizedRef = ref.toLowerCase().replace(/\s+/g, '-');

      if (normalizedRef === 'walk-in' || normalizedRef.includes('walk')) {
        refCounts['walk-in']++;
      } else if (normalizedRef === 'referral' || normalizedRef.includes('refer')) {
        refCounts['referral']++;
      } else if (normalizedRef === 'online-ad' || normalizedRef.includes('online')) {
        refCounts['online-ad']++;
      } else if (normalizedRef === 'social-media' || normalizedRef.includes('social')) {
        refCounts['social-media']++;
      } else {
        refCounts['other']++;
      }
    });

    const formattedData = Object.entries(refCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({
        name: name.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        count,
        originalName: name
      }));

    setAdmissionReferenceData(formattedData);
    setRefLoading(false);
  };

  // Function to handle bar chart click for reference details
  const handleBarClick = (data, index, event) => {
    if (data.originalName !== 'referral') {
      return;
    }

    const referenceType = data.originalName;

    let filteredStudents = allStudents;

    if (referenceFilter === 'monthly' && referenceMonth && referenceYear) {
      filteredStudents = filteredStudents.filter(student => {
        const admissionDate = normalizeDate(student.admissionDate || student.dateOfAdmission);
        if (!admissionDate) return false;

        return admissionDate.getMonth() + 1 === referenceMonth &&
          admissionDate.getFullYear() === referenceYear;
      });
    } else if (referenceFilter === 'yearly' && referenceYear) {
      filteredStudents = filteredStudents.filter(student => {
        const admissionDate = normalizeDate(student.admissionDate || student.dateOfAdmission);
        if (!admissionDate) return false;

        return admissionDate.getFullYear() === referenceYear;
      });
    }

    const studentsByReference = filteredStudents.filter(student => {
      const ref = student.admissionReference || student.referenceSource || 'other';
      const normalizedRef = ref.toLowerCase().replace(/\s+/g, '-');

      if (referenceType === 'referral' && (normalizedRef === 'referral' || normalizedRef.includes('refer'))) {
        return true;
      }
      return false;
    });

    setReferenceStudents(studentsByReference);
    setSelectedReference(data.name);
  };

  // Function to close student details modal
  const handleCloseStudentDetails = () => {
    setSelectedReference(null);
    setReferenceStudents([]);
  };

  // Function to process student distribution data
  const processStudentDistribution = (students, filterType = 'all', month = null, year = null) => {
    let filteredStudents = students;

    if (filterType === 'monthly' && month && year) {
      filteredStudents = students.filter(student => {
        const admissionDate = normalizeDate(student.admissionDate || student.dateOfAdmission);
        if (!admissionDate) return false;

        return admissionDate.getMonth() + 1 === month &&
          admissionDate.getFullYear() === year;
      });
    } else if (filterType === 'yearly' && year) {
      filteredStudents = students.filter(student => {
        const admissionDate = normalizeDate(student.admissionDate || student.dateOfAdmission);
        if (!admissionDate) return false;

        return admissionDate.getFullYear() === year;
      });
    }

    const totalStudents = filteredStudents.length;
    const activeStudents = filteredStudents.filter(student =>
      student.status === 'active' || student.isActive
    ).length;

    const primaryStudents = filteredStudents.filter(student =>
      student.level && student.level.toLowerCase().includes('primary')
    ).length;

    const secondaryStudents = filteredStudents.filter(student =>
      student.level && student.level.toLowerCase().includes('secondary')
    ).length;

    const highSchoolStudents = filteredStudents.filter(student =>
      student.level && student.level.toLowerCase().includes('high')
    ).length;

    const seniorStudents = filteredStudents.filter(student =>
      student.level && student.level.toLowerCase().includes('senior')
    ).length;

    setStats({
      totalStudents,
      activeStudents,
      primaryStudents,
      secondaryStudents,
      highSchoolStudents,
      seniorStudents
    });
  };

  // Main function to process performance data
  const processPerformanceData = async (filterType = 'all', month = null, year = null) => {
    try {
      setPerformanceLoading(true);
      
      const response = await fetch(`http://localhost:5000/api/performance`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch performance data');
      }
      
      const performanceRecords = result.data || [];
      
      let filteredRecords = performanceRecords;

      if (filterType === 'monthly' && month && year) {
        filteredRecords = performanceRecords.filter(record => {
          const recordDate = record.date ? new Date(record.date) : new Date(year, month - 1, 1);
          const recordMonth = recordDate.getMonth() + 1;
          const recordYear = recordDate.getFullYear();
          return recordMonth === month && recordYear === year;
        });
      } else if (filterType === 'yearly' && year) {
        filteredRecords = performanceRecords.filter(record => {
          const recordDate = record.date ? new Date(record.date) : new Date(year, 0, 1);
          return recordDate.getFullYear() === year;
        });
      }

      let performanceData = [];

      if (filterType === 'monthly' && month && year) {
        performanceData = processWeeklyPerformance(filteredRecords, month, year);
      } else if (filterType === 'yearly' && year) {
        performanceData = processMonthlyPerformance(filteredRecords, year);
      } else {
        performanceData = processYearlyPerformance(performanceRecords);
      }

      setStudentPerformance(performanceData);
      setPerformanceLoading(false);
      
    } catch (error) {
      console.error('Error processing performance data:', error);
      toast.error(`Error loading performance data: ${error.message}`);
      setStudentPerformance([]);
      setPerformanceLoading(false);
    }
  };

  // FIXED: processWeeklyPerformance function with shorter labels for better display
  const processWeeklyPerformance = (records, month, year) => {
    const weeklyAverages = {};
    
    // Initialize all weeks with shorter labels for better display
    weekOptions.forEach(weekOption => {
      const weekRange = getWeekDateRange(weekOption.value, month, year);
      weeklyAverages[weekOption.value] = {
        name: `W${weekOption.value.replace('week', '')}`, // Short label like "W1", "W2"
        fullName: `Week ${weekOption.value.replace('week', '')} (${weekRange.start}-${weekRange.end})`, // Full name for tooltip
        weekValue: weekOption.value,
        weekNumber: parseInt(weekOption.value.replace('week', '')),
        averageScore: 0,
        studentCount: 0,
        weekRange: weekRange,
        hasData: false
      };
    });

    // Process each record and assign to the correct week based on fixed ranges
    records.forEach(record => {
      if (record.students && record.students.length > 0) {
        const recordDate = record.date ? new Date(record.date) : new Date(year, month - 1, 1);
        const week = getWeekFromDate(recordDate, month, year);
        
        if (weeklyAverages[week]) {
          record.students.forEach(student => {
            if (student.subjects && student.subjects.length > 0) {
              const studentTotal = student.subjects.reduce((sum, subject) => sum + (subject.score || 0), 0);
              const studentAverage = studentTotal / student.subjects.length;
              
              weeklyAverages[week].averageScore += studentAverage;
              weeklyAverages[week].studentCount += 1;
              weeklyAverages[week].hasData = true;
            }
          });
        }
      }
    });

    // Convert to array and calculate averages
    const result = Object.values(weeklyAverages)
      .map(week => ({
        ...week,
        averageScore: week.studentCount > 0 ? (week.averageScore / week.studentCount) : 0
      }))
      .sort((a, b) => a.weekNumber - b.weekNumber);

    // Only show weeks that have data
    const weeksWithData = result.filter(week => week.hasData);
    
    // If no data, show all weeks as placeholders
    return weeksWithData.length > 0 ? weeksWithData : result;
  };

  // Function to process monthly performance data
  const processMonthlyPerformance = (records, year) => {
    const monthlyAverages = {};
    
    monthNames.forEach((month, index) => {
      monthlyAverages[index + 1] = {
        name: month.substring(0, 3),
        fullName: month,
        averageScore: 0,
        studentCount: 0,
        monthNumber: index + 1
      };
    });

    records.forEach(record => {
      if (record.students && record.students.length > 0) {
        const recordDate = record.date ? new Date(record.date) : new Date(year, 0, 1);
        const month = recordDate.getMonth() + 1;
        
        if (monthlyAverages[month]) {
          record.students.forEach(student => {
            if (student.subjects && student.subjects.length > 0) {
              const studentTotal = student.subjects.reduce((sum, subject) => sum + (subject.score || 0), 0);
              const studentAverage = studentTotal / student.subjects.length;
              
              monthlyAverages[month].averageScore += studentAverage;
              monthlyAverages[month].studentCount += 1;
            }
          });
        }
      }
    });

    return Object.values(monthlyAverages).map(month => ({
      ...month,
      averageScore: month.studentCount > 0 ? (month.averageScore / month.studentCount) : 0
    })).sort((a, b) => a.monthNumber - b.monthNumber);
  };

  // Function to process yearly performance data - FIXED to remove 2001
  const processYearlyPerformance = (records) => {
    const yearlyAverages = {};
    
    const years = new Set();
    records.forEach(record => {
      const recordDate = record.date ? new Date(record.date) : new Date();
      const year = recordDate.getFullYear();
      // Filter out year 2001 and only include recent years
      if (year >= 2020) {
        years.add(year);
      }
    });

    // If no recent years, use current year
    if (years.size === 0) {
      years.add(new Date().getFullYear());
    }

    Array.from(years).sort().forEach(year => {
      yearlyAverages[year] = {
        name: year.toString(),
        averageScore: 0,
        studentCount: 0,
        year: year
      };
    });

    records.forEach(record => {
      const recordDate = record.date ? new Date(record.date) : new Date();
      const year = recordDate.getFullYear();
      
      // Skip year 2001
      if (year === 2001) return;
      
      if (!yearlyAverages[year]) {
        yearlyAverages[year] = {
          name: year.toString(),
          averageScore: 0,
          studentCount: 0,
          year: year
        };
      }

      if (record.students && record.students.length > 0) {
        record.students.forEach(student => {
          if (student.subjects && student.subjects.length > 0) {
            const studentTotal = student.subjects.reduce((sum, subject) => sum + (subject.score || 0), 0);
            const studentAverage = studentTotal / student.subjects.length;
            
            yearlyAverages[year].averageScore += studentAverage;
            yearlyAverages[year].studentCount += 1;
          }
        });
      }
    });

    return Object.values(yearlyAverages)
      .map(year => ({
        ...year,
        averageScore: year.studentCount > 0 ? (year.averageScore / year.studentCount) : 0
      }))
      .sort((a, b) => a.year - b.year);
  };

  // Function to fetch attendance data
  const fetchAttendanceData = async () => {
    try {
      setAttendanceLoading(true);
      const response = await fetch('http://localhost:5000/api/attendance');
      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();
      let attendanceRecords = [];

      if (Array.isArray(data)) {
        attendanceRecords = data;
      } else if (data.data && Array.isArray(data.data)) {
        attendanceRecords = data.data;
      } else if (data.attendance && Array.isArray(data.attendance)) {
        attendanceRecords = data.attendance;
      }

      const attendanceByDate = {};

      attendanceRecords.forEach(record => {
        const date = record.date || record.attendanceDate;
        if (!date) return;

        if (!attendanceByDate[date]) {
          attendanceByDate[date] = {
            present: 0,
            absent: 0,
            late: 0
          };
        }

        if (record.status === 'present' || record.isPresent) {
          attendanceByDate[date].present++;
        } else if (record.status === 'absent') {
          attendanceByDate[date].absent++;
        } else if (record.status === 'late') {
          attendanceByDate[date].late++;
        }
      });

      const chartData = Object.entries(attendanceByDate).map(([date, counts]) => ({
        date,
        present: counts.present,
        absent: counts.absent,
        late: counts.late,
        total: counts.present + counts.absent + counts.late
      }));

      setAttendanceData(chartData);
      setLoadingAttendance(false);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error(`Error fetching attendance data: ${error.message}`);
      setLoadingAttendance(false);
    }
  };

  // Function to fetch main data
  const fetchData = async () => {
    try {
      setLoading(true);
      setRefLoading(true);

      const studentsResponse = await fetch('http://localhost:5000/api/students');
      if (!studentsResponse.ok) {
        throw new Error('Failed to fetch students');
      }
      const studentsData = await studentsResponse.json();

      let students = [];
      if (Array.isArray(studentsData)) {
        students = studentsData;
      } else if (studentsData.data && Array.isArray(studentsData.data)) {
        students = studentsData.data;
      } else if (studentsData.students && Array.isArray(studentsData.students)) {
        students = studentsData.students;
      }

      console.log('Fetched students:', students);

      setAllStudents(students);
      processStudentDistribution(students, distributionFilter, distributionMonth, distributionYear);
      processAdmissionReferences(students, referenceFilter, referenceMonth, referenceYear);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(`Error: ${error.message}`);
      setRefLoading(false);
      setLoading(false);
    }
  };

  // Function to fetch performance data
  const fetchPerformanceData = async () => {
    await processPerformanceData(performanceFilter, performanceMonth, performanceYear);
  };

  // Function to fetch staff statistics
  const fetchStaffStats = async () => {
    try {
      setStaffLoading(true);
      const response = await fetch('http://localhost:5000/api/staff');
      if (!response.ok) throw new Error('Failed to fetch staff data');

      const staffData = await response.json();

      let staff = [];
      if (Array.isArray(staffData)) {
        staff = staffData;
      } else if (staffData.data && Array.isArray(staffData.data)) {
        staff = staffData.data;
      } else if (staffData.staff && Array.isArray(staffData.staff)) {
        staff = staffData.staff;
      }

      const totalStaff = staff.length;
      const activeStaff = staff.filter(s => s.status === 'active' || s.isActive).length;
      const teachingStaff = staff.filter(s =>
        s.position && ['Senior Teacher', 'Junior Teacher', 'Subject Teacher', 'Principal', 'Vice Principal']
          .some(pos => s.position.includes(pos))
      ).length;
      const monthlySalary = staff.reduce((total, member) => total + (Number(member.salary) || 0), 0);

      setStaffStats({
        totalStaff,
        activeStaff,
        teachingStaff,
        monthlySalary
      });
    } catch (error) {
      console.error('Error fetching staff data:', error);
      toast.error(`Error fetching staff data: ${error.message}`);
    } finally {
      setStaffLoading(false);
    }
  };

  // Effect to fetch data on component mount
  useEffect(() => {
    fetchData();
    fetchStaffStats();
    fetchPerformanceData();
    fetchAttendanceData();
  }, []);

  // Effect to update distribution when filters change
  useEffect(() => {
    if (allStudents.length > 0) {
      setLoading(true);
      processStudentDistribution(allStudents, distributionFilter, distributionMonth, distributionYear);
      setLoading(false);
    }
  }, [distributionFilter, distributionMonth, distributionYear, allStudents]);

  // Effect to update references when filters change
  useEffect(() => {
    if (allStudents.length > 0) {
      setRefLoading(true);
      processAdmissionReferences(allStudents, referenceFilter, referenceMonth, referenceYear);
    }
  }, [referenceFilter, referenceMonth, referenceYear, allStudents]);

  // Effect to update performance when filters change
  useEffect(() => {
    fetchPerformanceData();
  }, [performanceFilter, performanceMonth, performanceYear]);

  // Handler functions for filter changes
  const handleDistributionFilterChange = (filterType) => {
    setDistributionFilter(filterType);
  };

  const handleReferenceFilterChange = (filterType) => {
    setReferenceFilter(filterType);
  };

  const handlePerformanceFilterChange = (filterType) => {
    setPerformanceFilter(filterType);
  };

  const handleDistributionMonthChange = (e) => {
    const month = parseInt(e.target.value);
    setDistributionMonth(month);
  };

  const handleReferenceMonthChange = (e) => {
    const month = parseInt(e.target.value);
    setReferenceMonth(month);
  };

  const handleDistributionYearChange = (e) => {
    const year = parseInt(e.target.value);
    setDistributionYear(year);
  };

  const handleReferenceYearChange = (e) => {
    const year = parseInt(e.target.value);
    setReferenceYear(year);
  };

  const handlePerformanceMonthChange = (e) => {
    const month = parseInt(e.target.value);
    setPerformanceMonth(month);
  };

  const handlePerformanceYearChange = (e) => {
    const year = parseInt(e.target.value);
    setPerformanceYear(year);
  };

  // Handler functions for button clicks
  const handleAddStudentClick = () => {
    setShowStudentForm(true);
    toast.info('Student registration form opened');
  };

  const handleAddStaffClick = () => {
    setShowStaffForm(true);
    toast.info('Staff registration form opened');
  };

  const handleStaffStatClick = () => {
    setShowStaffForm(true);
    toast.info('Staff management opened');
  };

  const handleTotalStudentsClick = () => {
    setStudentsFilter('all');
    setShowAllStudents(true);
  };

  const handleActiveStudentsClick = () => {
    setStudentsFilter('active');
    setShowAllStudents(true);
  };

  const handleGenerateReport = () => {
    toast.info('Report generation functionality would be implemented here');
  };

  const handleViewAttendance = () => {
    setShowAttendance(true);
    toast.info('Viewing attendance data');
  };

  const handleBackToDashboard = () => {
    setShowStudentForm(false);
    setShowStaffForm(false);
    setShowAllStudents(false);
    setShowAttendance(false);
    fetchData();
    fetchStaffStats();
    fetchPerformanceData();
    fetchAttendanceData();
  };

  // Generate year options for dropdowns - FIXED to remove 2001 and start from 2020
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = 0; i < 6; i++) {
    const year = currentYear - i;
    // Only include years from 2020 onwards
    if (year >= 2020) {
      yearOptions.push(year);
    }
  }

  // Prepare chart data for distribution
  const distributionChartData = [
    { name: 'Primary', students: stats.primaryStudents },
    { name: 'Secondary', students: stats.secondaryStudents },
    { name: 'High School', students: stats.highSchoolStudents },
    { name: 'Senior', students: stats.seniorStudents }
  ];

  // Prepare chart data for performance - FIXED with short labels
  const performanceChartData = studentPerformance.map(item => ({
    name: item.name,
    score: item.averageScore,
    weekNumber: item.weekNumber || 0,
    fullName: item.fullName || item.name
  }));

  // Function to format attendance data for charts
  const getFormattedAttendance = () => {
    const grouped = {};

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const targetMonth = attendanceMonth || currentMonth;
    const targetYear = attendanceYear || currentYear;

    const getWeekOfMonth = (date) => {
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const firstDayOfWeek = firstDay.getDay();
      const offset = ((firstDayOfWeek + 6) % 7);
      return Math.ceil((date.getDate() + offset) / 7);
    };

    attendanceData.forEach((record) => {
      const date = new Date(record.date);
      const recordMonth = date.getMonth() + 1;
      const recordYear = date.getFullYear();

      if (recordMonth === targetMonth && recordYear === targetYear) {
        if (attendanceFilter === "month") {
          const monthYear = `${date.toLocaleDateString("en-US", { month: "short" })} ${date.getFullYear()}`;
          grouped[monthYear] = (grouped[monthYear] || 0) + (record.present || 0);
        }
        else if (attendanceFilter === "week") {
          const weekNum = getWeekOfMonth(date);
          const weekKey = `Week ${weekNum}`;
          grouped[weekKey] = (grouped[weekKey] || 0) + (record.present || 0);
        }
        else if (attendanceFilter === "year") {
          const year = date.getFullYear();
          grouped[year] = (grouped[year] || 0) + (record.present || 0);
        }
      }
    });

    let result = Object.keys(grouped).map((key) => ({
      name: key,
      Present: grouped[key],
    }));

    if (attendanceFilter === "week") {
      result.sort((a, b) => {
        const aWeekNum = parseInt(a.name.split(" ")[1]);
        const bWeekNum = parseInt(b.name.split(" ")[1]);
        return aWeekNum - bWeekNum;
      });
    }
    else if (attendanceFilter === "month") {
      result.sort((a, b) => {
        const [aMonth, aYear] = a.name.split(" ");
        const [bMonth, bYear] = b.name.split(" ");
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
        return monthNames.indexOf(aMonth) - monthNames.indexOf(bMonth);
      });
    }
    else if (attendanceFilter === "year") {
      result.sort((a, b) => parseInt(a.name) - parseInt(b.name));
    }

    return result;
  };

  // Loading state display
  if (loading || staffLoading) {
    return (
      <div className="dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
        <style>{`
          .loading-spinner {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 300px;
            gap: 15px;
          }
          
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #FF8C00;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Main component return
  return (
    <div className="dashboard">
      {/* Student Form Modal */}
      {showStudentForm && (
        <div className="form-overlay" onClick={handleBackToDashboard}>
          <div className="form-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Student</h2>
              <button className="close-btn" onClick={handleBackToDashboard}>
                &times;
              </button>
            </div>
            <StudentForm
              onSuccess={() => {
                handleBackToDashboard();
                toast.success('Student added successfully!');
              }}
              onCancel={handleBackToDashboard}
            />
          </div>
        </div>
      )}

      {/* Staff Form Modal */}
      {showStaffForm && (
        <div className="form-overlay" onClick={handleBackToDashboard}>
          <div className="form-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Staff Management</h2>
              <button className="close-btn" onClick={handleBackToDashboard}>
                &times;
              </button>
            </div>
            <ManagementDetails
              onSuccess={() => {
                handleBackToDashboard();
                toast.success('Staff member added successfully!');
              }}
              onCancel={handleBackToDashboard}
            />
          </div>
        </div>
      )}

      {/* All Students Modal */}
      {showAllStudents && (
        <div className="form-overlay" onClick={handleBackToDashboard}>
          <div 
            className="form-container" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '95%', maxHeight: '95%', width: '95%', height: '95%' }}
          >
            <div className="modal-header">
              <h2>
                {studentsFilter === 'all' ? 'All Students' : 'Active Students'} 
                ({studentsFilter === 'all' ? stats.totalStudents : stats.activeStudents})
              </h2>
              <button className="close-btn" onClick={handleBackToDashboard}>
                &times;
              </button>
            </div>
            <AllStudents
              initialFilter={studentsFilter}
              onClose={handleBackToDashboard}
            />
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendance && (
        <div className="form-overlay" onClick={handleBackToDashboard}>
          <div 
            className="form-container" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '95%', maxHeight: '95%', width: '95%', height: '95%' }}
          >
            <div className="modal-header">
              <h2>Attendance Overview</h2>
              <button className="close-btn" onClick={handleBackToDashboard}>
                &times;
              </button>
            </div>
            <Attendance
              attendanceData={attendanceData}
              onClose={handleBackToDashboard}
            />
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedReference && (
        <div className="form-overlay" onClick={handleCloseStudentDetails}>
          <div className="form-container student-details-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Students with {selectedReference} Reference</h2>
              <button className="close-btn" onClick={handleCloseStudentDetails}>
                &times;
              </button>
            </div>

            <div className="student-details-content">
              {referenceStudents.length > 0 ? (
                <div className="students-list">
                  {referenceStudents.map((student, index) => {
                    const referralPersonName = student.referralPersonName ||
                      student.referredByName ||
                      student.referrerName ||
                      'Not specified';

                    return (
                      <div key={index} className="student-card">
                        <div className="student-info">
                          <div className="student-name">
                            {student.firstName && student.lastName
                              ? `${student.firstName} ${student.lastName}`
                              : student.name || student.fullName || 'Unknown Name'
                            }
                          </div>
                          <div className="student-reference">
                            Referred by: <strong>{referralPersonName}</strong>
                          </div>
                          <div className="student-admission-date">
                            Admission Date: {student.admissionDate || student.dateOfAdmission ?
                              new Date(student.admissionDate || student.dateOfAdmission).toLocaleDateString() :
                              'Unknown date'}
                          </div>
                          <div className="student-level">
                            Level: {student.level || student.grade || 'Not specified'}
                          </div>
                          <div className="student-contact">
                            Contact: {student.phone || student.contactNumber || student.parentPhone || 'Not specified'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-students-message">
                  No students found with {selectedReference} reference for the selected period.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      {!showStudentForm && !showStaffForm && !showAllStudents && !showAttendance && !selectedReference && (
        <>
          {/* Statistics Grid */}
          <div className="stats-grid">
            <div className="stat-card" onClick={handleTotalStudentsClick} style={{ cursor: 'pointer' }}>
              <div className="stat-number">{stats.totalStudents}</div>
              <div className="stat-label">Total Students</div>
            </div>

            <div className="stat-card" onClick={handleActiveStudentsClick} style={{ cursor: 'pointer' }}>
              <div className="stat-number">{stats.activeStudents}</div>
              <div className="stat-label">Active Students</div>
            </div>

            <div className="stat-card" onClick={handleStaffStatClick} style={{ cursor: 'pointer' }}>
              <div className="stat-number">{staffStats.totalStaff}</div>
              <div className="stat-label">Total Staff</div>
            </div>

            <div className="stat-card" onClick={handleStaffStatClick} style={{ cursor: 'pointer' }}>
              <div className="stat-number">{staffStats.activeStaff}</div>
              <div className="stat-label">Active Staff</div>
            </div>

            <div className="stat-card" onClick={handleStaffStatClick} style={{ cursor: 'pointer' }}>
              <div className="stat-number">₹{staffStats.monthlySalary.toLocaleString()}</div>
              <div className="stat-label">Monthly Salary Expense</div>
            </div>

            <div className="stat-card" onClick={handleStaffStatClick} style={{ cursor: 'pointer' }}>
              <div className="stat-number">{staffStats.teachingStaff}</div>
              <div className="stat-label">Teaching Staff</div>
            </div>
          </div>

          {/* Dashboard Content Grid */}
          <div className="dashboard-content">
            {/* Student Distribution Chart Card */}
            <div className="card">
              <h2>Student Distribution Chart</h2>

              <div className="calendar-filter horizontal-filters">
                <div className="filter-options">
                  <button
                    className={`filter-btn ${distributionFilter === 'all' ? 'active' : ''}`}
                    onClick={() => handleDistributionFilterChange('all')}
                  >
                    All Time
                  </button>
                  <button
                    className={`filter-btn ${distributionFilter === 'yearly' ? 'active' : ''}`}
                    onClick={() => handleDistributionFilterChange('yearly')}
                  >
                    Yearly
                  </button>
                  <button
                    className={`filter-btn ${distributionFilter === 'monthly' ? 'active' : ''}`}
                    onClick={() => handleDistributionFilterChange('monthly')}
                  >
                    Monthly
                  </button>
                </div>

                {distributionFilter === 'yearly' && (
                  <div className="year-selector">
                    <label htmlFor="distribution-year-select">Select Year: </label>
                    <select
                      id="distribution-year-select"
                      value={distributionYear}
                      onChange={handleDistributionYearChange}
                    >
                      {yearOptions.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                )}

                {distributionFilter === 'monthly' && (
                  <div className="month-year-selector">
                    <div className="selector-group">
                      <label htmlFor="distribution-month-select">Month: </label>
                      <select
                        id="distribution-month-select"
                        value={distributionMonth}
                        onChange={handleDistributionMonthChange}
                      >
                        {monthNames.map((month, index) => (
                          <option key={index + 1} value={index + 1}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="selector-group">
                      <label htmlFor="distribution-year-select-month">Year: </label>
                      <select
                        id="distribution-year-select-month"
                        value={distributionYear}
                        onChange={handleDistributionYearChange}
                      >
                        {yearOptions.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={distributionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} students`, 'Count']} />
                  <Legend />
                  <Bar dataKey="students" fill="#FF8C00" name="Number of Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Student Performance Overview Card - FIXED to match Student Distribution Chart layout */}
            <div className="card">
              <h2>Student Performance Overview</h2>

              <div className="calendar-filter horizontal-filters">
                <div className="filter-options">
                  <button
                    className={`filter-btn ${performanceFilter === 'all' ? 'active' : ''}`}
                    onClick={() => handlePerformanceFilterChange('all')}
                  >
                    All Time
                  </button>
                  <button
                    className={`filter-btn ${performanceFilter === 'yearly' ? 'active' : ''}`}
                    onClick={() => handlePerformanceFilterChange('yearly')}
                  >
                    Yearly
                  </button>
                  <button
                    className={`filter-btn ${performanceFilter === 'monthly' ? 'active' : ''}`}
                    onClick={() => handlePerformanceFilterChange('monthly')}
                  >
                    Monthly
                  </button>
                </div>

                {performanceFilter === 'yearly' && (
                  <div className="year-selector">
                    <label htmlFor="performance-year-select">Select Year: </label>
                    <select
                      id="performance-year-select"
                      value={performanceYear}
                      onChange={handlePerformanceYearChange}
                    >
                      {yearOptions.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                )}

                {performanceFilter === 'monthly' && (
                  <div className="month-year-selector">
                    <div className="selector-group">
                      <label htmlFor="performance-month-select">Month: </label>
                      <select
                        id="performance-month-select"
                        value={performanceMonth}
                        onChange={handlePerformanceMonthChange}
                      >
                        {monthNames.map((month, index) => (
                          <option key={index + 1} value={index + 1}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="selector-group">
                      <label htmlFor="performance-year-select-month">Year: </label>
                      <select
                        id="performance-year-select-month"
                        value={performanceYear}
                        onChange={handlePerformanceYearChange}
                      >
                        {yearOptions.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {performanceLoading ? (
                <div className="loading-spinner-small">
                  <div className="spinner-small"></div>
                  <p>Loading performance data...</p>
                </div>
              ) : performanceChartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart 
                      data={performanceChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fontSize: 12 }}
                        label={{ 
                          value: 'Average Score (%)', 
                          angle: -90, 
                          position: 'insideLeft',
                          offset: -10,
                          style: { textAnchor: 'middle' }
                        }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Average Score']}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0] && payload[0].payload && payload[0].payload.fullName) {
                            return payload[0].payload.fullName;
                          }
                          return label;
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="score" 
                        fill="#4CAF50" 
                        name="Average Score (%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="performance-stats">
                    <div className="stat-item">
                      <span className="stat-label">Data Points: </span>
                      <span className="stat-value">{performanceChartData.length}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Current: </span>
                      <span className="stat-value">
                        {performanceChartData.length > 0 
                          ? `${performanceChartData[performanceChartData.length - 1].score.toFixed(1)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Highest: </span>
                      <span className="stat-value">
                        {performanceChartData.length > 0 
                          ? `${Math.max(...performanceChartData.map(p => p.score)).toFixed(1)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-data-message">
                  {performanceFilter === 'monthly' ? (
                    <>
                      No performance data for {monthNames[performanceMonth - 1]} {performanceYear}
                    </>
                  ) : performanceFilter === 'yearly' ? (
                    <>
                      No performance data for {performanceYear}
                    </>
                  ) : (
                    <>
                      No performance data available
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Admission Reference Chart Card */}
            <div className="card">
              <h2>Admission Reference Chart</h2>

              <div className="calendar-filter">
                <div className="filter-options">
                  <button
                    className={`filter-btn ${referenceFilter === 'all' ? 'active' : ''}`}
                    onClick={() => handleReferenceFilterChange('all')}
                  >
                    All Time
                  </button>
                  <button
                    className={`filter-btn ${referenceFilter === 'yearly' ? 'active' : ''}`}
                    onClick={() => handleReferenceFilterChange('yearly')}
                  >
                    Yearly
                  </button>
                  <button
                    className={`filter-btn ${referenceFilter === 'monthly' ? 'active' : ''}`}
                    onClick={() => handleReferenceFilterChange('monthly')}
                  >
                    Monthly
                  </button>
                </div>

                {referenceFilter === 'yearly' && (
                  <div className="year-selector">
                    <label htmlFor="reference-year-select">Select Year: </label>
                    <select
                      id="reference-year-select"
                      value={referenceYear}
                      onChange={handleReferenceYearChange}
                    >
                      {yearOptions.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                )}

                {referenceFilter === 'monthly' && (
                  <div className="month-year-selector">
                    <div className="selector-group">
                      <label htmlFor="reference-month-select">Month: </label>
                      <select
                        id="reference-month-select"
                        value={referenceMonth}
                        onChange={handleReferenceMonthChange}
                      >
                        {monthNames.map((month, index) => (
                          <option key={index + 1} value={index + 1}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="selector-group">
                      <label htmlFor="reference-year-select-month">Year: </label>
                      <select
                        id="reference-year-select-month"
                        value={referenceYear}
                        onChange={handleReferenceYearChange}
                      >
                        {yearOptions.map(year => (
                        <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {refLoading ? (
                <div className="loading-spinner">Loading admission references...</div>
              ) : admissionReferenceData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300} className="chart-responsive-container">
                    <BarChart data={admissionReferenceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-30} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`${value} students`, 'Count']}
                        labelFormatter={(label) => `Reference: ${label}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#2196F3"
                        name="Number of Students"
                        onClick={handleBarClick}
                        style={{ cursor: 'pointer' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="total-count">
                    Total Students in Selected Period: {admissionReferenceData.reduce((sum, item) => sum + item.count, 0)}
                  </div>

                  <div className="chart-note">
                    Click on the Referral bar to view student details
                  </div>
                </>
              ) : (
                <div className="no-data-message">No admission reference data available for the selected period</div>
              )}
            </div>

            {/* Attendance Overview Card */}
            <div className="card">
              <h2>Attendance Overview</h2>

              <div className="calendar-filter horizontal-filters">
                <div className="filter-options">
                  <div className="selector-group">
                    <label htmlFor="attendance-filter">View by: </label>
                    <select
                      id="attendance-filter"
                      value={attendanceFilter}
                      onChange={(e) => setAttendanceFilter(e.target.value)}
                    >
                      <option value="month">Month</option>
                      <option value="week">Week</option>
                      <option value="year">Year</option>
                    </select>
                  </div>
                </div>

                <div className="month-year-selector">
                  <div className="selector-group">
                    <label htmlFor="attendance-month-select">Month: </label>
                    <select
                      id="attendance-month-select"
                      value={attendanceMonth}
                      onChange={(e) => setAttendanceMonth(parseInt(e.target.value))}
                    >
                      {monthNames.map((month, index) => (
                        <option key={index + 1} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="selector-group">
                    <label htmlFor="attendance-year-select">Year: </label>
                    <select
                      id="attendance-year-select"
                      value={attendanceYear}
                      onChange={(e) => setAttendanceYear(parseInt(e.target.value))}
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {loadingAttendance ? (
                <div className="loading-spinner">Loading attendance data...</div>
              ) : attendanceData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={getFormattedAttendance()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Present" fill="#82ca9d" name="Present Students" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="total-count">
                    Total Present Students: {getFormattedAttendance().reduce((sum, item) => sum + item.Present, 0)}
                  </div>
                </>
              ) : (
                <div className="no-data-message">No attendance data available</div>
              )}
            </div>

            {/* Quick Actions Card */}
            <div className="card quick-actions-card">
              <h2>Quick Actions</h2>
              <div className="quick-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleAddStudentClick}
                >
                  Add New Student
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddStaffClick}
                >
                  Add Staff Member
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleViewAttendance}
                >
                  View Attendance
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CSS Styles */}
      <style>{`
        .dashboard {
          position: relative;
          padding: 20px;
          max-width: 100%;
          overflow-x: hidden;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
          transition: transform 0.2s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
        }
        
        .stat-number {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #666;
        }
        
        .card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        
        .card h2 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px;
          color: #333;
        }
        
        .dashboard-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-top: 20px;
        }
        
        .calendar-filter {
          margin-bottom: 15px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .horizontal-filters {
          flex-direction: row;
          flex-wrap: wrap;
          align-items: center;
        }
        
        .filter-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .filter-btn {
          padding: 6px 12px;
          border: 1px solid #ddd;
          background: #f5f5f5;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 12px;
        }
        
        .filter-btn:hover {
          background: #e9e9e9;
        }
        
        .filter-btn.active {
          background: #2196F3;
          color: white;
          border-color: #2196F3;
        }
        
        .year-selector, .month-year-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .month-year-selector {
          gap: 15px;
        }
        
        .selector-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .calendar-filter label {
          font-weight: 600;
          color: #555;
          white-space: nowrap;
          font-size: 12px;
        }
        
        .calendar-filter select {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          font-size: 12px;
        }
        
        .quick-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .btn {
          padding: 8px 12px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        
        .btn-primary {
          background-color: #FF8C00;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #e67e00;
        }
        
        .form-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }
        
        .form-container {
          background: white;
          border-radius: 8px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid #eee;
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
          border-radius: 8px 8px 0 0;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        
        .close-btn:hover {
          background-color: #f5f5f5;
          color: #000;
        }
        
        .student-details-container {
          max-width: 800px;
        }
        
        .student-details-content {
          padding: 15px;
        }
        
        .students-list {
          display: grid;
          gap: 10px;
        }
        
        .student-card {
          border: 1px solid #eee;
          border-radius: 6px;
          padding: 12px;
          transition: all 0.2s ease;
        }
        
        .student-card:hover {
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          transform: translateY(-1px);
        }
        
        .student-name {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 6px;
        }
        
        .student-reference, .student-admission-date, .student-level, .student-contact {
          margin-bottom: 4px;
          color: #555;
          font-size: 14px;
        }
        
        .no-students-message {
          text-align: center;
          padding: 30px;
          color: #666;
          font-style: italic;
        }
        
        .no-data-message {
          text-align: center;
          padding: 30px;
          color: #666;
          font-style: italic;
          line-height: 1.4;
        }
        
        .chart-responsive-container {
          width: 100%;
          height: 300px;
        }
        
        .total-count {
          text-align: center;
          margin-top: 10px;
          font-weight: 600;
          color: #333;
          padding: 8px;
          background-color: #f9f9f9;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .chart-note {
          text-align: center;
          margin-top: 8px;
          font-size: 12px;
          color: #666;
          font-style: italic;
        }
        
        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
          color: #666;
          flex-direction: column;
          gap: 10px;
        }
        
        .loading-spinner-small {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 150px;
          color: #666;
          flex-direction: column;
          gap: 8px;
          font-size: 14px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #FF8C00;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .spinner-small {
          width: 30px;
          height: 30px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #4CAF50;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .performance-stats {
          display: flex;
          justify-content: space-around;
          margin-top: 12px;
          padding: 8px;
          background-color: #f9f9f9;
          border-radius: 4px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
          font-weight: 600;
        }

        .stat-value {
          font-size: 14px;
          color: #333;
          font-weight: 700;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (min-width: 1024px) {
          .dashboard-content {
            grid-template-columns: 1fr 1fr;
          }
          
          .quick-actions-card {
            grid-column: 1 / span 2;
          }
        }
        
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .quick-actions {
            flex-direction: column;
          }
          
          .horizontal-filters {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .month-year-selector {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .form-container {
            max-width: 95%;
            margin: 10px;
            max-height: 85vh;
          }
          
          .chart-responsive-container {
            height: 250px;
          }
          
          .filter-options {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .performance-stats {
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }

          .stat-item {
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
            max-width: 180px;
          }

          .modal-header {
            padding: 12px;
          }

          .modal-header h2 {
            font-size: 16px;
          }

          .close-btn {
            font-size: 20px;
            width: 30px;
            height: 30px;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .modal-header {
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }
          
          .modal-header h2 {
            font-size: 16px;
          }
          
          .card {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;