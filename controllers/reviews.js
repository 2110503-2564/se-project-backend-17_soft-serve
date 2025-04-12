const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');

// Optional: Log admin actions (not used yet but could be useful)
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

// @desc    Get all reviews (or by restaurantId)
// @route   GET /api/v1/reviews OR /api/v1/restaurants/:restaurantId/reviews
// @access  Public for admin, private for users (shows only their reviews)
exports.getReviews = async (req, res, next) => {
    let query;

    // If not admin, return only reviews created by the current user
    if (req.user.role !== 'admin') {
        query = Review.find({ customerId: req.user.id }).populate({
            path: 'restaurantId',
            select: 'name province tel imgPath' // restaurant preview info
        });
    } else {
        // If admin and restaurantId is passed in URL, filter reviews by that restaurant
        if (req.params.restaurantId) {
            console.log('Fetching reviews for restaurant:', req.params.restaurantId);
            query = Review.find({ restaurantId: req.params.restaurantId }).populate({
                path: "restaurantId",
                select: 'name province tel imgPath',
            });
        } else {
            // Otherwise get all reviews
            query = Review.find().populate({
                path: 'restaurantId',
                select: 'name province tel imgPath'
            });
        }
    }

    try {
        const reviews = await query;

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Cannot find reviews" });
    }
};

// @desc    Create a new review for a restaurant
// @route   POST /api/v1/restaurants/:restaurantId/reviews
// @access  Private (user or admin)
exports.addReview = async (req, res, next) => {
    console.log('addReview controller is called');

    try {
        // Check if the restaurant exists
        const restaurant = await Restaurant.findById(req.params.restaurantId);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: `No restaurant found with ID ${req.params.restaurantId}`
            });
        }

        // Create the review document
        const review = new Review({
            rating: req.body.rating,          // rating: 1-5 stars
            review: req.body.review,          // the review text/comment
            customerId: req.user,             // who is writing the review
            restaurantId: req.params.restaurantId // which restaurant this is for
        });

        const savedReview = await review.save();

        res.status(201).json({
            success: true,
            data: savedReview
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Error creating review"
        });
    }
};

// @desc    Delete a review by ID
// @route   DELETE /api/v1/reviews/:id
// @access  Private (review owner or admin)
exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: `No review found with ID ${req.params.id}`
            });
        }

        // Only allow the user who wrote the review OR an admin to delete it
        if (review.customerId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this review`
            });
        }

        await review.deleteOne();

        res.status(200).json({
            success: true,
            data: {} // return empty data to confirm deletion
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Cannot delete review" });
    }
};
