import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AllStudents = () => {
  // STATE MANAGEMENT
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    level: 'primary',
    class: '',
    status: 'active',
    parentPhone: '',
    parentName: '',
    admissionReference: 'walk-in',
    referralPersonName: '',
    subjects: []
  });

  // FETCH STUDENTS DATA
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/students');

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        setStudents(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error(`Failed to load students: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      // First get the current student data
      const student = students.find(s => s._id === id);
      if (!student) return;
      
      // Create updated student with new status
      const updatedStudent = { ...student, status: newStatus };
      
      const response = await fetch(
        `http://localhost:5000/api/students/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(updatedStudent)
        }
      );

      if (!response.ok) {
        throw new Error('Status update failed');
      }

      // Update in local state only after successful API call
      setStudents(prev =>
        prev.map(student =>
          student._id === id ? { ...student, status: newStatus } : student
        )
      );
      
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Status toggle error:', error);
      toast.error(`Failed to update status: ${error.message}`);
    }
  };

  // HELPER FUNCTIONS
  const levelLabels = {
    primary: 'Primary',
    secondary: 'Secondary',
    'high-school': 'High School',
    senior: 'Senior'
  };

  const boardLabels = {
    cbse: 'CBSE',
    icse: 'ICSE',
    state: 'State Board',
    ib: 'IB',
    igcse: 'IGCSE'
  };

  const attendanceLabels = {
    regular: 'Regular',
    irregular: 'Irregular',
    poor: 'Poor'
  };

  const admissionReferenceLabels = {
    'walk-in': 'Walk-in',
    'referral': 'Referral',
    'online-ad': 'Online Advertisement',
    'social-media': 'Social Media',
    'other': 'Other'
  };

  // EDIT STUDENT HANDLERS
  const handleEdit = (studentId) => {
    const student = students.find(s => s._id === studentId);
    if (student) {
      setEditingStudent(studentId);
      setEditFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        level: student.level,
        class: student.class,
        status: student.status,
        parentPhone: student.parentPhone,
        parentName: student.parentName,
        admissionReference: student.admissionReference || 'walk-in',
        referralPersonName: student.referralPersonName || '',
        subjects: student.subjects ? [...student.subjects] : []
      });
    }
  };

  // VIEW STUDENT HANDLER
  const handleView = (studentId) => {
    const student = students.find(s => s._id === studentId);
    if (student) {
      setViewingStudent(student);
    }
  };

  // CLOSE VIEW MODAL
  const handleCloseView = () => {
    setViewingStudent(null);
  };

  // DOWNLOAD STUDENT DETAILS
  const handleDownload = () => {
    if (!viewingStudent) return;
    
    const studentDetails = `
      Student Details
      ================
      
      Basic Information:
      ------------------
      Admission No: ${viewingStudent.admissionNo || 'N/A'}
      First Name: ${viewingStudent.firstName}
      Last Name: ${viewingStudent.lastName}
      Email: ${viewingStudent.email || 'N/A'}
      Contact No: ${viewingStudent.phone}
      Date of Birth: ${viewingStudent.dateOfBirth ? new Date(viewingStudent.dateOfBirth).toLocaleDateString() : 'N/A'}
      Gender: ${viewingStudent.gender || 'N/A'}
      Aadhaar Number: ${viewingStudent.aadhaarNumber || 'N/A'}
      
      Academic Information:
      ---------------------
      Education Level: ${levelLabels[viewingStudent.level] || viewingStudent.level}
      Class: ${viewingStudent.class}
      School: ${viewingStudent.school || 'N/A'}
      Board: ${viewingStudent.board ? boardLabels[viewingStudent.board] : 'N/A'}
      Attendance: ${viewingStudent.attendance ? attendanceLabels[viewingStudent.attendance] : 'N/A'}
      Fee Particulars: ${viewingStudent.feeParticulars || 'N/A'}
      
      Parent/Guardian Information:
      ----------------------------
      Parent Name: ${viewingStudent.parentName || 'N/A'}
      Parent Phone: ${viewingStudent.parentPhone}
      
      Admission Reference:
      --------------------
      Reference Type: ${viewingStudent.admissionReference ? admissionReferenceLabels[viewingStudent.admissionReference] : 'N/A'}
      Referral Person: ${viewingStudent.referralPersonName || 'N/A'}
      
      Additional Information:
      -----------------------
      Address: ${viewingStudent.address || 'N/A'}
      Date of Admission: ${viewingStudent.dateOfAdmission ? new Date(viewingStudent.dateOfAdmission).toLocaleDateString() : 'N/A'}
      Joining Date: ${viewingStudent.joiningDate ? new Date(viewingStudent.joiningDate).toLocaleDateString() : 'N/A'}
      Status: ${viewingStudent.status}
      
      Subjects:
      ---------
      ${viewingStudent.subjects && viewingStudent.subjects.length > 0 
        ? viewingStudent.subjects.join(', ') 
        : 'N/A'}
    `;
    
    const blob = new Blob([studentDetails], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_${viewingStudent.firstName}_${viewingStudent.lastName}_details.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (index, value) => {
    const newSubjects = [...editFormData.subjects];
    newSubjects[index] = value;
    setEditFormData(prev => ({ ...prev, subjects: newSubjects }));
  };

  const addSubject = () => {
    setEditFormData(prev => ({ ...prev, subjects: [...prev.subjects, ''] }));
  };

  const removeSubject = (index) => {
    const newSubjects = [...editFormData.subjects];
    newSubjects.splice(index, 1);
    setEditFormData(prev => ({ ...prev, subjects: newSubjects }));
  };

  // SAVE EDITED STUDENT FUNCTION
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        ...editFormData,
        subjects: editFormData.subjects.filter(subject => subject.trim() !== '')
      };

      const response = await fetch(
        `http://localhost:5000/api/students/${editingStudent}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(updatedData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Update failed');
      }

      const result = await response.json();
      const updatedStudent = result.data || result;

      if (!updatedStudent || !updatedStudent._id) {
        throw new Error('Invalid student data received from server');
      }

      setStudents(students.map(student =>
        student._id === editingStudent ? updatedStudent : student
      ));

      toast.success('Student updated successfully');
      setEditingStudent(null);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(`Update failed: ${error.message}`);
    }
  };

  // OTHER CRUD OPERATIONS
  const handleCancelEdit = () => setEditingStudent(null);

  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/students/${studentId}`,
          {
            method: 'DELETE',
            headers: { 'Accept': 'application/json' }
          }
        );

        if (!response.ok) {
          throw new Error('Delete failed');
        }

        setStudents(students.filter(student => student._id !== studentId));
        toast.success('Student deleted successfully');
      } catch (error) {
        console.error('Delete error:', error);
        toast.error(`Delete failed: ${error.message}`);
      }
    }
  };

  // FILTERING
  const filteredStudents = students.filter(student => {
    const levelMatch = filterLevel === 'all' || student.level === filterLevel;
    const statusMatch = filterStatus === 'all' || student.status === filterStatus;
    return levelMatch && statusMatch;
  });

  const getStudentCount = (level, status) => {
    return students.filter(student => {
      const levelMatch = level === 'all' || student.level === level;
      const statusMatch = status === 'all' || student.status === status;
      return levelMatch && statusMatch;
    }).length;
  };

  if (loading) {
    return <div className="loading">Loading students...</div>;
  }

  return (
    <div className="all-students">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="card">
        <h2>Student Database</h2>

        {/* EDIT MODAL */}
        {editingStudent && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Edit Student</h3>
              <form onSubmit={handleFormSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={editFormData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={editFormData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Level</label>
                    <select
                      name="level"
                      value={editFormData.level}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="high-school">High School</option>
                      <option value="senior">Senior</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Class</label>
                    <input
                      type="text"
                      name="class"
                      value={editFormData.class}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={editFormData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Parent Phone</label>
                    <input
                      type="text"
                      name="parentPhone"
                      value={editFormData.parentPhone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Parent Name</label>
                    <input
                      type="text"
                      name="parentName"
                      value={editFormData.parentName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Admission Reference</label>
                    <select
                      name="admissionReference"
                      value={editFormData.admissionReference}
                      onChange={handleInputChange}
                    >
                      <option value="walk-in">Walk-in</option>
                      <option value="referral">Referral</option>
                      <option value="online-ad">Online Advertisement</option>
                      <option value="social-media">Social Media</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {editFormData.admissionReference === 'referral' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Referral Person Name</label>
                      <input
                        type="text"
                        name="referralPersonName"
                        value={editFormData.referralPersonName}
                        onChange={handleInputChange}
                        placeholder="Enter referral person name"
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Subjects</label>
                  <div className="subjects-container">
                    {editFormData.subjects.map((subject, index) => (
                      <div key={index} className="subject-input-group">
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => handleSubjectChange(index, e.target.value)}
                          placeholder="Subject name"
                        />
                        <button
                          type="button"
                          className="remove-subject"
                          onClick={() => removeSubject(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="add-subject"
                      onClick={addSubject}
                    >
                      + Add Subject
                    </button>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW STUDENT MODAL */}
        {viewingStudent && (
          <div className="modal-overlay">
            <div className="modal view-modal">
              <h3>Student Details</h3>
              <div id="student-details-content">
                <div className="student-details">
                  <div className="detail-section">
                    <h4>Basic Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Admission No</label>
                        <p>{viewingStudent.admissionNo || 'N/A'}</p>
                      </div>
                      <div className="detail-item">
                        <label>First Name</label>
                        <p>{viewingStudent.firstName}</p>
                      </div>
                      <div className="detail-item">
                        <label>Last Name</label>
                        <p>{viewingStudent.lastName}</p>
                      </div>
                      <div className="detail-item">
                        <label>Email</label>
                        <p>{viewingStudent.email || 'N/A'}</p>
                      </div>
                      <div className="detail-item">
                        <label>Contact No</label>
                        <p>{viewingStudent.phone}</p>
                      </div>
                      <div className="detail-item">
                        <label>Date of Birth</label>
                        <p>{viewingStudent.dateOfBirth ? new Date(viewingStudent.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div className="detail-item">
                        <label>Gender</label>
                        <p>{viewingStudent.gender || 'N/A'}</p>
                      </div>
                      <div className="detail-item">
                        <label>Aadhaar Number</label>
                        <p>{viewingStudent.aadhaarNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Academic Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Education Level</label>
                        <p>{levelLabels[viewingStudent.level] || viewingStudent.level}</p>
                      </div>
                      <div className="detail-item">
                        <label>Class</label>
                        <p>{viewingStudent.class}</p>
                      </div>
                      <div className="detail-item">
                        <label>School</label>
                        <p>{viewingStudent.school || 'N/A'}</p>
                      </div>
                      <div className="detail-item">
                        <label>Board</label>
                        <p>{viewingStudent.board ? boardLabels[viewingStudent.board] : 'N/A'}</p>
                      </div>
                      <div className="detail-item">
                        <label>Attendance</label>
                        <p>{viewingStudent.attendance ? attendanceLabels[viewingStudent.attendance] : 'N/A'}</p>
                      </div>
                      <div className="detail-item">
                        <label>Fee Particulars</label>
                        <p>{viewingStudent.feeParticulars || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Parent/Guardian Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Parent Name</label>
                        <p>{viewingStudent.parentName || 'N/A'}</p>
                      </div>
                      <div className="detail-item">
                        <label>Parent Phone</label>
                        <p>{viewingStudent.parentPhone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Admission Reference</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Reference Type</label>
                        <p>{viewingStudent.admissionReference ? admissionReferenceLabels[viewingStudent.admissionReference] : 'N/A'}</p>
                      </div>
                      <div className="detail-item">
                        <label>Referral Person</label>
                        <p>{viewingStudent.referralPersonName || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Additional Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item full-width">
                        <label>Address</label>
                        <p>{viewingStudent.address || 'N/A'}</p>
                      </div>
                      <div className="detail-item">
                        <label>Date of Admission</label>
                        <p>{viewingStudent.dateOfAdmission ? new Date(viewingStudent.dateOfAdmission).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div className="detail-item">
                        <label>Joining Date</label>
                        <p>{viewingStudent.joiningDate ? new Date(viewingStudent.joiningDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div className="detail-item">
                        <label>Status</label>
                        <p>
                          <span className={`status-badge ${viewingStudent.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                            {viewingStudent.status}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {viewingStudent.subjects && viewingStudent.subjects.length > 0 && (
                    <div className="detail-section">
                      <h4>Subjects</h4>
                      <div className="subject-tags">
                        {viewingStudent.subjects.map((subject, index) => (
                          <span key={index} className="subject-tag">
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingStudent.academicReport && (
                    <div className="detail-section">
                      <h4>Academic Report</h4>
                      <p>{viewingStudent.academicReport}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button
                  onClick={handleDownload}
                  className="btn btn-primary"
                  style={{ marginRight: '10px' }}
                >
                  Download
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCloseView}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FILTER CONTROLS */}
        <div className="filter-section">
          <div className="filter-group">
            <div className="form-group">
              <label>Filter by Level</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
              >
                <option value="all">All Levels</option>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="high-school">High School</option>
                <option value="senior">Senior</option>
              </select>
            </div>
            <div className="form-group">
              <label>Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="filter-summary">
              <span>Showing {filteredStudents.length} of {students.length} students</span>
            </div>
          </div>
        </div>

        {/* STATISTICS */}
        <div className="stats-row">
          <div className="mini-stat">
            <span className="mini-stat-number">{getStudentCount('all', 'active')}</span>
            <span className="mini-stat-label">Active</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-number">{getStudentCount('primary', 'all')}</span>
            <span className="mini-stat-label">Primary</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-number">{getStudentCount('secondary', 'all')}</span>
            <span className="mini-stat-label">Secondary</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-number">{getStudentCount('high-school', 'all')}</span>
            <span className="mini-stat-label">High School</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-number">{getStudentCount('senior', 'all')}</span>
            <span className="mini-stat-label">Senior</span>
          </div>
        </div>

        {/* STUDENTS TABLE */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Admission No</th>
                <th>Name</th>
                <th>Level</th>
                <th>Class</th>
                <th>School</th>
                <th>Parent Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student._id}>
                    <td>{student.admissionNo || 'N/A'}</td>
                    <td>{student.firstName} {student.lastName}</td>
                    <td>{levelLabels[student.level]}</td>
                    <td>{student.class}</td>
                    <td>{student.school || 'N/A'}</td>
                    <td>{student.parentPhone}</td>
                    <td>
                      <button
                        className={`toggle-btn ${student.status}`}
                        onClick={() => handleStatusToggle(student._id, student.status)}
                      >
                        {student.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>


                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action edit"
                          onClick={() => handleEdit(student._id)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-action view"
                          onClick={() => handleView(student._id)}
                        >
                          View
                        </button>
                        <button
                          className="btn-action delete"
                          onClick={() => handleDelete(student._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-results">
                    No students found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STYLES */}
      <style>{`
/* ==========================
   Layout & Containers
========================== */
.all-students {
  padding: 20px;
  position: relative;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 25px;
}

/* ==========================
   Headings
========================== */
h2, h3, h4 {
  margin-top: 0;
  color: #333;
}
h2 { margin-bottom: 25px; }
h3 { margin-bottom: 20px; }
h4 {
  margin-bottom: 15px;
  color: #555;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

/* ==========================
   Modal
========================== */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 25px;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.view-modal {
  max-width: 800px;
}

/* ==========================
   Forms & Details
========================== */
.form-row, .detail-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-group, .detail-group {
  flex: 1;
  margin-bottom: 15px;
}

.form-group label,
.detail-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.detail-group p {
  margin: 0;
  padding: 8px 0;
  min-height: 18px;
}

.detail-group.full-width {
  flex: 0 0 100%;
}

/* ==========================
   Subjects
========================== */
.subjects-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subject-input-group {
  display: flex;
  gap: 8px;
}

.subject-input-group input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.remove-subject {
  background: #F44336;
  color: white;
  border: none;
  border-radius: 4px;
  width: 30px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-subject {
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 5px;
  width: fit-content;
}

/* ==========================
   Buttons
========================== */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}
.btn-primary:hover { background: #3e8e41; }

.btn-secondary {
  background: #B0BEC5;
  color: white;
}
.btn-secondary:hover { background: #90A4AE; }

/* Action buttons in table */
.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-action {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-action.edit {
  background: #FF8C00;
  color: white;
}
.btn-action.edit:hover { background: #e67c00; }

.btn-action.view {
  background: #2196F3;
  color: white;
}
.btn-action.view:hover { background: #0b7dda; }

.btn-action.delete {
  background: #F44336;
  color: white;
}
.btn-action.delete:hover { background: #d32f2f; }

/* ==========================
   Filters & Stats
========================== */
.filter-section { margin-bottom: 20px; }

.filter-group {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-summary {
  display: flex;
  align-items: flex-end;
  padding-bottom: 8px;
  font-weight: 500;
  color: #666;
}

.stats-row {
  display: flex;
  gap: 20px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.mini-stat {
  background: #f8f9fa;
  padding: 15px 20px;
  border-radius: 8px;
  text-align: center;
  border-top: 3px solid #FF8C00;
  min-width: 100px;
  flex: 1;
}

.mini-stat-number {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #FF8C00;
}

.mini-stat-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

/* ==========================
   Tables
========================== */
.table-container {
  overflow-x: auto;
  margin-top: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #333;
}

.no-results {
  text-align: center;
  color: #666;
  padding: 20px;
}

/* ==========================
   Details view
========================== */
.student-details { margin-bottom: 20px; }
.detail-section { margin-bottom: 25px; }

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.detail-item label {
  font-weight: 600;
  color: #555;
  margin-bottom: 5px;
  display: block;
}
.detail-item p {
  margin: 0;
  padding: 8px 0;
  color: #333;
}
.detail-item.full-width {
  grid-column: 1 / -1;
}

/* Subject tags */
.subject-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.subject-tag {
  background: #e3f2fd;
  color: #1565c0;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

/* ==========================
   Status
========================== */
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.status-active {
  background: #e8f5e9;
  color: #2e7d32;
}
.status-inactive {
  background: #ffebee;
  color: #c62828;
}

/* Toggle button inside table */
.toggle-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  color: white;
}
.toggle-btn.active { background-color: green; }
.toggle-btn.inactive { background-color: red; }
.toggle-btn:hover { transform: scale(1.05); }

/* ==========================
   Misc
========================== */
.loading {
  padding: 20px;
  text-align: center;
  font-size: 18px;
  color: #666;
}

/* ==========================
   Responsive
========================== */
@media (max-width: 768px) {
  .form-row, .detail-row { flex-direction: column; }
  .detail-grid { grid-template-columns: 1fr; }

  .stats-row { justify-content: center; }
  .mini-stat { min-width: calc(50% - 10px); }

  .data-table { font-size: 12px; }
  .data-table th, .data-table td {
    padding: 8px 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .action-buttons { flex-direction: column; gap: 4px; }
  .btn-action { padding: 4px 8px; }
}
`}</style>

    </div>
  );
};

export default AllStudents;