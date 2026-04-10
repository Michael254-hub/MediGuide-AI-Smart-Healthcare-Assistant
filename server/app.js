const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes');
const symptomRoutes = require('./routes/symptomRoutes');
const adminRoutes = require('./routes/adminRoutes');
const clinicalRoutes = require('./routes/clinicalRoutes');
const env = require('./config/env');

const app = express();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});
app.locals.upload = upload;

// Security and utility middlewares
app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/symptoms', symptomRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/clinical', clinicalRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'API is running' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
