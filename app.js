const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// app.enable('trust proxy'); THIS WOULD ONLY BE NEEDED FOR THE HEROKU DEPLOYMENT SOLUTION

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors());
// Access-Control-Allow-Origin *
// api.natours.com, front-end natours.com
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))

app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP
// app.use(helmet());
const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://*.cloudflare.com',
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
];
const connectSrcUrls = ['https://unpkg.com', 'https://tile.openstreetmap.org'];
const fontSrcUrls = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'https:',
  'data:',
];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      // defaultSrc: [],
      defaultSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", 'blob:', ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      // scriptSrc: ["'self'", 'https://*.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      // styleSrc: ["'self'", 'https:', 'unsafe-inline'],
      // workerSrc: ["'self'", 'blob:'],
      workerSrc: ["'self'", 'data:', 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", ...fontSrcUrls],
      // fontSrc: ["'self'", 'https:', 'data:'],
      baseUri: ["'self'"],
      frameSrc: ["'self'", 'https://*.stripe.com'],
      childSrc: ["'self'", 'blob:'],

      // defaultSrc: ["'self'", 'data:', 'blob:'],
      // baseUri: ["'self'"],
      // fontSrc: ["'self'", 'https:', 'data:'],
      // scriptSrc: ["'self'", 'https://*.cloudflare.com'],
      // scriptSrc: ["'self'", 'https://*.stripe.com'],
      // scriptSrc: ["'self'", 'http:', 'https://*.mapbox.com', 'data:'],
      // frameSrc: ["'self'", 'https://*.stripe.com'],
      // objectSrc: ["'none'"],
      // styleSrc: ["'self'", 'https:', 'unsafe-inline'],
      // workerSrc: ["'self'", 'data:', 'blob:'],
      // childSrc: ["'self'", 'blob:'],
      // imgSrc: ["'self'", 'data:', 'blob:'],
      // // connectSrc: ["'self'", 'blob:', 'https://*.mapbox.com'],
      upgradeInsecureRequests: [],
    },
  })
);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);

  next();
});

// 3) ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
