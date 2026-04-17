import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const Attendance = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [showRecords, setShowRecords] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();
  const [yearFilter, setYearFilter] = useState(currentYear);
  const [monthFilter, setMonthFilter] = useState(currentMonth);
  const [classFilter, setClassFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [todayFilter, setTodayFilter] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'loginTime', direction: 'descending' });
  const [classes, setClasses] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [showExcelPreview, setShowExcelPreview] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginPopupMessage, setLoginPopupMessage] = useState('');
  const [popupStudentName, setPopupStudentName] = useState('');
  const [showAlreadyLoggedInPopup, setShowAlreadyLoggedInPopup] = useState(false);

  // Get available years for filter (current year and previous 5 years)
  const availableYears = Array.from({ length: 6 }, (_, i) =>
    (new Date().getFullYear() - i).toString()
  );

  // Months for filter
  const months = [
    { value: 'all', name: 'All Months' },
    { value: '1', name: 'January' },
    { value: '2', name: 'February' },
    { value: '3', name: 'March' },
    { value: '4', name: 'April' },
    { value: '5', name: 'May' },
    { value: '6', name: 'June' },
    { value: '7', name: 'July' },
    { value: '8', name: 'August' },
    { value: '9', name: 'September' },
    { value: '10', name: 'October' },
    { value: '11', name: 'November' },
    { value: '12', name: 'December' }
  ].map(month => ({
    ...month,
    isCurrent: month.value === currentMonth
  }));

  // Update your fetchClasses function:
  const fetchClasses = async () => {
    try {
      // Change this line from '/classes' to '/api/classes'
      const response = await fetch('http://localhost:5000/api/attendance/classes'); // Add /api

      // If network error, use fallback
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.classes && data.classes.length > 0) {
        // Use classes from API
        setClasses(['All Classes', ...data.classes]);
      } else {
        // Fallback to default classes
        const defaultClasses = Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`);
        setClasses(['All Classes', ...defaultClasses]);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      // Fallback to default classes
      const defaultClasses = Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`);
      setClasses(['All Classes', ...defaultClasses]);
    }
  };

  // Show login popup function for successful login
  const showLoginPopupMessage = (studentName, isFirstLogin) => {
    setPopupStudentName(studentName);
    if (isFirstLogin) {
      setLoginPopupMessage(`${studentName} has successfully logged in!`);
    } else {
      setLoginPopupMessage(`${studentName} has logged in again!`);
    }
    setShowLoginPopup(true);
    
    // Auto hide popup after 3 seconds
    setTimeout(() => {
      setShowLoginPopup(false);
    }, 3000);
  };

  // Show already logged in popup function
  const showAlreadyLoggedInPopupMessage = (studentName) => {
    setPopupStudentName(studentName);
    setLoginPopupMessage(`You have already logged in today. Cannot login again.`);
    setShowAlreadyLoggedInPopup(true);
    
    // Auto hide popup after 3 seconds
    setTimeout(() => {
      setShowAlreadyLoggedInPopup(false);
    }, 3000);
  };

  // Check if student has already logged in today using localStorage (case-insensitive)
  const hasStudentLoggedInToday = (studentName) => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogins = JSON.parse(localStorage.getItem('todayLogins') || '{}');

    if (!todayLogins[today]) return false;

    // Case-insensitive check
    return todayLogins[today].some(name =>
      name.toLowerCase() === studentName.toLowerCase()
    );
  };

  // Record student login in localStorage (case-insensitive)
  const recordStudentLogin = (studentName) => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogins = JSON.parse(localStorage.getItem('todayLogins') || '{}');

    if (!todayLogins[today]) {
      todayLogins[today] = [];
    }

    // Check if student already exists (case-insensitive)
    const studentExists = todayLogins[today].some(name =>
      name.toLowerCase() === studentName.toLowerCase()
    );

    if (!studentExists) {
      todayLogins[today].push(studentName);
      localStorage.setItem('todayLogins', JSON.stringify(todayLogins));
      return false; // First login
    } else {
      return true; // Already logged in before
    }
  };

  // Clean up old login records (older than 7 days)
  const cleanupOldLoginRecords = () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const loginRecords = JSON.parse(localStorage.getItem('todayLogins') || '{}');
    const cleanedRecords = {};

    Object.keys(loginRecords).forEach(date => {
      const recordDate = new Date(date);
      if (recordDate >= sevenDaysAgo || date === todayString) {
        cleanedRecords[date] = loginRecords[date];
      }
    });

    localStorage.setItem('todayLogins', JSON.stringify(cleanedRecords));
  };

  // Comprehensive WebGL support check
  const checkWebGLSupport = () => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!gl) {
        console.warn("WebGL is not supported on this device");
        return false;
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        console.log("WebGL renderer:", renderer);

        const isSoftwareRenderer = renderer.includes('SwiftShader') ||
          renderer.includes('Google SwiftShader') ||
          renderer.includes('LLVMpipe') ||
          renderer.includes('softpipe');

        if (isSoftwareRenderer) {
          console.warn("WebGL is using software rendering, which may not work with face detection");
          return false;
        }
      }

      const floatTextureSupport = gl.getExtension('OES_texture_float');
      if (!floatTextureSupport) {
        console.warn("WebGL doesn't support floating point textures, required for face detection");
        return false;
      }

      return true;
    } catch (e) {
      console.warn("WebGL check failed:", e);
      return false;
    }
  };

  // Load models - with fallback for model loading issues
  useEffect(() => {
    const initializeFaceRecognition = async () => {
      try {
        setLoading(true);

        const hasWebGL = checkWebGLSupport();
        if (!hasWebGL) {
          console.warn("WebGL not properly supported, using fallback mode");
          setUsingFallback(true);
          toast.info("Using simplified attendance system");
          setLoading(false);
          return;
        }

        try {
          const faceapi = await import('face-api.js');

          const modelLoadTimeout = setTimeout(() => {
            throw new Error("Model loading timed out");
          }, 30000);

          try {
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

            console.log("Loading face detection models from:", MODEL_URL);

            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

            clearTimeout(modelLoadTimeout);
            console.log("All models loaded successfully");
            setModelsLoaded(true);
            toast.success("Face recognition models loaded successfully!");
          } catch (modelError) {
            clearTimeout(modelLoadTimeout);
            console.error("Model loading failed:", modelError);
            throw modelError;
          }
        } catch (faceApiError) {
          console.error("Face-API.js loading failed, using fallback:", faceApiError);
          setUsingFallback(true);
          toast.info("Using simplified attendance system");
        }
      } catch (err) {
        console.error("Model loading error:", err);
        setUsingFallback(true);
        toast.info("Using simplified attendance system");
      } finally {
        setLoading(false);
      }
    };

    const storedStudentName = localStorage.getItem('currentStudentName');
    if (storedStudentName) {
      setStudentName(storedStudentName);
    }

    cleanupOldLoginRecords();
    fetchClasses();
    initializeFaceRecognition();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Fetch attendance records
  const fetchAttendanceRecords = async () => {
    try {
      setRecordsLoading(true);
      let url = 'http://localhost:5000/api/attendance';

      // Build query parameters based on filters
      const params = new URLSearchParams();

      if (yearFilter && yearFilter !== 'all') params.append('year', yearFilter);
      if (monthFilter && monthFilter !== 'all') params.append('month', monthFilter);
      if (classFilter && classFilter !== 'all') {
        params.append('class', classFilter);
      } if (dateFilter) params.append('date', dateFilter);
      if (todayFilter) {
        const today = new Date().toISOString().split('T')[0];
        params.append('date', today);
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Sort records by loginTime in descending order by default
        const sortedRecords = data.data.sort((a, b) => {
          return new Date(b.loginTime) - new Date(a.loginTime);
        });
        setAttendanceRecords(sortedRecords);
      } else {
        toast.error('Failed to load attendance records');
      }
    } catch (err) {
      console.error('Error fetching attendance records:', err);
      toast.error('Failed to load attendance records');
      
      // Fallback: Show empty records instead of crashing
      setAttendanceRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  // Handle sorting when column header is clicked
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });

    const sortedRecords = [...attendanceRecords].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    setAttendanceRecords(sortedRecords);
  };

  // Toggle records view
  const toggleRecordsView = () => {
    if (!showRecords) {
      fetchAttendanceRecords();
    }
    setShowRecords(!showRecords);
  };

  // Check camera permissions and availability
  const checkCameraAvailability = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      if (videoDevices.length === 0) {
        throw new Error("No camera devices found");
      }

      return true;
    } catch (error) {
      console.error("Camera check failed:", error);
      setCameraError(error.message);
      return false;
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const cameraAvailable = await checkCameraAvailability();
      if (!cameraAvailable) {
        return;
      }

      setLoading(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraActive(true);
          setLoading(false);
          setCameraError(null);
          toast.success("Camera activated successfully!");
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setLoading(false);
      setCameraActive(false);

      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Camera not found. Please check if a camera is connected.');
        toast.error('Camera not found. Please check if a camera is connected.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is already in use by another application.');
        toast.error('Camera is already in use by another application.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
        toast.error('Camera permission denied. Please allow camera access.');
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        setCameraError('Camera constraints could not be satisfied. Trying with different settings...');
        toast.error('Camera configuration issue. Trying alternative settings...');
        startCameraWithFallbackConstraints();
      } else {
        setCameraError(`Camera error: ${err.message || err.name}`);
        toast.error(`Camera error: ${err.message || err.name}`);
      }
    }
  };

  // Try with less constraints if first attempt fails
  const startCameraWithFallbackConstraints = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraActive(true);
          setLoading(false);
          setCameraError(null);
          toast.success("Camera activated with fallback settings!");
        };
      }
    } catch (fallbackError) {
      console.error("Fallback camera error:", fallbackError);
      setLoading(false);
      setCameraError("Could not access camera even with fallback settings.");
      toast.error("Could not access camera. Please check your device settings.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    toast.info("Camera turned off");
  };

  // Capture photo for attendance
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg');
  };

  // Mark attendance with photo
  const markAttendanceWithPhoto = async () => {
    if (!cameraActive) {
      toast.error("Please start the camera first");
      return;
    }

    if (!studentName) {
      toast.error("Please enter your Student Name");
      return;
    }

    // Check if student has already logged in today using localStorage
    const hasLoggedIn = hasStudentLoggedInToday(studentName);
    
    if (hasLoggedIn) {
      // Show popup for student trying to login again
      showAlreadyLoggedInPopupMessage(studentName);
      toast.error("You have already logged in today. Cannot login again.");
      return;
    }

    try {
      setLoading(true);

      const photoData = capturePhoto();

      if (!photoData) {
        toast.error("Could not capture photo. Please try again.");
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentName: studentName,
          image: photoData,
          timestamp: new Date().toISOString()
        })
      });

      // First, check if the response is OK (status 200-299)
      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          // Record the login in localStorage and check if it's first login
          const isAlreadyLoggedIn = recordStudentLogin(studentName);
          
          // Show appropriate popup message
          if (isAlreadyLoggedIn) {
            showLoginPopupMessage(studentName, false); // Student logging in again
          } else {
            showLoginPopupMessage(studentName, true); // First login
          }
          
          toast.success(`🎉 Attendance recorded for ${data.name || 'student'}!`);
          if (showRecords) {
            fetchAttendanceRecords();
          }
          stopCamera();
        } else {
          toast.error(data.message || 'Attendance recording failed. Please try again.');
        }
      } else {
        // Handle non-OK responses (like 400 status)
        const errorData = await response.json();
        throw new Error(errorData.message || `Server returned ${response.status}`);
      }
    } catch (err) {
      console.error("Attendance error:", err);
      // Display the error message from the server in the frontend
      toast.error(err.message || "Error recording attendance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      toast.success("Camera permission granted! Now click 'Start Camera'.");
    } catch (err) {
      console.error("Permission request failed:", err);
      toast.error("Camera permission denied. Please allow camera access in your browser settings.");
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Reset all filters
  const resetFilters = () => {
    setYearFilter(currentYear);
    setMonthFilter(currentMonth);
    setClassFilter('all');
    setDateFilter('');
    setTodayFilter(false);
    fetchAttendanceRecords();
  };

  // Prepare Excel data for preview and download
  const prepareExcelData = () => {
    return attendanceRecords.map(record => ({
      'Student Name': record.studentName,
      'Admission No': record.admissionNo,
      'Class': record.class,
      'Date': new Date(record.date).toLocaleDateString(),
      'Login Time': formatDate(record.loginTime),
      'Status': record.status
    }));
  };

  // Show Excel preview
  const showExcelView = () => {
    if (attendanceRecords.length === 0) {
      toast.error('No records to export');
      return;
    }

    const data = prepareExcelData();
    setExcelData(data);
    setShowExcelPreview(true);
  };

  // Download Excel file
  const downloadExcel = () => {
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Records');

    // Generate Excel file and download
    const fileName = `attendance_records_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast.success('Excel file downloaded successfully!');
    setShowExcelPreview(false);
  };

  // Close Excel preview
  const closeExcelPreview = () => {
    setShowExcelPreview(false);
    setExcelData([]);
  };

  // Close login popup
  const closeLoginPopup = () => {
    setShowLoginPopup(false);
    setLoginPopupMessage('');
    setPopupStudentName('');
  };

  // Close already logged in popup
  const closeAlreadyLoggedInPopup = () => {
    setShowAlreadyLoggedInPopup(false);
    setLoginPopupMessage('');
    setPopupStudentName('');
  };

  const canMarkAttendance = usingFallback ?
    (cameraActive && studentName) :
    (modelsLoaded && cameraActive && studentName);

  return (
    <div className="attendance-container">
      <h2>Student Attendance System</h2>

      {/* Successful Login Popup Modal */}
      {showLoginPopup && (
        <div className="login-popup-modal">
          <div className="login-popup-content">
            <div className="login-popup-header">
              <h3>🎉 Student Login Notification</h3>
              <button onClick={closeLoginPopup} className="close-btn">&times;</button>
            </div>
            <div className="login-popup-body">
              <div className="popup-icon">✓</div>
              <p className="popup-message">{loginPopupMessage}</p>
              <p className="popup-time">Time: {new Date().toLocaleTimeString()}</p>
            </div>
            <div className="login-popup-actions">
              <button onClick={closeLoginPopup} className="btn btn-primary">
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Already Logged In Popup Modal */}
      {showAlreadyLoggedInPopup && (
        <div className="already-loggedin-popup-modal">
          <div className="already-loggedin-popup-content">
            <div className="already-loggedin-popup-header">
              <h3>⚠️ Already Logged In</h3>
              <button onClick={closeAlreadyLoggedInPopup} className="close-btn">&times;</button>
            </div>
            <div className="already-loggedin-popup-body">
              <div className="popup-icon">❌</div>
              <p className="popup-message">{loginPopupMessage}</p>
              <p className="popup-time">Time: {new Date().toLocaleTimeString()}</p>
            </div>
            <div className="already-loggedin-popup-actions">
              <button onClick={closeAlreadyLoggedInPopup} className="btn btn-warning">
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="status-section">
        <div className={`status-indicator ${modelsLoaded ? 'loaded' : usingFallback ? 'fallback' : 'loading'}`}>
          {modelsLoaded ? '✓ Face Recognition Active' :
            usingFallback ? '✓ Photo Capture Mode' :
              '⏳ Loading Systems...'}
        </div>
        {loading && <div className="loading-spinner"></div>}
      </div>

      {usingFallback && (
        <div className="fallback-notice">
          <p>⚠️ Advanced face recognition is not available on this device. Using photo capture mode instead.</p>
        </div>
      )}

      <div className="student-id-section">
        <label htmlFor="studentName">Student Name:</label>
        <input
          type="text"
          id="studentName"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Enter your full name"
          required
        />
        <p className="help-text">
          Please enter your full name to record attendance
        </p>
      </div>

      <div className="video-section">
        <video
          ref={videoRef}
          id="video"
          width="400"
          height="300"
          autoPlay
          muted
          playsInline
          style={{ display: cameraActive ? 'block' : 'none' }}
        />
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
        {!cameraActive && (
          <div className="camera-placeholder">
            {cameraError ? (
              <div className="camera-error">
                <p>❌ {cameraError}</p>
                <button onClick={requestCameraPermission} className="btn btn-warning">
                  Grant Camera Permission
                </button>
              </div>
            ) : (
              <p>Camera not active. Click "Start Camera" to begin.</p>
            )}
          </div>
        )}
      </div>

      <div className="controls">
        <button
          onClick={startCamera}
          disabled={loading || cameraActive}
          className="btn btn-primary"
        >
          {loading ? 'Starting...' : 'Start Camera'}
        </button>
        <button
          onClick={markAttendanceWithPhoto}
          disabled={loading || !canMarkAttendance}
          className="btn btn-success"
        >
          {usingFallback ? 'Capture Photo & Mark Attendance' : 'Mark Attendance'}
        </button>
        <button
          onClick={stopCamera}
          disabled={!cameraActive}
          className="btn btn-secondary"
        >
          Stop Camera
        </button>
        <button
          onClick={toggleRecordsView}
          className="btn btn-info"
        >
          {showRecords ? 'Hide Records' : 'View Records'}
        </button>
      </div>

      {cameraError && (
        <div className="error-section">
          <h3>Camera Access Issue</h3>
          <p>{cameraError}</p>
          <div className="troubleshooting-steps">
            <h4>How to fix:</h4>
            <ol>
              <li>Check if your device has a camera</li>
              <li>Ensure camera permissions are allowed in browser settings</li>
              <li>Make sure no other application is using the camera</li>
              <li>Try refreshing the page and allowing camera access when prompted</li>
              <li>If using a mobile device, try using the native camera app first</li>
            </ol>
          </div>
        </div>
      )}

      {showRecords && (
        <div className="records-section">
          <h3>Attendance Records</h3>

          <div className="filters">
            <div className="filter-group">
              <label htmlFor="yearFilter">Year:</label>
          
              <select
                id="yearFilter"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="monthFilter">Month:</label>
              <select
                id="monthFilter"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              >
                {months.map(month => (
                  <option 
                    key={month.value} 
                    value={month.value}
                    style={month.isCurrent ? {fontWeight: 'bold', backgroundColor: '#e6f7ff'} : {}}
                  >
                    {month.name} {month.isCurrent ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="classFilter">Class:</label>
              <select
                id="classFilter"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <option value="all">All Classes</option>
                {classes
                  .filter(cls => cls !== 'All Classes')
                  .map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))
                }
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="dateFilter">Specific Date:</label>
              <input
                type="date"
                id="dateFilter"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setTodayFilter(false);
                }}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="todayFilter" className="checkbox-label">
                <input
                  type="checkbox"
                  id="todayFilter"
                  checked={todayFilter}
                  onChange={(e) => {
                    setTodayFilter(e.target.checked);
                    if (e.target.checked) setDateFilter('');
                  }}
                />
                Today Only
              </label>
            </div>

            <button onClick={fetchAttendanceRecords} className="btn btn-primary">
              Apply Filters
            </button>
            <button onClick={resetFilters} className="btn btn-secondary">
              Reset Filters
            </button>
            <button onClick={showExcelView} className="btn btn-success" disabled={attendanceRecords.length === 0}>
              View Excel
            </button>
          </div>

          {recordsLoading ? (
            <div className="loading-records">Loading records...</div>
          ) : (
            <div className="records-table-container">
              <table className="records-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('studentName')}>
                      Student Name {sortConfig.key === 'studentName' &&
                        (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('admissionNo')}>
                      Admission No {sortConfig.key === 'admissionNo' &&
                        (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('class')}>
                      Class {sortConfig.key === 'class' &&
                        (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('date')}>
                      Date {sortConfig.key === 'date' &&
                        (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('loginTime')}>
                      Login Time {sortConfig.key === 'loginTime' &&
                        (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('status')}>
                      Status {sortConfig.key === 'status' &&
                        (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr key={record._id}>
                      <td>{record.studentName}</td>
                      <td>{record.admissionNo}</td>
                      <td>{record.class}</td>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>{formatDate(record.loginTime)}</td>
                      <td>
                        <span className={`status-badge ${record.status}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {attendanceRecords.length === 0 && (
                <div className="no-records">
                  <p>No attendance records found for the selected filters.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Excel Preview Modal */}
      {showExcelPreview && (
        <div className="excel-preview-modal">
          <div className="excel-preview-content">
            <div className="excel-preview-header">
              <h3>Excel Preview</h3>
              <button onClick={closeExcelPreview} className="close-btn">&times;</button>
            </div>

            <div className="excel-table-container">
              <table className="excel-preview-table">
                <thead>
                  <tr>
                    {excelData.length > 0 && Object.keys(excelData[0]).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {excelData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="excel-preview-actions">
              <button onClick={downloadExcel} className="btn btn-success">
                Download Excel
              </button>
              <button onClick={closeExcelPreview} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .attendance-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
        
        h2 {
          color: #2c3e50;
          margin-bottom: 20px;
        }
        
        .status-section {
          margin: 20px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .status-indicator {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 500;
          background-color: 'black';
          border: 1px solid #dee2e6;
        }
        
        .status-indicator.loaded {
          background-color: #d4edda;
          color: #155724;
          border-color: #c3e6cb;
        }
        
        .status-indicator.fallback {
          background-color: #e2e3e5;
          color: #383d41;
          border-color: #d6d8db;
        }
        
        .status-indicator.loading {
          background-color: #fff3cd;
          color: #856404;
          border-color: #ffeeba;
        }
        
        .fallback-notice {
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          color: #856404;
          padding: 12px;
          border-radius: 6px;
          margin: 10px 0;
        }
        
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .student-id-section {
          margin: 20px 0;
          text-align: left;
          background-color: 'black';
          padding: 15px;
          border-radius: 8px;
        }
        
        .student-id-section label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          color: #495057;
        }
        
        .student-id-section input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 16px;
        }
        
        .help-text {
          font-size: 0.9em;
          color: #6c757d;
          margin-top: 5px;
          font-style: italic;
        }
        
        .video-section {
          margin: 20px 0;
          position: relative;
        }
        
        .video-section video {
          border: 2px solid #dee2e6;
          border-radius: 8px;
          background: #000;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .camera-placeholder {
          width: 400px;
          height: 300px;
          border: 2px dashed #dee2e6;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8f9fa;
          color: #6c757d;
          font-style: italic;
          margin: 0 auto;
          flex-direction: column;
          gap: 15px;
        }
        
        .camera-error {
          color: #dc3545;
        }
        
        .controls {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          min-width: 140px;
          font-size: 16px;
          transition: all 0.2s ease;
        }
        
        .btn-primary {
          background-color: #007bff;
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background-color: #0056b3;
        }
        
        .btn-success {
          background-color: #28a745;
          color: white;
        }
        
        .btn-success:hover:not(:disabled) {
          background-color: #1e7e34;
        }
        
        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background-color: #545b62;
        }
        
        .btn-warning {
          background-color: #ffc107;
          color: 'black';
        }
        
        .btn-warning:hover:not(:disabled) {
          background-color: #e0a800;
        }
        
        .btn-info {
          background-color: #17a2b8;
          color: white;
        }
        
        .btn-info:hover:not(:disabled) {
          background-color: #138496;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .error-section {
          margin: 20px 0;
          padding: 15px;
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
          text-align: left;
          color: #721c24;
        }
        
        .troubleshooting-steps {
          margin-top: 15px;
        }
        
        .troubleshooting-steps ol {
          padding-left: 20px;
        }
        
        .troubleshooting-steps li {
          margin-bottom: 8px;
        }
        
        .records-section {
          margin: 30px 0;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #17a2b8;
        }
        
        .records-section h3 {
          margin-top: 0;
          color: #17a2b8;
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 10px;
        }
        
        .filters {
          margin-bottom: 20px;
          display: flex;
          gap: 15px;
          align-items: end;
          flex-wrap: wrap;
        }
        
        .filter-group {
          display: flex;
          flex-direction: column;
          text-align: left;
        }
        
        .filter-group label {
          font-weight: bold;
          margin-bottom: 5px;
          color: #495057;
          font-size: 14px;
        }
        
        .filter-group select,
        .filter-group input {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
          min-width: 120px;
        }
        
        .records-table-container {
          overflow-x: auto;
          margin-top: 20px;
        }
        
        .records-table {
          width: 100%;
          border-collapse: collapse;
          background-color: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .records-table th {
          background-color: #e9ecef;
          font-weight: bold;
          color: #495057;
          padding: 12px 15px;
          text-align: left;
          border-bottom: 2px solid #dee2e6;
          cursor: pointer;
          user-select: none;
        }
        
        .records-table th:hover {
          background-color: #dee2e6;
        }
        
        .records-table td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #dee2e6;
        }
        
        .records-table tr:hover {
          background-color: #f8f9fa;
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .status-badge.present {
          background-color: #d4edda;
          color: #155724;
        }
        
        .status-badge.absent {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        .status-badge.late {
          background-color: #fff3cd;
          color: #856404;
        }
        
        .status-badge.half-day {
          background-color: #e2e3e5;
          color: #383d41;
        }
        
        .loading-records {
          padding: 40px;
          text-align: center;
          color: #6c757d;
          font-style: italic;
        }
        
        .no-records {
          padding: 40px;
          text-align: center;
          color: #6c757d;
          font-style: italic;
          background-color: white;
          border-radius: 8px;
          margin-top: 20px;
        }
        
        /* Login Popup Modal Styles */
        .login-popup-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1001;
        }
        
        .login-popup-content {
          background-color: white;
          border-radius: 12px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          animation: popupSlideIn 0.3s ease-out;
        }
        
        /* Already Logged In Popup Modal Styles */
        .already-loggedin-popup-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1001;
        }
        
        .already-loggedin-popup-content {
          background-color: white;
          border-radius: 12px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          animation: popupSlideIn 0.3s ease-out;
        }
        
        .already-loggedin-popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #ffc107, #fd7e14);
          color: white;
        }
        
        .already-loggedin-popup-body {
          padding: 30px 20px;
          text-align: center;
        }
        
        .already-loggedin-popup-actions {
          padding: 15px 20px;
          background-color: #f8f9fa;
          border-top: 1px solid #dee2e6;
          display: flex;
          justify-content: center;
        }
        
        @keyframes popupSlideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .login-popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
        }
        
        .login-popup-body {
          padding: 30px 20px;
          text-align: center;
        }
        
        .popup-icon {
          font-size: 48px;
          color: #28a745;
          margin-bottom: 15px;
        }
        
        .already-loggedin-popup-body .popup-icon {
          color: #dc3545;
        }
        
        .popup-message {
          font-size: 1.2em;
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
        }
        
        .popup-time {
          color: #666;
          font-size: 0.9em;
        }
        
        .login-popup-actions {
          padding: 15px 20px;
          background-color: #f8f9fa;
          border-top: 1px solid #dee2e6;
          display: flex;
          justify-content: center;
        }
        
        .login-popup-actions .btn {
          min-width: 100px;
        }
        
        /* Excel Preview Modal Styles */
        .excel-preview-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .excel-preview-content {
          background-color: white;
          border-radius: 8px;
          width: 90%;
          max-width: 1000px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .excel-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background-color: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
        }
        
        .excel-preview-header h3 {
          margin: 0;
          color: #495057;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6c757d;
        }
        
        .close-btn:hover {
          color: #495057;
        }
        
        .excel-table-container {
          overflow: auto;
          flex: 1;
          padding: 0;
        }
        
        .excel-preview-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .excel-preview-table th,
        .excel-preview-table td {
          padding: 10px 12px;
          border: 1px solid #dee2e6;
          text-align: left;
        }
        
        .excel-preview-table th {
          background-color: #e9ecef;
          font-weight: bold;
          position: sticky;
          top: 0;
        }
        
        .excel-preview-table tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        
        .excel-preview-table tr:hover {
          background-color: #e9ecef;
        }
        
        .excel-preview-actions {
          padding: 15px 20px;
          background-color: #f8f9fa;
          border-top: 1px solid #dee2e6;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        
        @media (max-width: 768px) {
          .attendance-container {
            padding: 15px;
          }
          
          .controls {
            flex-direction: column;
          }
          
          .btn {
            width: 100%;
          }
          
          .video-section video,
          .camera-placeholder {
            width: 100%;
            height: auto;
            max-height: 300px;
          }
          
          .filters {
            flex-direction: column;
            align-items: stretch;
          }
          
          .filter-group select,
          .filter-group input {
            width: 100%;
          }
          
          .records-table {
            font-size: 0.9em;
          }
          
          .records-table th,
          .records-table td {
            padding: 8px 10px;
          }
          
          .login-popup-content,
          .already-loggedin-popup-content {
            width: 95%;
            margin: 10px;
          }
          
          .excel-preview-content {
            width: 95%;
            height: 90vh;
          }
          
          .excel-preview-actions {
            flex-direction: column;
          }
          
          .excel-preview-actions .btn {
            width: 100%;
          }
        }

      `}</style>
    </div>
  );
};

export default Attendance;