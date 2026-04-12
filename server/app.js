const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const phoneRoutes = require('./modules/phone/phone.routes');

const authRoutes = require('./routes/authRoutes');
const symptomRoutes = require('./routes/symptomRoutes');
const adminRoutes = require('./routes/adminRoutes');
const clinicalRoutes = require('./routes/clinicalRoutes');
const patientProfileRoutes = require('./routes/patientProfileRoutes');
const env = require('./config/env');

const app = express();
const allowedOrigins = Array.isArray(env.corsOrigin) ? env.corsOrigin : [env.corsOrigin];

const storage = multer.memoryStorage();

const createUpload = ({ maxFileSize, isAllowed, errorMessage }) =>
  multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (req, file, cb) => {
      if (isAllowed(file)) {
        cb(null, true);
      } else {
        cb(new Error(errorMessage));
      }
    },
  });

const imageUpload = createUpload({
  maxFileSize: 10 * 1024 * 1024,
  isAllowed: (file) => file.mimetype.startsWith('image/'),
  errorMessage: 'Only image files are allowed',
});

const supportedDocumentMimeTypes = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/xml',
  'text/xml',
]);

const aiUpload = createUpload({
  maxFileSize: 20 * 1024 * 1024,
  isAllowed: (file) =>
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    supportedDocumentMimeTypes.has(file.mimetype),
  errorMessage:
    'Supported MediGuide AI attachments are images, videos, PDFs, and text-based documents.',
});

app.locals.upload = imageUpload;
app.locals.aiUpload = aiUpload;

// Security and utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin/server-to-server requests that don't send an Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Verification-Token'],
    credentials: true,
  })
);
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
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'MediGuide API',
    status: 'ok',
    health: '/api/v1/health',
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/symptoms', symptomRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/clinical', clinicalRoutes);
app.use('/api/v1/patient-profile', patientProfileRoutes);
app.use('/api/v1/phone', phoneRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'API is running' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
