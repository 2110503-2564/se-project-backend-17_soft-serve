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
exports.getNotifications = async (req, res, next) => {
    let query;

    if(req.user.role == 'admin'){
        // Admin can see all notifications
        query = Notification.find({});
    }else if(req.user.role == 'restaurantManager'){
        // Restaurant manager can see notifications related to their restaurant
        query = Notification.find({ 
            $or: [
            { creatorId: req.user._id },
            { targetAudience: 'RestaurantManagers' },
            { targetAudience: 'All' }
            ]
        });
    }else{
        // User can see their own notifications
        try{
            const today = new Date();

            const futureReservations = await Reservation.find({
                user : req.user._id,
                revDate :  {$gte:today}
            }).select('restaurant');

            const restaurantIDs = futureReservations.map(r => r.restaurant);

            query = Notification.find({ 
                
                $or:[
                    {
                        targetAudience: 'Customers',
                        creatorId : {$in: restaurantIDs}
                    },
                    {
                        targetAudience : 'All'
                    }
                ]
            });

        }catch(error){
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
        

        

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