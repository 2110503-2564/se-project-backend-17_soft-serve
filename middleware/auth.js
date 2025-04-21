const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req,res,next) => {
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if(!token || token === 'null'){
        return res.status(401).json({success : false, message: 'Not authorize to access this route'});
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);

        req.user = await User.findById(decoded.id);

        next();
    } catch(err) {
        console.log(err.stack);
        return res.status(401).json({success : false, message: 'Not authorize to access this route'});
    }
};

exports.protect_review = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // If no token, just set req.user to null and move on
    if (!token || token === 'null') {
        req.user = null;
        return next();
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);

        req.user = await User.findById(decoded.id);
    } catch (err) {
        console.log(err.stack);
        req.user = null;
    }

    next();
};


// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req,res,next) => {
        if(!roles.includes(req.user.role)){
            return res.status(403).json({success : false, message: `User role ${req.user.role} is not authorized to access this route`});
        }
        next();
    };
};