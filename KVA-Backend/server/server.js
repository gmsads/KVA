const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // ✅ ADD THIS
require('dotenv').config();

const staffRoutes = require('../routes/staffRoutes');
const studentRoutes = require('../routes/studentRoutes');
const feePaymentRoutes = require('../routes/feePayments');
const attendanceRoutes = require('../routes/attendance');
const performanceRoutes = require('../routes/performance');

const app = express();

// Verify environment variables
if (!process.env.MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI is not defined in .env file');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');

  const dbUri = process.env.MONGODB_URI;
  const clusterInfo = dbUri.includes('@') 
    ? dbUri.split('@')[1].split('/')[0]
    : 'local database';
  console.log(`🔗 MongoDB cluster: ${clusterInfo}`);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/fee-payments', feePaymentRoutes);
app.use('/api/scholars', require('../routes/scholars'));
app.use('/api/attendance', attendanceRoutes);
app.use('/api/performance', performanceRoutes);

// ✅ 👉 ADD THIS PART (SERVE FRONTEND)
app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Basic route (optional)
app.get('/api', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});