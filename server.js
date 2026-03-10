// server.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const carRoutes = require('./routes/carRoutes');

// CORS: cho phép frontend từ origin khác gọi API
app.use(cors({
  origin: true, // phản chiếu request origin (hoặc set ['http://localhost:3000'] nếu cần giới hạn)
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (if needed)
app.use(express.static(path.join(__dirname, 'public')));

// View routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/cars', (req, res) => {
    res.render('cars');
});

app.get('/bookings', (req, res) => {
    res.render('bookings');
});

app.get('/login', (req, res) => {
    res.render('login');
});

// API routes (auth không cần JWT)
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/cars', carRoutes);

// MongoDB: dùng biến môi trường khi deploy, mặc định local
mongoose.set('strictQuery', true);
const MONGO_URL = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/carRental';

async function startServer() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log('MongoDB connected');
        const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
        app.listen(PORT, host, () => {
            console.log(`Server running on http://${host}:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();
