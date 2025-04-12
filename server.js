const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require("cookie-parser")
const connectDB = require('./config/db')
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const {xss} = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

// Load ENV vars
dotenv.config({path:'./config/config.env'});

// Connect to database
connectDB();

// Route files
const restaurants = require('./routes/restaurants');
const auth = require('./routes/auth');
const reservations = require('./routes/reservations');
const notifications = require('./routes/notifications');

const app = express();

// Body Parser
app.use(express.json());

// Cookie Parser
app.use(cookieParser());

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate Limiting
const limiter = rateLimit({
    windowsMs : 10*60*1000, //10 mins
    max : 100
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors());

// Swagger
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Library API',
            version: '1.0.0',
            description: 'SoftServe Library API',
        },
        servers: [
            {
                url: process.env.HOST + ':' + process.env.PORT + '/api/v1'
            }
        ],
    },
    apis: ['./routes/*.js']
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Mount routers
app.use('/api/v1/restaurants', restaurants);
app.use('/api/v1/auth', auth);
app.use('/api/v1/reservations', reservations);
app.use('/api/v1/notifications', notifications);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => 
    console.log('Server running in', process.env.NODE_ENV, ' mode on port ', process.env.HOST+':'+ PORT));

// Handle unhandle promise rejections
process.on('unhandledRejection', (err,promise) => {
    console.log(`Error: ${err.message}`);
    // Close Sever & Exit Process
    server.close(() => process.exit(1));
});