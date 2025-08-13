const router = require('express').Router();
const citiesRouter = require('./cities');

router.use('/cities', citiesRouter);


module.exports = router;
