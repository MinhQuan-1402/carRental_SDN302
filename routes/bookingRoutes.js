const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/authMiddleware');

// GET công khai; POST/PUT/DELETE/pickup yêu cầu JWT
router.route('/')
    .get(bookingController.getAllBookings)
    .post(authenticate, bookingController.createBooking);

router.put('/:bookingId/pickup', authenticate, bookingController.pickupBooking);

router.route('/:bookingId')
    .put(authenticate, bookingController.updateBooking)
    .delete(authenticate, bookingController.deleteBooking);

module.exports = router;
