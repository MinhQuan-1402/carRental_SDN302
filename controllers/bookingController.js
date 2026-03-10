const Booking = require("../models/bookingModel");
const Car = require("../models/carModel");

// Helper function to calculate total amount
function calculateTotalAmount(startDate, endDate, pricePerDay) {
  const timeDifference = endDate - startDate;
  const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
  const numberOfDays = Math.ceil(daysDifference); // Round up to full days
  return numberOfDays * pricePerDay;
}

// Get all bookings (có thể lọc: đã kết thúc quá X giờ)
// Query: ?endedMoreThanHoursAgo=24 → chỉ lấy booking có endDate < (hiện tại - 24 giờ)
exports.getAllBookings = async (req, res) => {
  try {
    const hours = req.query.endedMoreThanHoursAgo;
    let filter = {};

    if (hours !== undefined && hours !== "") {
      const h = parseInt(hours, 10);
      if (!isNaN(h) && h >= 0) {
        const cutoff = new Date(Date.now() - h * 60 * 60 * 1000);
        filter = { endDate: { $lt: cutoff } };
      }
    }

    const bookings = await Booking.find(filter).sort({ endDate: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const { customerName, carNumber, startDate, endDate } = req.body;

    // Validate required fields
    if (!customerName || !carNumber || !startDate || !endDate) {
      return res.status(400).json({
        message:
          "All fields are required (customerName, carNumber, startDate, endDate)",
      });
    }

    // Convert dates to Date objects if they are strings
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date order
    if (start >= end) {
      return res
        .status(400)
        .json({ message: "Start date must be before end date" });
    }

    // Check if car exists and get pricePerDay
    const car = await Car.findOne({ carNumber: carNumber });
    if (!car) {
      return res
        .status(404)
        .json({ message: `Car with number ${carNumber} not found` });
    }

    // Calculate total amount automatically
    const totalAmount = calculateTotalAmount(start, end, car.pricePerDay);

    // Check for overlapping bookings with the same carNumber
    // Overlap occurs when: newStart < existingEnd AND newEnd > existingStart
    const overlappingBooking = await Booking.findOne({
      carNumber: carNumber,
      startDate: { $lt: end }, // Existing booking starts before new booking ends
      endDate: { $gt: start }, // Existing booking ends after new booking starts
    });

    if (overlappingBooking) {
      return res.status(409).json({
        message: `Car ${carNumber} is already booked from ${overlappingBooking.startDate.toISOString()} to ${overlappingBooking.endDate.toISOString()}`,
      });
    }

    // Create and save the new booking
    const booking = new Booking({
      customerName,
      carNumber,
      startDate: start,
      endDate: end,
      totalAmount,
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a booking
exports.updateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { customerName, carNumber, startDate, endDate } = req.body;

    // Check if booking exists
    const existingBooking = await Booking.findById(bookingId);
    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Validate required fields
    if (!customerName || !carNumber || !startDate || !endDate) {
      return res.status(400).json({
        message:
          "All fields are required (customerName, carNumber, startDate, endDate)",
      });
    }

    // Convert dates to Date objects if they are strings
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date order
    if (start >= end) {
      return res
        .status(400)
        .json({ message: "Start date must be before end date" });
    }

    // Check if car exists and get pricePerDay
    const car = await Car.findOne({ carNumber: carNumber });
    if (!car) {
      return res
        .status(404)
        .json({ message: `Car with number ${carNumber} not found` });
    }

    // Calculate total amount automatically
    const totalAmount = calculateTotalAmount(start, end, car.pricePerDay);

    // Check for overlapping bookings with the same carNumber
    // Exclude the current booking being updated
    const overlappingBooking = await Booking.findOne({
      _id: { $ne: bookingId }, // Exclude current booking
      carNumber: carNumber,
      startDate: { $lt: end }, // Existing booking starts before new booking ends
      endDate: { $gt: start }, // Existing booking ends after new booking starts
    });

    if (overlappingBooking) {
      return res.status(409).json({
        message: `Car ${carNumber} is already booked from ${overlappingBooking.startDate.toISOString()} to ${overlappingBooking.endDate.toISOString()}`,
      });
    }

    // Update the booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        customerName,
        carNumber,
        startDate: start,
        endDate: end,
        totalAmount,
      },
      { new: true, runValidators: true },
    );

    res.json(updatedBooking);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid booking ID" });
    }
    res.status(400).json({ message: err.message });
  }
};

// Nhận xe: cập nhật status = đã đón, pickupAt = now. Ngày nhận (now) phải >= startDate.
exports.pickupBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const now = new Date();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const startDate = new Date(booking.startDate);
    if (now < startDate) {
      return res.status(400).json({
        message: `Ngày nhận xe phải lớn hơn hoặc bằng ngày bắt đầu thuê (${startDate.toISOString()}). Hiện tại: ${now.toISOString()}`,
      });
    }

    if (booking.status === "đã đón") {
      return res.status(400).json({
        message: "Đặt xe này đã được đánh dấu đã đón trước đó.",
        pickupAt: booking.pickupAt,
      });
    }

    const updated = await Booking.findByIdAndUpdate(
      bookingId,
      { status: "đã đón", pickupAt: now },
      { new: true, runValidators: true },
    );

    res.json(updated);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid booking ID" });
    }
    res.status(500).json({ message: err.message });
  }
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findByIdAndDelete(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: "Booking deleted successfully", booking });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid booking ID" });
    }
    res.status(500).json({ message: err.message });
  }
};
