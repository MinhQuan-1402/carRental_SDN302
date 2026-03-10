const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const { authenticate } = require('../middleware/authMiddleware');

// GET công khai; POST/PUT/DELETE yêu cầu JWT
router.route('/')
    .get(carController.getAllCars)
    .post(authenticate, carController.createCar);

router.route('/:carId')
    .get(carController.getCarById)
    .put(authenticate, carController.updateCar)
    .delete(authenticate, carController.deleteCar);

router.route('/number/:carNumber')
    .get(carController.getCarByNumber);

module.exports = router;
