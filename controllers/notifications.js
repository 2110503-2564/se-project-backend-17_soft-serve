const Notification = require('../models/Notification');
const Reservation = require('../models/Reservation');

// @desc    Create a notification
// @route   POST /api/v1/notifications
// @access  Private
exports.createNotification = async (req, res, next) => {
    let { title, message, targetAudience } = req.body;

    if(req.user.role === 'admin'){
        if (!targetAudience) {
            return res.status(400).json({
                success: false,
                error: 'targetAudience is required for admin'
            });
        }
    } else if(req.user.role === 'restaurantManager'){
        if(!(req.user.verified)){
            return res.status(400).json({
                success: false,
                error: 'Restaurant manager must be verified to create notifications'
            });
        }

        // Restaurant manager can only target customers who have reserved at their restaurant
        targetAudience = 'Customers';
        
        // Check if the restaurant manager has a restaurant assigned
        if(!req.user.restaurant) {
            return res.status(400).json({
                success: false,
                error: 'Restaurant manager must be associated with a restaurant'
            });
        }
        
    } else {
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
// Adds pagination metadata (next/prev) to the response.
exports.getNotifications = async (req, res, next) => {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over remove fields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    // Create operators ($gt,$gte,$lt,$lte)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Notification.find(JSON.parse(queryStr));

    // Select Fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Notification.countDocuments();

    query = query.skip(startIndex).limit(limit);

    try {
        const notifications = await query;

        // Pagination result
        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.status(200).json({
            success: true,
            count: notifications.length,
            pagination,
            data: notifications
        });
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ success: false, msg: err.message });
    }
};
// @desc    Delete single notifications
// @route   DELETE /api/v1/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: `No notification found with ID of ${req.params.id}`
            });
        }

        // Check if the user is authorized to delete the notification
        if (notification.creatorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to delete this notification'
            });
        }

        await notification.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

