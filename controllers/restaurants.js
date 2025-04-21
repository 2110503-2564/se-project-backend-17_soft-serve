const Restaurant = require('../models/Restaurant');
const Reservation = require('../models/Reservation');
const Notification = require('../models/Notification');
const AdminLog = require('../models/AdminLog');
const Review = require('../models/Review');
const User = require('../models/User');
const { ObjectId } = require('mongoose').Types;

const logAdminAction = async (adminId, action, resource, resourceId) => {
    try {
      await AdminLog.create({
        adminId,
        action,
        resource,
        resourceId,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('Failed to log admin action:', err);
    }
  };

  exports.logAdminAction = logAdminAction

// @desc    Get all restaurants
// @route   GET /api/v1/restaurants
// @access  Public
exports.getRestaurants = async (req, res, next) => {
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
    query = Restaurant.find(JSON.parse(queryStr));

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
    const total = await Restaurant.countDocuments();

    query = query.skip(startIndex).limit(limit);

    try {
        const restaurants = await query;

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
            count: restaurants.length,
            pagination,
            data: restaurants
        });
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get single restaurant
// @route   GET /api/v1/restaurants/:id
// @access  Public
exports.getRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found with the provided ID' });
        }

        if (!restaurant.verified) {
            return res.status(403).json({ success: false, message: 'Restaurant not verified' });
        }

        res.status(200).json({ success: true, data: restaurant });
    } catch (err) {
        console.error(err.stack);
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    CREATE a restaurant
// @route   POST /api/v1/restaurants
// @access  Private
exports.createRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.create(req.body);

        if (req.user.role === 'admin') {
            await logAdminAction(req.user.id, 'Create', 'Restaurant', restaurant._id);
          }

        res.status(201).json({
            success: true,
            data: restaurant
        });
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update single restaurant
// @route   PUT /api/v1/restaurants/:id
// @access  Private
exports.updateRestaurant = async (req, res, next) => {
    try {
        const existing = await Restaurant.findById(req.params.id);
        if (!existing || !existing.verified) {
            return res.status(403).json({ success: false, message: 'Restaurant not found or not verified' });
        }

        if (req.user.role === 'restaurantManager') {
            const userRestaurantId = req.user.restaurant?.toString();
            if (userRestaurantId !== req.params.id) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to update this restaurant'
                });
            }

            if(!req.user.verified){
                return res.status(403).json({
                    success: false,
                    message: 'Restaurant manager not verified'
                });
            }
        }

        // Exclude the 'verified' field from being updated
        const updateData = { ...req.body };
        delete updateData.verified;

        const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        if (!restaurant) {
            return res.status(400).json({ success: false });
        }

        if (req.user.role === 'admin') {
            await logAdminAction(req.user.id, 'Update', 'Restaurant', req.params.id);
        }

        res.status(200).json({ success: true, data: restaurant });
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete single restaurant
// @route   DELETE /api/v1/restaurants/:id
// @access  Private
exports.deleteRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: `Restaurant not found with id of ${req.params.id}`
            });
        }

        if (req.user.role === 'admin') {
            await logAdminAction(req.user.id, 'Delete', 'Restaurant', req.params.id);
        }

        // Find all reservations for this restaurant and populate the user field
        const reservations = await Reservation.find({ restaurant: req.params.id }).populate('user', 'name');
        const reservationIds = reservations.map(reservation => reservation._id);

        // Create notifications for users with reservations
        if (reservations.length > 0) {
            const notifications = reservations.map(reservation => ({
                title: 'Restaurant Reservation Cancelled',
                message: `Your reservation at ${restaurant.name} has been cancelled because the restaurant has been removed from our platform.`,
                createdBy: 'system',
                targetAudience: reservation.user._id, // Send to specific user
                createdAt: new Date()
            }));

            // Create all notifications
            await Notification.insertMany(notifications);
        }

        // Continue with existing cascading delete logic
        await Notification.deleteMany({ targetAudience: { $in: reservationIds } });
        await Reservation.deleteMany({ restaurant: req.params.id });
        await Review.deleteMany({ restaurantId: req.params.id });
        await Notification.deleteMany({ creatorId: req.params.id });
        await User.deleteOne({ restaurant: req.params.id });
        await Restaurant.deleteOne({ _id: req.params.id });

        res.status(200).json({ 
            success: true, 
            data: {},
            message: reservations.length > 0 ? 
                `Restaurant deleted successfully. ${reservations.length} users notified of their cancelled reservations.` : 
                'Restaurant deleted successfully.'
        });
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get available reservation slots for a restaurant on a specific date
// @route   GET /api/v1/restaurants/:restaurantId/availability
// @access  Public
exports.getAvailability = async (req, res, next) => {
    try {
        const restaurantId = req.params.restaurantId;
        const dateStr = req.query.date;

        if (!dateStr) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a reservation date in the query (e.g., ?date=2025-04-20)'
            });
        }

        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        const revDate = new Date(dateStr);
        const reservedCount = await getReservedPeopleCount(restaurantId, revDate);
        const remainingSlots = restaurant.maxReservation - reservedCount;
        
        res.status(200).json({
            success: true,
            data: {
                restaurantId: restaurantId,
                date: dateStr,
                maxReservation: restaurant.maxReservation,
                reserved: reservedCount,
                available: remainingSlots > 0 ? remainingSlots : 0
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch availability',
            error: err.message
        });
    }
};

// Function to get the total number of people reserved for a specific restaurant on a specific date
const getReservedPeopleCount = async (restaurantId, revDate) => {
    const startOfDay = new Date(revDate);
    startOfDay.setHours(0, 0, 0, 0); // Normalize time to start of the day

    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999); // End of the day

    const objectIdRestaurantId = new ObjectId(restaurantId);

    // Calculate the total number of people reserved for the given date
    const totalPeopleReserved = await Reservation.aggregate([
        {
            $match: {
                restaurant: objectIdRestaurantId,
                revDate: { $gte: startOfDay, $lt: endOfDay }
            }
        },
        {
            $group: {
                _id: null,
                totalPeople: { $sum: "$numberOfPeople" }
            }
        }
    ]);

    return totalPeopleReserved.length > 0 ? totalPeopleReserved[0].totalPeople : 0;
};

exports.createRestaurantForRestaurantManager = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.create(req.body);

        res.status(201).json({
            success: true,
            data: restaurant
        });
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};
exports.deleteRestaurantOnUserFailure = async (restaurantId) => {
    try {
      // Find and delete the restaurant
      const restaurant = await Restaurant.findById(restaurantId);
  
      if (!restaurant) {
        console.error(`Restaurant not found with id: ${restaurantId} for system cleanup`);
        return { success: false, message: 'Restaurant not found for cleanup' };
      }
  
      // Log this system action
      console.log(`System deleting restaurant ${restaurantId} due to user creation failure`);
      
      // Remove any associated reservations
      await Reservation.deleteMany({ restaurant: restaurantId });
      
      // Delete the restaurant
      await Restaurant.deleteOne({ _id: restaurantId });
      
      return { success: true, message: 'Restaurant successfully deleted during rollback' };
    } catch (err) {
      console.error('Error in deleteRestaurantOnUserFailure:', err);
      return { success: false, message: err.message };
    }
  };