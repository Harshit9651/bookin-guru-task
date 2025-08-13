const router = require('express').Router();
const CitiesController = require('../controllers/citiesController');


router.get('/', CitiesController.getCities);

module.exports = router;
