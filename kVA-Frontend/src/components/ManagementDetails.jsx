import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ManagementDetails = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [managementData, setManagementData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    subjects: [],
    salary: '',
    joinDate: '',
    phone: '',
    email: '',
    qualification: '',
    experience: '',
    status: 'active'
  });
  const [currentEditId, setCurrentEditId] = useState(null);

  const positions = [
    'Principal',
    'Vice Principal',
    'Senior Teacher',
    'Junior Teacher',
    'Subject Teacher',
    'Administrative Officer',
    'Accountant',
    'Lab Assistant'
  ];

  const availableSubjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 
    'Hindi', 'Social Studies', 'Computer Science', 'Economics', 
    'Accountancy', 'Business Studies', 'Administration', 'Accounts'
  ];

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/staff');
      setManagementData(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      toast.error('Failed to fetch staff data');
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubjectChange = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      subjects: [],
      salary: '',
      joinDate: '',
      phone: '',
      email: '',
      qualification: '',
      experience: '',
      status: 'active'
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        salary: Number(formData.salary),
        joinDate: new Date(formData.joinDate)
      };
      
      await axios.post('http://localhost:5000/api/staff', dataToSend);
      setShowAddForm(false);
      resetForm();
      fetchStaff();
      toast.success('Staff member added successfully!');
    } catch (err) {
      toast.error(`Failed to add staff member: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleEditClick = (staff) => {
    setFormData({
      name: staff.name,
      position: staff.position,
      subjects: staff.subjects,
      salary: staff.salary.toString(),
      joinDate: staff.joinDate.split('T')[0],
      phone: staff.phone,
      email: staff.email,
      qualification: staff.qualification,
      experience: staff.experience,
      status: staff.status
    });
    setCurrentEditId(staff._id);
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        salary: Number(formData.salary),
        joinDate: new Date(formData.joinDate)
      };
      
      await axios.patch(`http://localhost:5000/api/staff/${currentEditId}`, dataToSend);
      setShowEditForm(false);
      resetForm();
      setCurrentEditId(null);
      fetchStaff();
      toast.success('Staff member updated successfully!');
    } catch (err) {
      toast.error(`Failed to update staff member: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await axios.delete(`http://localhost:5000/api/staff/${id}`);
        fetchStaff();
        toast.success('Staff member deleted successfully!');
      } catch (err) {
        toast.error(`Failed to delete staff member: ${err.message}`);
      }
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await axios.patch(`http://localhost:5000/api/staff/${id}`, { status: newStatus });
      fetchStaff();
      toast.success(`Status changed to ${newStatus}`);
    } catch (err) {
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  const getTotalSalaryExpense = () => {
    return managementData.reduce((total, member) => total + member.salary, 0);
  };

  const getPositionCount = (position) => {
    return managementData.filter(member => member.position === position).length;
  };

  if (loading) return <div className="loading">Loading staff data...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="management-details">
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <div className="management-header">
        <h2>Management & Staff Details</h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowAddForm(true);
            setShowEditForm(false);
          }}
        >
          {showAddForm ? 'Cancel' : 'Add Staff Member'}
        </button>
      </div>

      {(showAddForm || showEditForm) && (
        <div className="add-form-container">
          <div className="card">
            <h3>{showAddForm ? 'Add New Staff Member' : 'Edit Staff Member'}</h3>
            <form onSubmit={showAddForm ? handleAddSubmit : handleEditSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Position *</label>
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Position</option>
                    {positions.map(position => (
                      <option key={position} value={position}>{position}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Monthly Salary (₹) *</label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Join Date *</label>
                  <input
                    type="date"
                    name="joinDate"
                    value={formData.joinDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Qualification</label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    placeholder="e.g., M.Sc Physics, B.Ed"
                  />
                </div>
                <div className="form-group">
                  <label>Experience</label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="e.g., 5 years"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Subjects/Responsibilities</label>
                <div className="subject-selection">
                  {availableSubjects.map(subject => (
                    <div key={subject} className="subject-item">
                      <input
                        type="checkbox"
                        id={`${showAddForm ? 'add' : 'edit'}-${subject}`}
                        checked={formData.subjects.includes(subject)}
                        onChange={() => handleSubjectChange(subject)}
                      />
                      <label htmlFor={`${showAddForm ? 'add' : 'edit'}-${subject}`}>{subject}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <div className="status-radio">
                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={handleInputChange}
                    /> Active
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={handleInputChange}
                    /> Inactive
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {showAddForm ? 'Add Staff Member' : 'Update Staff Member'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setShowEditForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="management-stats">
        <div className="stat-card">
          <div className="stat-number">{managementData.length}</div>
          <div className="stat-label">Total Staff</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">₹{getTotalSalaryExpense().toLocaleString()}</div>
          <div className="stat-label">Monthly Salary Expense</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {getPositionCount('Senior Teacher') + 
             getPositionCount('Junior Teacher') + 
             getPositionCount('Subject Teacher')}
          </div>
          <div className="stat-label">Teaching Staff</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {managementData.filter(m => m.status === 'active').length}
          </div>
          <div className="stat-label">Active Members</div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Subjects</th>
              <th>Salary</th>
              <th>Join Date</th>
              <th>Experience</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {managementData.map(member => (
              <tr key={member._id}>
                <td>
                  <div className="member-info">
                    <strong>{member.name}</strong>
                    <small>{member.qualification}</small>
                  </div>
                </td>
                <td>
                  <span className="position-badge">{member.position}</span>
                </td>
                <td>
                  <div className="subject-tags">
                    {member.subjects.slice(0, 2).map(subject => (
                      <span key={subject} className="subject-tag">
                        {subject}
                      </span>
                    ))}
                    {member.subjects.length > 2 && (
                      <span className="subject-tag more">
                        +{member.subjects.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <strong>₹{member.salary.toLocaleString()}</strong>
                  <small>/month</small>
                </td>
                <td>{new Date(member.joinDate).toLocaleDateString()}</td>
                <td>{member.experience}</td>
                <td>
                  <div className="contact-info">
                    <div>{member.phone}</div>
                    <small>{member.email}</small>
                  </div>
                </td>
                <td>
                  <button 
                    className={`status-badge ${member.status === 'active' ? 'status-active' : 'status-inactive'}`}
                    onClick={() => handleStatusChange(member._id, member.status)}
                  >
                    {member.status}
                  </button>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-action edit"
                      onClick={() => handleEditClick(member)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-action delete"
                      onClick={() => handleDelete(member._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style >{`
        .management-details {
          padding: 20px;
        }
        
        .management-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .btn {
          padding: 8px 16px;
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
        
        .add-form-container {
          margin-bottom: 30px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
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
        
        .status-radio {
          display: flex;
          gap: 15px;
          margin-top: 10px;
        }
        
        .status-radio label {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .form-actions {
          display: flex;
          gap: 15px;
          margin-top: 30px;
        }
        
        .management-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        
        .stat-card {
          background: #fff;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }
        
        .stat-number {
          font-size: 24px;
          font-weight: 600;
          color: #333;
        }
        
        .stat-label {
          font-size: 14px;
          color: #666;
        }
        
        .table-container {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow-x: auto;
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
        }
        
        .member-info {
          display: flex;
          flex-direction: column;
        }
        
        .member-info small {
          color: #666;
          font-size: 11px;
        }
        
        .position-badge {
          background: linear-gradient(135deg, #FF8C00, #FFA500);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .subject-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        
        .subject-tag {
          background: #e3f2fd;
          color: #1565c0;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 500;
        }
        
        .subject-tag.more {
          background: #B0BEC5;
          color: white;
        }
        
        .contact-info {
          display: flex;
          flex-direction: column;
        }
        
        .contact-info small {
          color: #666;
          font-size: 11px;
        }
        
        .status-badge {
          border: none;
          padding: 6px 12px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .status-active {
          background-color: #4CAF50;
          color: white;
        }
        
        .status-inactive {
          background-color: #f44336;
          color: white;
        }
        
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
          background: #2196F3;
          color: white;
        }
        
        .btn-action.edit:hover {
          background: #0b7dda;
        }
        
        .btn-action.delete {
          background: #f44336;
          color: white;
        }
        
        .btn-action.delete:hover {
          background: #d32f2f;
        }
        
        .loading, .error {
          padding: 20px;
          text-align: center;
          font-size: 18px;
        }
        
        .error {
          color: #f44336;
        }
        
        @media (max-width: 768px) {
          .management-header {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .subject-selection {
            grid-template-columns: 1fr;
          }
          
          .management-stats {
            grid-template-columns: 1fr 1fr;
          }
          
          .data-table {
            font-size: 12px;
          }
          
          .data-table th,
          .data-table td {
            padding: 8px 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default ManagementDetails;