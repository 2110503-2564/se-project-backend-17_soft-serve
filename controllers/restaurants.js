const Restaurant = require('../models/Restaurant');
const Reservation = require('../models/Reservation');
const Notification = require('../models/Notification');
const AdminLog = require('../models/AdminLog');
const Review = require('../models/Review');
const User = require('../models/User');
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

    let queryStr = JSON.stringify(req.query);
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
        res.status(400).json({ success: false, msg: err.message });
    }
};

// @desc    Get single restaurant
// @route   GET /api/v1/restaurants/:id
// @access  Public
exports.getRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(400).json({ success: false });
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
        res.status(400).json({ success: false, msg: err.message });
    }
};

// @desc    Update single restaurant
// @route   PUT /api/v1/restaurants/:id
// @access  Private
exports.updateRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
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
        res.status(400).json({ success: false, msg: err.message });
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
                msg: `Restaurant not found with id of ${req.params.id}`
            });
        }

        if (req.user.role === 'admin') {
            await logAdminAction(req.user.id, 'Delete', 'Restaurant', req.params.id);
          }

        // Cascading delete
        await Reservation.deleteMany({ restaurant: req.params.id });
        await Review.deleteMany({restaurantId:req.params.id});
        await Notification.deleteMany({creatorId:req.params.id});
        await User.deleteOne({restaurant:req.params.id});
        await Restaurant.deleteOne({ _id: req.params.id });

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ success: false, msg: err.message });
    }
};
