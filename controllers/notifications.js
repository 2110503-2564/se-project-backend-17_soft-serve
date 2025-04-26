const Notification = require('../models/Notification');
const Reservation = require('../models/Reservation');
const User = require('../models/User');

const moment = require('moment-timezone');

// @desc    Create a notification
// @route   POST /api/v1/notifications
// @access  Private
exports.createNotification = async (req, res, next) => {
    let { title, message, targetAudience, publishAt } = req.body;

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
        const notificationData = {
            title,
            message,
            creatorId: req.user._id,
            createdBy: req.user.role,
            targetAudience,
            publishAt : moment(publishAt),
            createdAt: Date.now()
        };

        if (req.user.role === 'restaurantManager') {
            notificationData.restaurant = req.user.restaurant;
        }

        const notification = await Notification.create(notificationData);

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

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    try {
        if (req.user.role === 'admin') {
            query = Notification.find({});
        } else if (req.user.role === 'restaurantManager') {
            query = Notification.find({
                $or: [
                    { creatorId: req.user._id },
                    {
                        $or: [
                            { targetAudience: 'RestaurantManagers' },
                            { targetAudience: 'All' }
                        ],
                        publishAt: { $lte: Date.now() }
                    },
                    { // Manager can see notifications sent to their own customers
                        targetAudience: 'Customers',
                        creatorId: req.user._id,
                        publishAt: { $lte: Date.now() }
                    }
                ]
            });
        } else {
            // User role
            const userReservations = await Reservation.find({
                user: req.user._id,
            }).select('_id restaurant revDate');
            
            const latestReservationMap = new Map();
            
            // Get the latest reservation per restaurant
            userReservations.forEach(res => {
                const restaurantId = res.restaurant.toString();
                const existingDate = latestReservationMap.get(restaurantId);
                if (!existingDate || res.revDate > existingDate) {
                    latestReservationMap.set(restaurantId, res.revDate);
                }
            });

            console.log(latestReservationMap);
            
            const restaurantIDs = Array.from(latestReservationMap.keys());
            const reservationIDs = userReservations.map(r => r._id);
            
            // Fetch restaurant managers
            const resManagers = await User.find({
                restaurant: { $in: restaurantIDs }
            });
            
            // Fetch admins
            const admins = await User.find({ role: 'admin' });
            
            // Build notification query conditions
            const now = new Date();
            const conditions = [];
            
            // Manager notifications (must be before latest reservation date)
            resManagers.forEach(manager => {
                const restaurantId = manager.restaurant?.toString();
                const cutoffDate = latestReservationMap.get(restaurantId);
                if (cutoffDate) {
                    conditions.push({
                        targetAudience: 'Customers',
                        creatorId: manager._id,
                        publishAt: { 
                            $lte: new Date(),
                            $lte: new Date(cutoffDate)
                         }
                    });
                }
            });
            
            // Admin/System notifications 
            conditions.push({
                targetAudience: 'Customers',
                createdBy: { $in: ['admin', 'system'] },
                publishAt: { $lte: new Date() }
            });
            
            // 'All' audience (respect publishAt <= now)
            conditions.push({
                targetAudience: 'All',
                publishAt: { $lte: new Date() }
            });
            
            // Specific to reservation ID
            conditions.push({
                targetAudience: { $in: reservationIDs },
                publishAt: { $lte: new Date() }
            });
            const localDate = new Date();
            const pa = new Date("2025-04-25T04:44:00.000Z");

            const utcISOString = localDate.toISOString();

            console.log(utcISOString);

            if(localDate < pa){
                console.log('aaa');
            }
                        
            query = Notification.find({ $or: conditions });
                     
        }

        // Dynamic query filtering
        const reqQuery = { ...req.query };
        const removeFields = ['select', 'sort', 'page', 'limit'];
        removeFields.forEach(param => delete reqQuery[param]);

        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
        query = query.find(JSON.parse(queryStr));

        // Select
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

        const total = await query.clone().countDocuments();
        
        // Populate restaurant details for notifications created by restaurant managers
        // Exclude notifications created by the current user
        query = query
            .populate({
            path: 'restaurant',
            select: 'name tel province imgPath',
            match: { createdBy: 'restaurantManager' }
            })
            //.where('creatorId').ne(req.user._id) // Exclude notifications created by the current user
            .skip(startIndex)
            .limit(limit);

        const notifications = await query;

        // Pagination result
        const pagination = {};
        if (endIndex < total) {
            pagination.next = { page: page + 1, limit };
        }
        if (startIndex > 0) {
            pagination.prev = { page: page - 1, limit };
        }

        // Conditionally exclude notifications created by the current user
        //if (req.user.role !== 'admin') {
        //    query = query.where('creatorId').ne(req.user._id);
        //}

        return res.status(200).json({
            success: true,
            count: notifications.length,
            total,
            pagination,
            data: notifications
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
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
        if ((notification.creatorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') || req.user.role === 'user') {
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
