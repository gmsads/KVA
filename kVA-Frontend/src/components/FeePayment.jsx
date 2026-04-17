import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const FeePayment = () => {
  const { studentId } = useParams();
  
  // State management
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [formData, setFormData] = useState({
    studentName: "",
    admissionNumber: "",
    totalAmount: "",
    paidAmount: "0",
    balanceAmount: "",
    paymentType: "",
    upiNumber: "",
    feeType: "monthly",
    date: new Date().toISOString().split('T')[0],
    dueDate: "",
    remarks: "",
    status: "pending"
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [studentDataLoaded, setStudentDataLoaded] = useState(false);
  const [autoOpenModal, setAutoOpenModal] = useState(false);
  const [overdueReminders, setOverdueReminders] = useState([]);
  const [dueTodayReminders, setDueTodayReminders] = useState([]);
  const [partialReminders, setPartialReminders] = useState([]);
  const [showReminders, setShowReminders] = useState(() => {
    // Get reminder visibility state from localStorage or default to false (show notifications)
    const saved = localStorage.getItem('showReminders');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [hasNewReminders, setHasNewReminders] = useState(false);
  
  // Filter states
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filteredPayments, setFilteredPayments] = useState([]);
  
  // UPI options
  const upiOptions = [
    "9030681333@venka",
    "9030681333@ybl",
    "9030681333@paytm",
    "9030681333@okaxis",
    "9030681333@okicici",
    "9030681333@axl",
    "9030681333@upi"
  ];

  // API configuration
  const API_URL = "http://localhost:5000/api/fee-payments";
  const STUDENTS_API_URL = "http://localhost:5000/api/students";

  // Fixed date formatting function
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return "";
    
    try {
      // Handle both string dates and Date objects
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "";
      
      // Adjust for timezone offset to get the correct date
      const timezoneOffset = date.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(date.getTime() - timezoneOffset);
      
      return adjustedDate.toISOString().split('T')[0];
    } catch (e) {
      console.error("Invalid date format:", dateValue);
      return "";
    }
  };

  // Helper function to format dates for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      console.error("Invalid date format:", dateString);
      return "";
    }
  };

  // Check for overdue, due today, and partial payments
  const checkPaymentReminders = (paymentsList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdue = paymentsList.filter(payment => {
      if (payment.status === "paid") return false;
      
      const dueDate = new Date(payment.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      return dueDate < today;
    });
    
    const dueToday = paymentsList.filter(payment => {
      if (payment.status === "paid") return false;
      
      const dueDate = new Date(payment.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      return dueDate.getTime() === today.getTime();
    });
    
    const partial = paymentsList.filter(payment => {
      return payment.status === "partial" && 
             parseFloat(payment.balanceAmount || 0) > 0;
    });
    
    setOverdueReminders(overdue);
    setDueTodayReminders(dueToday);
    setPartialReminders(partial);
    
    // Check if there are new reminders that haven't been viewed
    if ((overdue.length > 0 || dueToday.length > 0 || partial.length > 0) && !showReminders) {
      setHasNewReminders(true);
    }
  };

  // Save reminder visibility to localStorage
  useEffect(() => {
    localStorage.setItem('showReminders', JSON.stringify(showReminders));
    // If we're showing reminders, mark that there are no new ones
    if (showReminders) {
      setHasNewReminders(false);
    }
  }, [showReminders]);

  // Filter payments by month and year
  useEffect(() => {
    if (!payments.length) return;
    
    const filtered = payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return (
        paymentDate.getMonth() + 1 === parseInt(filterMonth) &&
        paymentDate.getFullYear() === parseInt(filterYear)
      );
    });
    
    setFilteredPayments(filtered);
  }, [payments, filterMonth, filterYear]);

  // Fetch students from API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(STUDENTS_API_URL);
        const studentsData = Array.isArray(response.data) ? response.data : response.data.data || [];
        setStudents(studentsData);
        
        // If studentId is provided in URL, pre-fill the form with student data
        if (studentId) {
          const selectedStudent = studentsData.find(student => student._id === studentId);
          if (selectedStudent) {
            setFormData(prev => ({
              ...prev,
              studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
              admissionNumber: selectedStudent.admissionNo
            }));
            setStudentDataLoaded(true);
            setAutoOpenModal(true); // Set flag to auto-open modal
          } else {
            setError("Student not found with the provided ID");
          }
        }
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError("Failed to load student data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudents();
  }, [studentId]);

  // Auto-open modal when student data is loaded from URL
  useEffect(() => {
    if (autoOpenModal && studentDataLoaded) {
      setModalOpen(true);
      setAutoOpenModal(false);
    }
  }, [autoOpenModal, studentDataLoaded]);

  // Fetch payments from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(API_URL);
        setPayments(response.data);
        checkPaymentReminders(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch payments:", err);
        if (err.code === 'ERR_NETWORK') {
          setError("Cannot connect to server. Please make sure the backend is running on port 5000.");
        } else {
          setError(err.response?.data?.message || "Failed to load payments. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update reminders when payments change
  useEffect(() => {
    checkPaymentReminders(payments);
  }, [payments]);

  // Modal control functions with fixed date handling
  const openModal = (index = null) => {
    if (index !== null) {
      const payment = payments[index];
      setEditIndex(index);
      setFormData({
        ...payment,
        paidAmount: payment.status === "partial" ? "0" : payment.paidAmount,
        date: formatDateForInput(payment.date),
        dueDate: formatDateForInput(payment.dueDate),
        upiNumber: payment.paymentType === "UPI" ? payment.upiNumber || "" : ""
      });
    } else {
      setEditIndex(null);
      setFormData(prev => ({
        ...prev,
        totalAmount: "",
        paidAmount: "0",
        balanceAmount: "",
        paymentType: "",
        upiNumber: "",
        feeType: "monthly",
        date: formatDateForInput(new Date()),
        dueDate: "",
        remarks: "",
        status: "pending"
      }));
    }
    setModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    // Clear student data when closing modal if it was opened via URL
    if (studentId) {
      setFormData(prev => ({
        ...prev,
        studentName: "",
        admissionNumber: ""
      }));
      setStudentDataLoaded(false);
    }
  };

  // View payment handler
  const handleView = (index) => {
    setViewingPayment(payments[index]);
  };

  // Close view modal
  const handleCloseView = () => {
    setViewingPayment(null);
  };

  // Download payment details as text file
  const handleDownload = () => {
    if (!viewingPayment) return;
    
    const content = `
      Fee Payment Receipt
      -------------------
      Student Name: ${viewingPayment.studentName}
      Admission Number: ${viewingPayment.admissionNumber}
      Total Amount: ₹${parseFloat(viewingPayment.totalAmount || 0).toFixed(2)}
      Paid Amount: ₹${parseFloat(viewingPayment.paidAmount || 0).toFixed(2)}
      Balance Amount: ₹${parseFloat(viewingPayment.balanceAmount || 0).toFixed(2)}
      Fee Type: ${viewingPayment.feeType}
      Payment Type: ${viewingPayment.paymentType}
      ${viewingPayment.paymentType === "UPI" ? `UPI Number: ${viewingPayment.upiNumber || "N/A"}` : ""}
      Date: ${formatDateForDisplay(viewingPayment.date)}
      Due Date: ${formatDateForDisplay(viewingPayment.dueDate)}
      Status: ${viewingPayment.status}
      Remarks: ${viewingPayment.remarks || "N/A"}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee-payment-${viewingPayment.admissionNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Print payment details
  const handlePrint = () => {
    const printContent = document.getElementById('payment-details-content').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="text-align: center; margin-bottom: 20px;">Fee Payment Receipt</h2>
        ${printContent}
        <div style="margin-top: 30px; text-align: center; font-size: 12px;">
          Generated on ${new Date().toLocaleDateString()}
        </div>
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };
      
      // Handle amount calculations
      if (name === "totalAmount") {
        const total = parseFloat(value) || 0;
        const paid = parseFloat(updatedData.paidAmount) || 0;
        const balance = Math.max(0, total - paid);
        updatedData.balanceAmount = balance.toFixed(2);
      }
      
      if (name === "paidAmount") {
        const paid = parseFloat(value) || 0;
        const total = parseFloat(updatedData.totalAmount) || 0;
        
        if (editIndex !== null && payments[editIndex]) {
          const originalTotal = parseFloat(payments[editIndex].totalAmount) || 0;
          const originalPaid = parseFloat(payments[editIndex].paidAmount) || 0;
          const newTotalPaid = originalPaid + paid;
          const balance = Math.max(0, originalTotal - newTotalPaid);
          updatedData.balanceAmount = balance.toFixed(2);
        } else {
          const balance = Math.max(0, total - paid);
          updatedData.balanceAmount = balance.toFixed(2);
        }
      }
      
      // Update status
      if (parseFloat(updatedData.balanceAmount) <= 0) {
        updatedData.status = "paid";
      } else if (parseFloat(updatedData.paidAmount) > 0) {
        updatedData.status = "partial";
      } else {
        updatedData.status = "pending";
      }
      
      return updatedData;
    });
  };

  // Form validation
  const validateForm = () => {
    if (!formData.studentName?.trim()) {
      setError("Student name is required");
      return false;
    }
    if (!formData.admissionNumber?.trim()) {
      setError("Admission number is required");
      return false;
    }
    if (!formData.totalAmount || isNaN(formData.totalAmount) || parseFloat(formData.totalAmount) <= 0) {
      setError("Please enter a valid total amount");
      return false;
    }
    if (!formData.date) {
      setError("Payment date is required");
      return false;
    }
    if (!formData.dueDate) {
      setError("Due date is required");
      return false;
    }
    if (formData.paymentType === "UPI" && !formData.upiNumber?.trim()) {
      setError("UPI number is required for UPI payments");
      return false;
    }
    return true;
  };

  // Save payment data
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const isInstallment = editIndex !== null && payments[editIndex]?.status === "partial";
      const paidAmount = isInstallment 
        ? parseFloat(formData.paidAmount || 0)
        : parseFloat(formData.paidAmount || 0);
      
      const payload = {
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        paidAmount: isInstallment 
          ? parseFloat(payments[editIndex].paidAmount) + paidAmount
          : paidAmount,
        balanceAmount: parseFloat(formData.balanceAmount || 0),
        date: new Date(formData.date).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        isInstallment: isInstallment,
        upiNumber: formData.paymentType === "UPI" ? formData.upiNumber : undefined
      };

      let response;
      if (editIndex !== null) {
        response = await axios.put(
          `${API_URL}/${payments[editIndex]._id}`,
          payload
        );
        const updatedPayments = [...payments];
        updatedPayments[editIndex] = response.data;
        setPayments(updatedPayments);
      } else {
        response = await axios.post(API_URL, payload);
        setPayments([response.data, ...payments]);
      }
      
      setError(null);
      closeModal();
    } catch (err) {
      console.error("Error saving payment:", err);
      setError(err.response?.data?.message || "Failed to save payment. Please check your data.");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete payment
  const handleDelete = async (index) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) return;
    
    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/${payments[index]._id}`);
      setPayments(payments.filter((_, i) => i !== index));
      setError(null);
    } catch (err) {
      console.error("Error deleting payment:", err);
      setError(err.response?.data?.message || "Failed to delete payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add installment payment
  const addInstallment = (index) => {
    const payment = payments[index];
    setFormData({
      ...payment,
      paidAmount: "0",
      balanceAmount: payment.balanceAmount,
      date: formatDateForInput(new Date()),
      remarks: "",
      status: payment.balanceAmount > 0 ? "partial" : "paid",
      upiNumber: payment.paymentType === "UPI" ? payment.upiNumber || "" : ""
    });
    setEditIndex(index);
    setModalOpen(true);
  };

  // Status badge component
  const getStatusBadge = (status) => {
    const statusStyles = {
      paid: { background: "#4CAF50", color: "white" },
      partial: { background: "#FFC107", color: "black" },
      pending: { background: "#F44336", color: "white" },
      overdue: { background: "#9C27B0", color: "white" }
    };
    
    return (
      <span style={{
        padding: "3px 8px",
        borderRadius: "12px",
        fontSize: "12px",
        ...(statusStyles[status] || {})
      }}>
        {status?.toUpperCase()}
      </span>
    );
  };

  // Calculate summary totals
  const summaryTotals = filteredPayments.reduce((acc, payment) => {
    acc.total += parseFloat(payment.totalAmount) || 0;
    acc.paid += parseFloat(payment.paidAmount) || 0;
    acc.balance += parseFloat(payment.balanceAmount) || 0;
    return acc;
  }, { total: 0, paid: 0, balance: 0 });

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const monthName = new Date(2023, i, 1).toLocaleString('default', { month: 'long' });
    return { value: monthNum, label: monthName };
  });

  // Generate year options (current year and previous 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const year = currentYear - i;
    return { value: year, label: year.toString() };
  });

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2>Fee Payment Management</h2>
      
      {/* Show message if student was pre-selected */}
      {studentId && studentDataLoaded && (
        <div style={{ 
          padding: "10px", 
          background: "#E8F5E9", 
          color: "#2E7D32",
          marginBottom: "20px",
          borderRadius: "4px",
          border: "1px solid #C8E6C9"
        }}>
          💰 Payment form opened for student: <strong>{formData.studentName}</strong> ({formData.admissionNumber})
        </div>
      )}

      {/* Payment Reminders Notification Bell */}
      {(overdueReminders.length > 0 || dueTodayReminders.length > 0 || partialReminders.length > 0) && !showReminders && (
        <div style={{
          position: "fixed",
          top: "80px", // Moved down from top: 20px
          right: "20px",
          zIndex: 1500,
          cursor: "pointer"
        }}>
          <div 
            onClick={() => setShowReminders(true)}
            style={{
              background: "#F44336",
              color: "white",
              borderRadius: "50%",
              width: "50px",
              height: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
              animation: hasNewReminders ? "pulse 2s infinite" : "none"
            }}
          >
            <span style={{ fontSize: "24px", fontWeight: "bold" }}>⏰</span>
            <div style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              background: "#FF5722",
              color: "white",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "bold"
            }}>
              {overdueReminders.length + dueTodayReminders.length + partialReminders.length}
            </div>
          </div>
          <style>
            {`
              @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
              }
            `}
          </style>
        </div>
      )}

      {/* Payment Reminders Section */}
      {(overdueReminders.length > 0 || dueTodayReminders.length > 0 || partialReminders.length > 0) && showReminders && (
        <div style={{ 
          marginBottom: "20px", 
          border: "2px solid #F44336",
          borderRadius: "8px",
          background: "#FFEBEE",
          position: "relative"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "10px",
            padding: "15px 15px 0 15px"
          }}>
            <h3 style={{ margin: 0, color: "#D32F2F" }}>
              ⚠️ Payment Reminders ({overdueReminders.length + dueTodayReminders.length + partialReminders.length})
            </h3>
            <button 
              onClick={() => setShowReminders(false)}
              style={{ 
                background: "none", 
                border: "none", 
                cursor: "pointer", 
                fontSize: "20px",
                color: "#D32F2F",
                fontWeight: "bold"
              }}
            >
              ×
            </button>
          </div>
          
          {/* Overdue Payments */}
          {overdueReminders.length > 0 && (
            <div style={{ 
              padding: "15px", 
              background: "#FFCDD2", 
              borderTop: "1px solid #F44336",
              borderBottom: (dueTodayReminders.length > 0 || partialReminders.length > 0) ? "1px solid #F44336" : "none"
            }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#B71C1C" }}>
                🔴 Overdue Payments ({overdueReminders.length})
              </h4>
              {overdueReminders.map((payment, index) => (
                <div key={index} style={{ 
                  padding: "10px", 
                  background: "white", 
                  marginBottom: "8px", 
                  borderRadius: "4px",
                  border: "1px solid #E57373",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <strong>{payment.studentName}</strong> ({payment.admissionNumber}) - 
                    Due: {formatDateForDisplay(payment.dueDate)} - 
                    Balance: <span style={{color: "#D32F2F", fontWeight: "bold"}}>₹{parseFloat(payment.balanceAmount || 0).toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => {
                      const paymentIndex = payments.findIndex(p => p._id === payment._id);
                      if (paymentIndex !== -1) addInstallment(paymentIndex);
                    }}
                    style={{
                      background: "#D32F2F",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Add Payment
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Due Today Payments */}
          {dueTodayReminders.length > 0 && (
            <div style={{ 
              padding: "15px", 
              background: "#FFF3E0", 
              borderTop: overdueReminders.length > 0 ? "1px solid #F44336" : "none",
              borderBottom: partialReminders.length > 0 ? "1px solid #F44336" : "none"
            }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#EF6C00" }}>
                🟠 Due Today ({dueTodayReminders.length})
              </h4>
              {dueTodayReminders.map((payment, index) => (
                <div key={index} style={{ 
                  padding: "10px", 
                  background: "white", 
                  marginBottom: "8px", 
                  borderRadius: "4px",
                  border: "1px solid #FFB74D",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <strong>{payment.studentName}</strong> ({payment.admissionNumber}) - 
                    Due: <span style={{color: "#EF6C00", fontWeight: "bold"}}>Today</span> - 
                    Balance: <span style={{color: "#EF6C00", fontWeight: "bold"}}>₹{parseFloat(payment.balanceAmount || 0).toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => {
                      const paymentIndex = payments.findIndex(p => p._id === payment._id);
                      if (paymentIndex !== -1) addInstallment(paymentIndex);
                    }}
                    style={{
                      background: "#FF9800",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Add Payment
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Partial Payments */}
          {partialReminders.length > 0 && (
            <div style={{ 
              padding: "15px", 
              background: "#FFECB3" 
            }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#F57C00" }}>
                🟡 Partial Payments ({partialReminders.length})
              </h4>
              {partialReminders.map((payment, index) => (
                <div key={index} style={{ 
                  padding: "10px", 
                  background: "white", 
                  marginBottom: "8px", 
                  borderRadius: "4px",
                  border: "1px solid #FFD54F",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <strong>{payment.studentName}</strong> ({payment.admissionNumber}) - 
                    Paid: ₹{parseFloat(payment.paidAmount || 0).toFixed(2)} / 
                    Total: ₹{parseFloat(payment.totalAmount || 0).toFixed(2)} - 
                    Balance: <span style={{color: "#F57C00", fontWeight: "bold"}}>₹{parseFloat(payment.balanceAmount || 0).toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => {
                      const paymentIndex = payments.findIndex(p => p._id === payment._id);
                      if (paymentIndex !== -1) addInstallment(paymentIndex);
                    }}
                    style={{
                      background: "#FF9800",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Add Payment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Show button to display reminders if they are hidden */}
      {(overdueReminders.length > 0 || dueTodayReminders.length > 0 || partialReminders.length > 0) && !showReminders && (
        <div style={{ marginBottom: "30px" }}>
          <button 
            onClick={() => setShowReminders(true)}
            style={{
              background: "#F44336",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 4px 4px rgba(244,67,54,0.3)"
            }}
          >
            <span>⏰</span>
            <span>Show Payment Reminders ({overdueReminders.length + dueTodayReminders.length + partialReminders.length})</span>
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div style={{ 
          padding: "10px", 
          background: "#FFEBEE", 
          color: "#F44336",
          marginBottom: "20px",
          borderRadius: "4px",
          border: "1px solid #F44336"
        }}>
          {error}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2000
        }}>
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
          }}>
            Processing, please wait...
          </div>
        </div>
      )}

      {/* Add New Payment Button */}
      <button
        onClick={() => openModal()}
        style={{
          padding: "8px 16px",
          background: "#2196F3",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginBottom: "20px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
        disabled={isLoading}
      >
        <span>+</span>
        <span>Add New Fee Payment</span>
      </button>

      {/* Month/Year Filter */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "15px", alignItems: "center" }}>
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Filter by Month</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
          >
            {monthOptions.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Filter by Year</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
          >
            {yearOptions.map(year => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: "25px" }}>
          <button
            onClick={() => {
              setFilterMonth(new Date().getMonth() + 1);
              setFilterYear(new Date().getFullYear());
            }}
            style={{
              background: "#9E9E9E",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
        <div style={{
          flex: 1,
          background: "#E3F2FD",
          padding: "15px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ marginTop: 0, color: "#0D47A1" }}>Total Fees</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#0D47A1" }}>
            ₹{summaryTotals.total.toFixed(2)}
          </p>
        </div>
        <div style={{
          flex: 1,
          background: "#E8F5E9",
          padding: "15px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ marginTop: 0, color: "#2E7D32" }}>Total Paid</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#2E7D32" }}>
            ₹{summaryTotals.paid.toFixed(2)}
          </p>
        </div>
        <div style={{
          flex: 1,
          background: "#FFEBEE",
          padding: "15px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ marginTop: 0, color: "#C62828" }}>Total Balance</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#C62828" }}>
            ₹{summaryTotals.balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Payments Table */}
      <div style={{ overflowX: "auto", marginBottom: "40px" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "10px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Student</th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Admission #</th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "right" }}>Total (₹)</th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "right" }}>Paid (₹)</th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "right" }}>Balance (₹)</th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Fee Type</th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Payment Type</th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>UPI Number</th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Date</th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Due Date</th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Status</th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="12" style={{ textAlign: "center", padding: "20px" }}>
                  {isLoading ? "Loading payments..." : "No payment records found for selected month/year"}
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment, index) => {
                const isOverdue = overdueReminders.some(p => p._id === payment._id);
                const isDueToday = dueTodayReminders.some(p => p._id === payment._id);
                const isPartial = partialReminders.some(p => p._id === payment._id);
                
                return (
                  <tr key={payment._id || index} style={{ 
                    background: payment.status === "paid" ? "#F5FFF5" : 
                               isOverdue ? "#FFF3E0" : 
                               isDueToday ? "#FFF8E1" : "white",
                    borderBottom: "1px solid #ddd"
                  }}>
                    <td style={{ border: "1px solid #ddd", padding: "10px" }}>{payment.studentName}</td>
                    <td style={{ border: "1px solid #ddd", padding: "10px" }}>{payment.admissionNumber}</td>
                    <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>
                      {parseFloat(payment.totalAmount || 0).toFixed(2)}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>
                      {parseFloat(payment.paidAmount || 0).toFixed(2)}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>
                      {parseFloat(payment.balanceAmount || 0).toFixed(2)}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "10px" }}>{payment.feeType}</td>
                    <td style={{ border: "1px solid #ddd", padding: "10px" }}>{payment.paymentType}</td>
                    <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                      {payment.paymentType === "UPI" ? (payment.upiNumber || "No UPI") : "N/A"}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                      {formatDateForDisplay(payment.date)}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                      {formatDateForDisplay(payment.dueDate)}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                      {getStatusBadge(payment.status)}
                      {isOverdue && " ⚠️"}
                      {isDueToday && " 🔔"}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "10px", whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => {
                          const originalIndex = payments.findIndex(p => p._id === payment._id);
                          if (originalIndex !== -1) openModal(originalIndex);
                        }}
                        style={{
                          background: "#2196F3",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          marginRight: "5px",
                          cursor: "pointer",
                          borderRadius: "4px",
                          fontSize: "12px"
                        }}
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          const originalIndex = payments.findIndex(p => p._id === payment._id);
                          if (originalIndex !== -1) handleView(originalIndex);
                        }}
                        style={{
                          background: "#673AB7",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          marginRight: "5px",
                          cursor: "pointer",
                          borderRadius: "4px",
                          fontSize: "12px"
                        }}
                        disabled={isLoading}
                      >
                        View
                      </button>
                      {payment.status !== "paid" && (
                        <button
                          onClick={() => {
                            const originalIndex = payments.findIndex(p => p._id === payment._id);
                            if (originalIndex !== -1) addInstallment(originalIndex);
                          }}
                          style={{
                            background: "#4CAF50",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
                            marginRight: "5px",
                            cursor: "pointer",
                            borderRadius: "4px",
                            fontSize: "12px"
                          }}
                          disabled={isLoading}
                        >
                          Add Payment
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(index)}
                        style={{
                          background: "#F44336",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          cursor: "pointer",
                          borderRadius: "4px",
                          fontSize: "12px"
                        }}
                        disabled={isLoading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: "#fff",
              padding: "25px",
              borderRadius: "8px",
              width: "500px",
              maxWidth: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>
              {editIndex !== null ? payments[editIndex]?.status === "partial" ? 
                "Add Installment Payment" : "Edit Payment" : "Add New Payment"}
            </h3>
            
            {/* Student Name Field */}
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Student Name*</label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                required
                disabled={isLoading || (editIndex !== null && payments[editIndex]?.status === "partial") || studentId}
              />
            </div>
            {/* Admission Number Field */}
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Admission Number*</label>
              <input
                type="text"
                name="admissionNumber"
                value={formData.admissionNumber}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                required
                disabled={isLoading || (editIndex !== null && payments[editIndex]?.status === "partial") || studentId}
              />
            </div>
            
            <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Fee Type</label>
                <select
                  name="feeType"
                  value={formData.feeType}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                  disabled={isLoading}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One Time</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Payment Type</label>
                <select
                  name="paymentType"
                  value={formData.paymentType}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                  disabled={isLoading}
                >
                  <option value="">Select Type</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Online Banking">Online Banking</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
            </div>

            {/* UPI Number Field (only shown when payment type is UPI) */}
            {formData.paymentType === "UPI" && (
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>UPI Number*</label>
                <select
                  name="upiNumber"
                  value={formData.upiNumber}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                  disabled={isLoading}
                >
                  <option value="">Select UPI ID</option>
                  {upiOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: "12px", marginTop: "5px", color: "#666" }}>
                  Selected: {formData.upiNumber || "None"}
                </div>
              </div>
            )}
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Total Amount (₹)*</label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                disabled={(editIndex !== null && payments[editIndex]?.status === "partial") || isLoading}
                required
                min="0"
                step="0.01"
              />
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Amount Paid (₹)</label>
              <input
                type="number"
                name="paidAmount"
                value={formData.paidAmount}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                disabled={isLoading}
                min="0"
                step="0.01"
              />
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Balance Amount (₹)</label>
              <input
                type="number"
                name="balanceAmount"
                value={formData.balanceAmount || "0"}
                readOnly
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", background: "#f5f5f5" }}
              />
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Date*</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                required
                disabled={isLoading}
              />
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Due Date*</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                required
                disabled={isLoading}
              />
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", minHeight: "60px" }}
                disabled={isLoading}
              />
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={closeModal}
                style={{
                  background: "#f5f5f5",
                  border: "1px solid #ddd",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  background: "#4CAF50",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : (
                  editIndex !== null && payments[editIndex]?.status === "partial" ? 
                  "Add Payment" : "Save Payment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Payment Modal */}
      {viewingPayment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}
          onClick={handleCloseView}
        >
          <div
            style={{
              background: "#fff",
              padding: "25px",
              borderRadius: "8px",
              width: "600px",
              maxWidth: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, textAlign: "center" }}>Fee Payment Details</h3>
            
            <div id="payment-details-content">
              <div style={{ marginBottom: "15px", padding: "15px", background: "#f9f9f9", borderRadius: "4px" }}>
                <h4 style={{ marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "8px" }}>Student Information</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <strong>Student Name:</strong> {viewingPayment.studentName}
                  </div>
                  <div>
                    <strong>Admission Number:</strong> {viewingPayment.admissionNumber}
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: "15px", padding: "15px", background: "#f9f9f9", borderRadius: "4px" }}>
                <h4 style={{ marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "8px" }}>Payment Details</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <strong>Total Amount:</strong> ₹{parseFloat(viewingPayment.totalAmount || 0).toFixed(2)}
                  </div>
                  <div>
                    <strong>Paid Amount:</strong> ₹{parseFloat(viewingPayment.paidAmount || 0).toFixed(2)}
                  </div>
                  <div>
                    <strong>Balance Amount:</strong> ₹{parseFloat(viewingPayment.balanceAmount || 0).toFixed(2)}
                  </div>
                  <div>
                    <strong>Fee Type:</strong> {viewingPayment.feeType}
                  </div>
                  <div>
                    <strong>Payment Type:</strong> {viewingPayment.paymentType}
                  </div>
                  {viewingPayment.paymentType === "UPI" && (
                    <div>
                      <strong>UPI Number:</strong> {viewingPayment.upiNumber || "N/A"}
                    </div>
                  )}
                  <div>
                    <strong>Date:</strong> {formatDateForDisplay(viewingPayment.date)}
                  </div>
                  <div>
                    <strong>Due Date:</strong> {formatDateForDisplay(viewingPayment.dueDate)}
                  </div>
                  <div>
                    <strong>Status:</strong> {getStatusBadge(viewingPayment.status)}
                  </div>
                </div>
              </div>
              {viewingPayment.remarks && (
                <div style={{ marginBottom: "15px", padding: "15px", background: "#f9f9f9", borderRadius: "4px" }}>
                  <h4 style={{ marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "8px" }}>Remarks</h4>
                  <p>{viewingPayment.remarks}</p>
                </div>
              )}
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
              <div>
                <button
                  onClick={handleDownload}
                  style={{
                    background: "#2196F3",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginRight: "10px"
                  }}
                >
                  Download
                </button>
                <button
                  onClick={handlePrint}
                  style={{
                    background: "#607D8B",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Print
                </button>
              </div>
              <button
                onClick={handleCloseView}
                style={{
                    background: "#f5f5f5",
                    border: "1px solid #ddd",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    cursor: "pointer"
                }}
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

export default FeePayment;
              