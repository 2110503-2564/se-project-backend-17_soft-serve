const User = require('../models/User');
const { logAdminAction, deleteRestaurant } = require('./restaurants'); 
// @desc    Register User
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        let { name, tel, email, password, role, verified, restaurant } = req.body;
        
        // Ensure role is provided for restaurantManager registration
        if (!role && req.path.includes('restaurantManager')) {
            role = 'restaurantManager';
        }

        if (role === 'restaurantManager') {
            verified = verified !== undefined ? verified : false;
        } else {
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
        console.error('Registration error:', err);
        let message = 'Invalid user data';
        if (err.name === 'ValidationError') {
            // Handle Mongoose validation errors
            message = Object.values(err.errors).map(val => val.message).join(', ');
        } else if (err.code === 11000) {
            message = 'Email already exists';
        }
        res.status(400).json({ success: false, msg: message });
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

// @desc    Update current logged in user
// @route   PATCH /api/v1/auth/updateuser
// @access  Private
exports.updateMe = async (req, res, next) => {
    try {
        const fieldsToUpdate = {};

        // Select fields that are allowed to be updated
        if (req.body.name) fieldsToUpdate.name = req.body.name;
        if (req.body.tel) fieldsToUpdate.tel = req.body.tel;
        // Do not allow updating email, password, or role here

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
};

// @desc    Change user password
// @route   PATCH /api/v1/auth/changepassword
// @access  Private
exports.changePassword = async (req, res, next) => {
    return res.status(403).json({ success: false, msg: 'Feature not yet implemented' });

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, msg: 'Please provide current and new password' });
    }

    try {
        const user = await User.findById(req.user.id).select('+password');

        // Check if the current password is correct
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, msg: 'Current password is incorrect' });
        }

        // Update the password and save
        user.password = newPassword;
        await user.save(); // Use save() to trigger the pre 'save' hook (hash password)

        res.status(200).json({ success: true, msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
};

// @desc    Verify or reject a user
// @route   POST /api/v1/auth/verifyuser
// @access  Private (Admin only)
exports.verifyUser = async (req, res, next) => {
    return res.status(403).json({ success: false, msg: 'Feature not yet implemented' });

    const { userId, isApprove } = req.body;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        if (user.role !== 'restaurantManager') {
            return res.status(400).json({ success: false, msg: 'User is not a restaurant manager' });
        }

        if (user.verified === true) {
            return res.status(400).json({ success: false, msg: 'User already verified' });
        }

        if (isApprove === true) {
            user.verified = true;
            await user.save();

            await logAdminAction(req.user.id, 'Verify', 'User', userId);
            return res.status(200).json({ success: true, msg: 'User verified successfully' });
        } else {
            const restaurantId = user.restaurant;

            await logAdminAction(req.user.id, 'Reject', 'User', userId);

            // Delete user
            await User.deleteOne({ _id: userId });

            // Delete restaurant
            if (restaurantId) {
                await deleteRestaurant(restaurantId);
            }

            return res.status(200).json({ success: true, msg: 'User and associated restaurant deleted' });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
};
