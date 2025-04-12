const Notification = require('../models/Notification');

// @desc    Create a notification
// @route   POST /api/v1/notifications
// @access  Private
exports.createNotification = async (req, res, next) => {
    const { title, message, targetAudience } = req.body;

    if(req.user.role == 'admin'){
        if (!targetAudience) {
            return res.status(400).json({
                success: false,
                error: 'targetAudience is required for admin'
            });
        }
    }else if(req.user.role == 'restaurantManger'){
        targetAudience = 'Customers';
    }else{
        return res.status(400).json({
            success: false,
            error: 'Invalid user role'
        });
    }

    try {
        const notification = await Notification.create({
            title,
            message,
            creatorId: req.user._id, 
            createdBy: req.user.role,
            targetAudience,
            createdAt: Date.now()
        });

        res.status(201).json({
            success: true,
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get all notifications
// @route   GET /api/v1/notifications
// @access  Public
exports.getNotifications = async (req, res, next) => {
    let query;

    if(req.user.role == 'admin'){
        // Admin can see all notifications
        query = Notification.find({});
    }else if(req.user.role == 'restaurantManger'){
        // Restaurant manager can see notifications related to their restaurant
        query = Notification.find({ creatorId: req.user._id });
    }else{
        // User can see their own notifications
        query = Notification.find({ targetAudience: 'Customers' }); // Not finished
    }

    try {
        const notifications = await query.sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}