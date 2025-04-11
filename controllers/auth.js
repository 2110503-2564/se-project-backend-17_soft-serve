const User = require('../models/User');
const { logAdminAction } = require('./restaurants'); 
// @desc    Register User
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        let { name, tel, email, password, role, verified, restaurant } = req.body;
        // Only allow verified and restaurant if role is restaurantManager
        if (role !== 'restaurantManager') {
            verified = undefined;
            restaurant = undefined;
        }
        const user = await User.create({
            name,
            tel,
            email,
            password,
            role,
            verified,
            restaurant
        });


        sendTokenResponse(user, 200, res);
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ success: false, msg: err.message});
    }
};

// @desc    Login User
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
        return res.status(400).json({ success: false, msg: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return res.status(400).json({ success: false, msg: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return res.status(400).json({ success: false, msg: 'Invalid credentials' });
    }

    if (user.role == "restaurantManager"){
        if(!user.verified)
            return res.status(400).json({ success: false, msg: 'not verified' });
    }

    // Create token
    sendTokenResponse(user, 200, res);
};

const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();
    
    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000), // Set to milliseconds
        httpOnly: true
    };
    
    if (process.env.NODE_ENV == 'production') {
        options.secure = true;
    }
    
    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token
    });
};

// @desc    Log user out / clear cookie
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = async (req,res,next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10*1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        msg: 'Logged out successfully'
    });
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
};


// @desc    Delete single user
// @route   DEL /api/v1/auth/deluser/:id
// @access  Private
exports.deleteUser = async (req, res, next) => {
    try {
        const targetUser = await User.findById(req.params.id);
        console.log('User Role:', req.user?.role);

        if (!targetUser) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({
              success: false,
              msg: 'Only admins can delete user'
            });
        }

        if (req.user.id === targetUser.id ) {
            return res.status(400).json({
              success: false,
              msg: 'Cannot delete yourself'
            });
        }

        if (req.user.role === 'admin'){
            
            await  logAdminAction(req.user.id , 'Delete' , 'User' , req.params.id);
        }

        //รอใส่ cascading delete
         await User.deleteOne({ _id: req.params.id });

        res.status(200).json({ success: true, data: 'User delete' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
};