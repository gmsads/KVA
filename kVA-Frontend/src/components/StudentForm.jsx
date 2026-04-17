import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import * as faceapi from 'face-api.js';

const StudentForm = () => {
  const [formData, setFormData] = useState({
    admissionNo: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    level: '',
    class: '',
    school: '',
    board: '',
    parentName: '',
    parentPhone: '',
    address: '',
    dateOfAdmission: '',
    feeParticulars: '',
    academicReport: '',
    subjects: [],
    joiningDate: '',
    status: 'active',
    aadhaarNumber: '',
    admissionReference: '',
    referralPersonName: ''
  });

  const [faceCaptured, setFaceCaptured] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        setLoading(false);
        toast.success('Face models loaded successfully!');
      } catch (error) {
        console.error('Error loading face models:', error);
        setLoading(false);
        toast.error(`Failed to load face detection models: ${error.message}`);
      }
    };

    loadModels();
  }, []);

  const startCamera = async () => {
    try {
      if (!modelsLoaded) {
        toast.info('Please wait for face models to load');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);

      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error('Camera not found. Please check device permissions.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        toast.error('Camera is already in use by another application.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Camera permission denied. Please allow camera access.');
      } else {
        toast.error(`Camera error: ${err.message}`);
      }
    }
  };

  const captureFace = async () => {
    try {
      if (!videoRef.current || !modelsLoaded) {
        toast.error('Camera not ready or models not loaded');
        return;
      }

      const detectionOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.5
      });

      const detection = await faceapi
        .detectSingleFace(videoRef.current, detectionOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setFaceDescriptor(Array.from(detection.descriptor));
        setFaceCaptured(true);

        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());

        toast.success('Face captured successfully!');
      } else {
        toast.error('Face not detected. Try again with better lighting.');
      }
    } catch (error) {
      console.error('Error capturing face:', error);
      toast.error('Failed to capture face. Please try again.');
    }
  };

  const [studentId, setStudentId] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const levels = [
    { value: 'primary', label: 'Primary (1st - 3rd)' },
    { value: 'secondary', label: 'Secondary (4th - 5th)' },
    { value: 'high-school', label: 'High School (6th - 7th)' },
    { value: 'senior', label: 'Senior (8th - 10th)' }
  ];

  const boards = [
    { value: 'cbse', label: 'CBSE' },
    { value: 'icse', label: 'ICSE' },
    { value: 'state', label: 'State Board' },
    { value: 'ib', label: 'IB' },
    { value: 'igcse', label: 'IGCSE' }
  ];

  const admissionReferenceOptions = [
    { value: 'walk-in', label: 'Walk-in' },
    { value: 'referral', label: 'Referral' },
    { value: 'online-ad', label: 'Online Advertisement' },
    { value: 'social-media', label: 'Social Media' },
    { value: 'other', label: 'Other' }
  ];

  const subjectsByLevel = {
    primary: ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi'],
    secondary: ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer Basics'],
    'high-school': ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Hindi'],
    senior: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Economics', 'Business Studies', 'Accountancy']
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'class') {
      const classNum = parseInt(value.match(/\d+/)?.[0] || '0');
      let level = '';

      if (classNum >= 1 && classNum <= 3) level = 'primary';
      else if (classNum >= 4 && classNum <= 5) level = 'secondary';
      else if (classNum >= 6 && classNum <= 7) level = 'high-school';
      else if (classNum >= 8 && classNum <= 10) level = 'senior';

      setFormData(prev => ({
        ...prev,
        [name]: value,
        level: level
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubjectChange = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleClearForm = () => {
    setFormData({
      admissionNo: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      level: '',
      class: '',
      school: '',
      board: '',
      parentName: '',
      parentPhone: '',
      address: '',
      dateOfAdmission: '',
      feeParticulars: '',
      academicReport: '',
      subjects: [],
      joiningDate: '',
      status: 'active',
      aadhaarNumber: '',
      admissionReference: '',
      referralPersonName: ''
    });

    setIsSubmitted(false);
    setStudentId(null);
    setFaceCaptured(false);
    setFaceDescriptor(null);

    toast.info('Form cleared!');
  };

  const handleProceedToPayment = () => {
    navigate(`/fee-payment/${studentId}`);
  };

  const handleAddAnotherStudent = () => {
    setFormData({
      admissionNo: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      level: '',
      class: '',
      school: '',
      board: '',
      parentName: '',
      parentPhone: '',
      address: '',
      dateOfAdmission: '',
      feeParticulars: '',
      academicReport: '',
      subjects: [],
      joiningDate: '',
      status: 'active',
      aadhaarNumber: '',
      admissionReference: '',
      referralPersonName: ''
    });

    setIsSubmitted(false);
    setStudentId(null);
    setFaceCaptured(false);
    setFaceDescriptor(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!faceCaptured) {
      toast.error('Please capture your face before submitting');
      return;
    }

    if (formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber)) {
      toast.error('Aadhaar number must be 12 digits');
      return;
    }

    if (formData.admissionReference === 'referral' && !formData.referralPersonName) {
      toast.error('Please enter the referral person name');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          faceDescriptor,
          dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
          dateOfAdmission: new Date(formData.dateOfAdmission).toISOString(),
          joiningDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add student');
      }

      const data = await response.json();
      setStudentId(data.data._id || data.data.id);
      setIsSubmitted(true);

      // Store student ID for attendance system
      localStorage.setItem('currentStudentId', data.data._id || data.data.id);

      toast.success('Student added successfully!');
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error(`Error: ${error.message}`);
    }
  };


  if (isSubmitted) {
    return (
      <div className="student-form">
        <ToastContainer />
        <div className="card success-card">
          <h2>Student Added Successfully!</h2>
          <div className="success-message">
            <p>The student has been successfully registered in the system.</p>
            <p>Admission No: <strong>{formData.admissionNo}</strong></p>
            <p>Student Name: <strong>{formData.firstName} {formData.lastName}</strong></p>
            <p>Student ID: <strong>{studentId}</strong></p>
          </div>

          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={handleProceedToPayment}
            >
              Proceed to Payment
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleAddAnotherStudent}
            >
              Add Another Student
            </button>
          </div>
        </div>

        <style>{`
          .student-form {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .success-card {
            text-align: center;
            padding: 40px;
          }
          
          .success-message {
            margin: 30px 0;
            padding: 20px;
            background-color: #f8fff9;
            border: 1px solid #d4edda;
            border-radius: 8px;
          }
          
          .success-message p {
            margin: 10px 0;
            font-size: 16px;
          }
          
          .action-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 30px;
          }
          
          .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
          }
          
          .btn-primary {
            background-color: #4CAF50;
            color: white;
          }
          
          .btn-secondary {
            background-color: #f0f0f0;
            color: #333;
          }
          
          @media (max-width: 768px) {
            .action-buttons {
              flex-direction: column;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="student-form">
      <ToastContainer />
      <div className="card">
        <h2>Add New Student</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Admission No *</label>
              <input
                type="text"
                name="admissionNo"
                value={formData.admissionNo}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Date of Admission *</label>
              <input
                type="date"
                name="dateOfAdmission"
                value={formData.dateOfAdmission}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
             <div className="form-group">
              <label>Contact No *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and restrict to 10 digits
                  if (/^\d{0,10}$/.test(value)) {
                    handleInputChange(e);
                  }
                }}
                pattern="\d{10}"
                maxLength={10}
                placeholder="Enter 10-digit number"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Aadhaar Number</label>
              <input
                type="text"
                name="aadhaarNumber"
                value={formData.aadhaarNumber}
                onChange={handleInputChange}
                placeholder="12-digit number"
                maxLength="12"
                pattern="[0-9]{12}"
              />
            </div>
            <div className="form-group">
              <label>Admission Reference</label>
              <select
                name="admissionReference"
                value={formData.admissionReference}
                onChange={handleInputChange}
              >
                <option value="">Select Reference</option>
                {admissionReferenceOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.admissionReference === 'referral' && (
            <div className="form-row">
              <div className="form-group">
                <label>Referral Person Name *</label>
                <input
                  type="text"
                  name="referralPersonName"
                  value={formData.referralPersonName}
                  onChange={handleInputChange}
                  placeholder="Enter referral person name"
                  required
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Class *</label>
              <input
                type="text"
                name="class"
                value={formData.class}
                onChange={handleInputChange}
                placeholder="e.g., 5th A, 10th B"
                required
              />
            </div>
            <div className="form-group">
              <label>Education Level *</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Level</option>
                {levels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>School *</label>
              <input
                type="text"
                name="school"
                value={formData.school}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Board *</label>
              <select
                name="board"
                value={formData.board}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Board</option>
                {boards.map(board => (
                  <option key={board.value} value={board.value}>
                    {board.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Parent/Guardian Name *</label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleInputChange}
                required
              />
            </div>
          

            <div className="form-group">
              <label>Parent Phone *</label>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ padding: "10px", background: "#f0f0f0", border: "1px solid #ddd", borderRadius: "4px 0 0 4px" }}>+91</span>
                <input
                  type="tel"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only numbers, 10 digits
                    if (/^\d{0,10}$/.test(value)) {
                      handleInputChange({
                        target: { name: "parentPhone", value }
                      });
                    }
                  }}
                  pattern="\d{10}"
                  maxLength={10}
                  placeholder="Enter 10-digit number"
                  required
                  style={{ borderRadius: "0 4px 4px 0", flex: 1 }}
                />
              </div>
            </div>


          </div>

          <div className="form-group">
            <label>Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label>Academic Report</label>
            <textarea
              name="academicReport"
              value={formData.academicReport}
              onChange={handleInputChange}
              rows="3"
              placeholder="Brief academic performance summary"
            />
          </div>

          {formData.level && (
            <div className="form-group">
              <label>Subjects *</label>
              <div className="subject-selection">
                {subjectsByLevel[formData.level]?.map(subject => (
                  <div key={subject} className="subject-item">
                    <input
                      type="checkbox"
                      id={subject}
                      checked={formData.subjects.includes(subject)}
                      onChange={() => handleSubjectChange(subject)}
                    />
                    <label htmlFor={subject}>{subject}</label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="face-capture-section">
            <h3>Facial Recognition</h3>
            <div className="face-capture">
              <video
                ref={videoRef}
                id="video"
                width="300"
                height="200"
                autoPlay
                muted
                playsInline
              />
              <div className="camera-controls">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={startCamera}
                  disabled={!modelsLoaded || loading}
                >
                  {loading ? 'Loading Models...' : 'Start Camera'}
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={captureFace}
                  disabled={!modelsLoaded || faceCaptured || loading}
                >
                  Capture Face
                </button>
                {faceCaptured && (
                  <div className="capture-status">
                    <span>Face captured ✅</span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setFaceCaptured(false);
                        setFaceDescriptor(null);
                        startCamera();
                      }}
                    >
                      Retake
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="camera-help">
              Ensure good lighting and face the camera directly for best results.
            </p>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!faceCaptured}
            >
              Add Student
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleClearForm}>
              Clear Form
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .student-form {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 25px;
        }
        
        h2 {
          margin-top: 0;
          margin-bottom: 25px;
          color: #333;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #555;
        }
        
        input, select, textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .subject-selection {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }
        
        .subject-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        
        .subject-item input[type="checkbox"] {
          width: auto;
        }
        
        .subject-item label {
          margin: 0;
          cursor: pointer;
        }
        
        .face-capture-section {
          margin: 25px 0;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: #f9f9f9;
        }
        
        .face-capture {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }
        
        .face-capture video {
          border: 2px solid #ddd;
          border-radius: 8px;
          background: #000;
        }
        
        .camera-controls {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .capture-status {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: #e8f5e9;
          border-radius: 4px;
          color: #2e7d32;
        }
        
        .camera-help {
          text-align: center;
          font-size: 0.9em;
          color: #666;
          margin-top: 10px;
        }
        
        .form-actions {
          display: flex;
          gap: 15px;
          margin-top: 30px;
          justify-content: center;
        }
        
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .btn-primary {
          background-color: #4CAF50;
          color: white;
        }
        
        .btn-secondary {
          background-color: #f0f0f0;
          color: #333;
        }
        
        .btn-success {
          background-color: #28a745;
          color: white;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .subject-selection {
            grid-template-columns: 1fr;
          }
          
          .camera-controls {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentForm;