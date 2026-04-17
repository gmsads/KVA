import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentForm from './components/StudentForm';
import AllStudents from './components/AllStudents';
import Attendance from "./components/Attendance";
import StudentPerformance from './components/StudentPerformance';
import ManagementDetails from './components/ManagementDetails';
import FeePayment from './components/FeePayment';
import StudentDetails from './components/StudentDetails';
import StudentAnalysis from './components/StudentAnalysis';

import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        {/* Fixed Sidebar */}
        <Sidebar />

        <div className="main-content">
          {/* Header removed - only content area remains */}
          
          {/* Page Content */}
          <div className="content-area">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Navigate to="/" />} />
              <Route path="/student-form" element={<StudentForm />} />
              <Route path="/all-students" element={<AllStudents />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/performance" element={<StudentPerformance />} />
              <Route path="/management" element={<ManagementDetails />} />
              <Route path="/fee-payment/:studentId" element={<FeePayment />} />
              <Route path="/fee-payments" element={<FeePayment />} />
              <Route path="/student-details" element={<StudentDetails />} />
              <Route path="/student-analysis" element={<StudentAnalysis />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;