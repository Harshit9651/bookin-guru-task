



require('dotenv').config();
const express = require('express')
const app = express();
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
app.use(express.urlencoded({ extended: true }));


const router = require('./routes');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


const limiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 120, 
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use('/api/v1', router);

app.use((err, req, res, next) => {
  console.error(err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
