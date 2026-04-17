import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';

const StudentDetails = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleClasses, setVisibleClasses] = useState({});
  const [studentsPerClass] = useState(6);

  // API configuration
  const API_URL = "http://localhost:5000/api/students";
  const modalRef = useRef();

  // Fetch students from API
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(API_URL);
        
        // Handle different response formats
        let studentsData = [];
        if (Array.isArray(response.data)) {
          studentsData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          studentsData = response.data.data;
        } else if (response.data && response.data.students) {
          studentsData = response.data.students;
        }
        
        setStudents(studentsData);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError("Failed to load student data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudents();
  }, []);

  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.firstName?.toLowerCase().includes(searchLower) ||
      student.lastName?.toLowerCase().includes(searchLower) ||
      student.admissionNo?.toLowerCase().includes(searchLower) ||
      student.class?.toLowerCase().includes(searchLower) ||
      student.parentName?.toLowerCase().includes(searchLower)
    );
  });

  // Group students by class
  const studentsByClass = filteredStudents && Array.isArray(filteredStudents) ? filteredStudents.reduce((acc, student) => {
    const className = student.class || 'Not Assigned';
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(student);
    return acc;
  }, {}) : {};

  // Toggle visibility for a class (show more/less)
  const toggleClassVisibility = (className) => {
    setVisibleClasses(prev => ({
      ...prev,
      [className]: !prev[className]
    }));
  };

  // Handle student selection
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  // Close student details modal
  const handleCloseDetails = () => {
    setSelectedStudent(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  };

  // Print student details
  const handlePrint = () => {
    const printContent = modalRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    
    // Reload the page to restore functionality
    window.location.reload();
  };

  // Download student details as PDF
  const handleDownload = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Student Details', 105, 15, { align: 'center' });
    
    // Add student information
    doc.setFontSize(12);
    let yPosition = 30;
    
    // Personal Information
    doc.setFont(undefined, 'bold');
    doc.text('Personal Information', 14, yPosition);
    yPosition += 8;
    doc.setFont(undefined, 'normal');
    
    doc.text(`Full Name: ${selectedStudent.firstName} ${selectedStudent.lastName}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Admission No: ${selectedStudent.admissionNo}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Class: ${selectedStudent.class}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Gender: ${selectedStudent.gender}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Date of Birth: ${formatDate(selectedStudent.dateOfBirth)}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Date of Admission: ${formatDate(selectedStudent.dateOfAdmission)}`, 14, yPosition);
    yPosition += 12;
    
    // Contact Information
    doc.setFont(undefined, 'bold');
    doc.text('Contact Information', 14, yPosition);
    yPosition += 8;
    doc.setFont(undefined, 'normal');
    
    doc.text(`Email: ${selectedStudent.email || 'N/A'}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Phone: ${selectedStudent.phone}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Parent Name: ${selectedStudent.parentName}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Parent Phone: ${selectedStudent.parentPhone}`, 14, yPosition);
    yPosition += 7;
    
    // Handle address which might be long
    const addressLines = doc.splitTextToSize(`Address: ${selectedStudent.address}`, 180);
    doc.text(addressLines, 14, yPosition);
    yPosition += (addressLines.length * 7) + 5;
    
    // Academic Information
    doc.setFont(undefined, 'bold');
    doc.text('Academic Information', 14, yPosition);
    yPosition += 8;
    doc.setFont(undefined, 'normal');
    
    doc.text(`School: ${selectedStudent.school}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Board: ${selectedStudent.board}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Level: ${selectedStudent.level}`, 14, yPosition);
    yPosition += 7;
    
    const subjectsText = `Subjects: ${selectedStudent.subjects?.join(', ') || 'N/A'}`;
    const subjectsLines = doc.splitTextToSize(subjectsText, 180);
    doc.text(subjectsLines, 14, yPosition);
    yPosition += (subjectsLines.length * 7) + 5;
    
    const academicReportText = `Academic Report: ${selectedStudent.academicReport || 'N/A'}`;
    const academicReportLines = doc.splitTextToSize(academicReportText, 180);
    doc.text(academicReportLines, 14, yPosition);
    yPosition += (academicReportLines.length * 7) + 12;
    
    // Additional Information
    doc.setFont(undefined, 'bold');
    doc.text('Additional Information', 14, yPosition);
    yPosition += 8;
    doc.setFont(undefined, 'normal');
    
    doc.text(`Aadhaar Number: ${selectedStudent.aadhaarNumber || 'N/A'}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Admission Reference: ${selectedStudent.admissionReference || 'N/A'}`, 14, yPosition);
    yPosition += 7;
    
    if (selectedStudent.admissionReference === 'referral') {
      doc.text(`Referral Person: ${selectedStudent.referralPersonName || 'N/A'}`, 14, yPosition);
      yPosition += 7;
    }
    
    doc.text(`Status: ${selectedStudent.status || 'active'}`, 14, yPosition);
    
    // Save the PDF
    doc.save(`Student_Details_${selectedStudent.admissionNo}.pdf`);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
          Loading student data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          color: '#d32f2f', 
          backgroundColor: '#ffebee', 
          padding: '15px', 
          borderRadius: '4px', 
          border: '1px solid #ffcdd2' 
        }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Student Management</h2>
      
      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search students by name, admission no, class, or parent..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '16px',
            boxSizing: 'border-box'
          }}
        />
      </div>
      
      {!students || students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
          No students found. Please add students first.
        </div>
      ) : filteredStudents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
          No students match your search criteria.
        </div>
      ) : (
        <div style={{ marginTop: '20px' }}>
          {Object.entries(studentsByClass).map(([className, classStudents]) => {
            const showAll = visibleClasses[className];
            const displayStudents = showAll ? classStudents : classStudents.slice(0, studentsPerClass);
            const hasMoreStudents = classStudents.length > studentsPerClass;
            
            return (
              <div key={className} style={{ marginBottom: '30px' }}>
                <h3 style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '10px 15px', 
                  borderRadius: '4px', 
                  marginBottom: '15px', 
                  color: '#333', 
                  borderLeft: '4px solid #2196f3',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{className} ({classStudents.length} students)</span>
                  {hasMoreStudents && (
                    <button
                      onClick={() => toggleClassVisibility(className)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#e0291cff',
                        cursor: 'pointer',
                        fontSize: '18px',
                        fontWeight: '500'
                      }}
                    >
                      {showAll ? 'Show Less' : `Show More (${classStudents.length - studentsPerClass} more)`}
                    </button>
                  )}
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                  gap: '15px' 
                }}>
                  {displayStudents.map((student) => (
                    <div 
                      key={student._id || student.id} 
                      style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '15px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                      }}
                      onClick={() => handleStudentSelect(student)}
                    >
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        flexShrink: '0'
                      }}>
                        {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                      </div>
                      <div style={{ flex: '1' }}>
                        <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>
                          {student.firstName} {student.lastName}
                        </h4>
                        <p style={{ margin: '2px 0', fontSize: '14px', color: '#666' }}>
                          Admission No: {student.admissionNo}
                        </p>
                        <p style={{ margin: '2px 0', fontSize: '14px', color: '#666' }}>
                          Gender: {student.gender}
                        </p>
                        <p style={{ margin: '2px 0', fontSize: '14px', color: '#666' }}>
                          Parent: {student.parentName}
                        </p>
                      </div>
                      <div style={{ alignSelf: 'flex-start' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: student.status === 'inactive' ? '#f44336' : 
                                          student.status === 'alumni' ? '#ff9800' : '#4caf50',
                          color: 'white'
                        }}>
                          {student.status || 'active'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={handleCloseDetails}
        >
          <div 
            ref={modalRef}
            style={{
              background: 'white',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #eee',
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 10
            }}>
              <h3 style={{ margin: 0, color: '#333' }}>Student Details</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handlePrint}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    backgroundColor: '#e0e0e0',
                    color: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>Print</span>
                </button>
                <button 
                  onClick={handleDownload}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>Download PDF</span>
                </button>
                <button 
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#666',
                    padding: 0,
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={handleCloseDetails}
                >
                  ×
                </button>
              </div>
            </div>
            
            <div style={{ padding: '20px' }}>
              {/* Personal Information */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#2196f3', 
                  borderBottom: '1px solid #eee', 
                  paddingBottom: '8px' 
                }}>
                  Personal Information
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '15px' 
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '14px' }}>
                      Full Name:
                    </label>
                    <span style={{ color: '#333' }}>
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '14px' }}>
                      Admission No:
                    </label>
                    <span style={{ color: '#333' }}>{selectedStudent.admissionNo}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '14px' }}>
                      Class:
                    </label>
                    <span style={{ color: '#333' }}>{selectedStudent.class}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '14px' }}>
                      Gender:
                    </label>
                    <span style={{ color: '#333' }}>{selectedStudent.gender}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '14px' }}>
                      Date of Birth:
                    </label>
                    <span style={{ color: '#333' }}>{formatDate(selectedStudent.dateOfBirth)}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '14px' }}>
                      Date of Admission:
                    </label>
                    <span style={{ color: '#333' }}>{formatDate(selectedStudent.dateOfAdmission)}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#2196f3', 
                  borderBottom: '1px solid #eee', 
                  paddingBottom: '8px' 
                }}>
                  Contact Information
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '15px' 
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '666', marginBottom: '5px', fontSize: '14px' }}>
                      Email:
                    </label>
                    <span style={{ color: '#333' }}>{selectedStudent.email || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '666', marginBottom: '5px', fontSize: '14px' }}>
                      Phone:
                    </label>
                    <span style={{ color: '#333' }}>{selectedStudent.phone}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '666', marginBottom: '5px', fontSize: '14px' }}>
                      Parent Name:
                    </label>
                    <span style={{ color: '#333' }}>{selectedStudent.parentName}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '666', marginBottom: '5px', fontSize: '14px' }}>
                      Parent Phone:
                    </label>
                    <span style={{ color: '#333' }}>{selectedStudent.parentPhone}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                    <label style={{ fontWeight: '600', color: '666', marginBottom: '5px', fontSize: '14px' }}>
                      Address:
                    </label>
                    <span style={{ color: '#333', wordBreak: 'break-word' }}>
                      {selectedStudent.address}
                    </span>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#2196f3', 
                  borderBottom: '1px solid #eee', 
                  paddingBottom: '8px' 
                }}>
                  Academic Information
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '15px' 
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '666', marginBottom: '5px', fontSize: '14px' }}>
                      School:
                    </label>
                    <span style={{ color: '#333' }}>{selectedStudent.school}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '666', marginBottom: '5px', fontSize: '14px' }}>
                      Board:
                    </label>
                    <span style={{ color: '#333' }}>{selectedStudent.board}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '666', marginBottom: '5px', fontSize: '14px' }}>
                      Level:
                    </label>
                    <span style={{ color: '#333' }}>{selectedStudent.level}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                    <label style={{ fontWeight: '600', color: '666', marginBottom: '5px', fontSize: '14px' }}>
                      Subjects:
                    </label>
                    <span style={{ color: '#333', wordBreak: 'break-word' }}>
                      {selectedStudent.subjects?.join(', ') || 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                    <label style={{ fontWeight: '600', color: '666', marginBottom: '5px', fontSize: '14px' }}>
                      Academic Report:
                    </label>
                    <span style={{ color: '#333', wordBreak: 'break-word' }}>
                      {selectedStudent.academicReport || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#2196f3', 
                  borderBottom: '1px solid #eee', 
                  paddingBottom: '8px' 
                }}>
                  Additional Information
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '15px' 
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '14px' }}>
                      Aadhaar Number:
                    </label>
                    <span style={{ color: '#333' }}>{selectedStudent.aadhaarNumber || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '14px' }}>
                      Admission Reference:
                    </label>
                    <span style={{ color: '#333' }}>{selectedStudent.admissionReference || 'N/A'}</span>
                  </div>
                  {selectedStudent.admissionReference === 'referral' && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '14px' }}>
                        Referral Person:
                      </label>
                      <span style={{ color: '#333' }}>{selectedStudent.referralPersonName || 'N/A'}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: '600', color: '#666', marginBottom: '5px', fontSize: '14px' }}>
                      Status:
                    </label>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: selectedStudent.status === 'inactive' ? '#f44336' : 
                                      selectedStudent.status === 'alumni' ? '#ff9800' : '#4caf50',
                      color: 'white',
                      display: 'inline-block'
                    }}>
                      {selectedStudent.status || 'active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ 
              padding: '20px', 
              borderTop: '1px solid #eee', 
              display: 'flex', 
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button 
                onClick={handlePrint}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  backgroundColor: '#e0e0e0',
                  color: '#333'
                }}
              >
                Print
              </button>
              <button 
                onClick={handleDownload}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  backgroundColor: '#4caf50',
                  color: 'white'
                }}
              >
                Download PDF
              </button>
              <button 
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  backgroundColor: '#f5f5f5',
                  color: '#333'
                }}
                onClick={handleCloseDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetails;