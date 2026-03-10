/**
 * Script chèn dữ liệu xe mẫu vào MongoDB.
 * Chạy: node scripts/seedCars.js
 * (trong thư mục carRental)
 */
const mongoose = require('mongoose');
const Car = require('../models/carModel');

const MONGO_URL = 'mongodb://127.0.0.1:27017/carRental';

const sampleCars = [
  { carNumber: '51A-12345', capacity: 4, status: 'available', pricePerDay: 500000, features: ['Điều hòa', 'Bluetooth'] },
  { carNumber: '30B-67890', capacity: 7, status: 'available', pricePerDay: 800000, features: ['Điều hòa', 'Camera lùi', 'Cửa trượt'] },
  { carNumber: '59C-11111', capacity: 5, status: 'rented', pricePerDay: 600000, features: ['Điều hòa', 'GPS'] },
  { carNumber: '43D-22222', capacity: 4, status: 'maintenance', pricePerDay: 450000, features: ['Điều hòa'] },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Đã kết nối MongoDB.');

    const existing = await Car.countDocuments();
    if (existing > 0) {
      console.log('Đã có', existing, 'xe trong DB. Bỏ qua seed (không ghi đè).');
      await mongoose.disconnect();
      process.exit(0);
      return;
    }

    await Car.insertMany(sampleCars);
    console.log('Đã chèn', sampleCars.length, 'xe mẫu.');
    await mongoose.disconnect();
    console.log('Xong. Hãy tải lại trang /cars.');
    process.exit(0);
  } catch (err) {
    console.error('Lỗi:', err.message);
    process.exit(1);
  }
}

seed();
