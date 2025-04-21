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

// @desc    Get all reviews
//          - Admin: Can view all reviews, or reviews for a specific restaurant (if restaurantId is in params)
//          - Restaurant Manager: Can view reviews for their assigned restaurant only
//          - User: Can view their own reviews, or reviews for a specific restaurant (if restaurantId is in params)
// @route   GET /api/v1/reviews
//          GET /api/v1/restaurants/:restaurantId/reviews
// @access  Admin (public), Restaurant Manager & User (private)
exports.getReviews = async (req, res, next) => {
  try {
    let query;

    const paramRestaurantId = req.params.restaurantId;

    let role = '';
    let userId = '';
    let managerRestaurant = '';

    if (req.user) {
      ({ role, id: userId, restaurant: managerRestaurant } = req.user);
    }

    if (role === 'admin') {
      // Admin: all reviews or filter by restaurantId
      query = paramRestaurantId
        ? Review.find({ restaurantId: paramRestaurantId })
        : Review.find();
    } else if (role === 'restaurantManager') {
      // Manager: only their assigned restaurant
      if (!managerRestaurant) {
        return res.status(403).json({
          success: false,
          message: 'No restaurant assigned to this manager.',
        });
      }

      const restaurantId = typeof managerRestaurant === 'object'
        ? managerRestaurant._id
        : managerRestaurant;

      query = Review.find({ restaurantId });
    } else if (role === 'user') {
      // User: their own reviews or by restaurantId
      query = paramRestaurantId
        ? Review.find({ restaurantId: paramRestaurantId })
        : Review.find({ customerId: userId });
    } else {
      // Unauthenticated or unrecognized role
      if (paramRestaurantId) {
        query = Review.find({ restaurantId: paramRestaurantId });
      } else {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized role.',
        });
      }
    }

    // Add restaurant and customer preview info
    query = query
      .populate({
        path: 'restaurantId',
        select: 'name province tel imgPath',
      })
      .populate({
        path: 'customerId',
        select: 'name',
      });

    const reviews = await query;

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Cannot find reviews',
    });
  }
};


// @desc    Create a new review for a restaurant
// @route   POST /api/v1/restaurants/:restaurantId/reviews
// @access  Private (user or admin)
exports.addReview = async (req, res, next) => {
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

        // 3. Update star count
        const rating = req.body.rating; // 1–5
        restaurant.starCount = restaurant.starCount || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        restaurant.starCount[rating] = (restaurant.starCount[rating] || 0) + 1;

        // 4. Update total review count
        restaurant.reviewCount = (restaurant.reviewCount || 0) + 1;

        // 5. Recalculate average rating
        const reviews = await Review.find({ restaurantId: restaurant._id });
        const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
        restaurant.ratingrating = avgRating;

        // 6. Save restaurant
        await restaurant.save();
        
        // Update restaurant rating and review count
        //await Restaurant.updateRatingAndCount(req.params.restaurantId);
        
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
// @access  Private (admin only)
exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: `No review found with ID ${req.params.id}`,
            });
        }

        // Only admin can delete
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this review`,
            });
        }

        // Save the restaurantId to update the rating after deletion
        const restaurantId = review.restaurantId;

        // Delete the review
        await review.deleteOne();

        // Update restaurant's rating and review count
        await Restaurant.updateRatingAndCount(restaurantId);

        res.status(200).json({
            success: true,
            data: {}, // empty response body to confirm deletion
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Cannot delete review',
        });
    }
};



