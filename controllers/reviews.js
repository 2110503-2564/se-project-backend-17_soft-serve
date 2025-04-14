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
  
      const { role, id: userId, restaurant: managerRestaurant } = req.user;
      const paramRestaurantId = req.params.restaurantId;
  
      if (role === 'admin') {
        // Admin: all reviews, or filter by restaurantId if provided
        query = paramRestaurantId
          ? Review.find({ restaurantId: paramRestaurantId })
          : Review.find();
      } else if (role === 'restaurantManager') {
        // Restaurant Manager: only for their restaurant
        if (!managerRestaurant) {
          return res.status(403).json({
            success: false,
            message: 'No restaurant assigned to this manager.'
          });
        }
  
        // Handle both Object and ID
        const restaurantId = typeof managerRestaurant === 'object'
          ? managerRestaurant._id
          : managerRestaurant;
  
        query = Review.find({ restaurantId });
      } else if (role === 'user') {
        // User: can see their own OR reviews by restaurantId (from params)
        if (paramRestaurantId) {
          query = Review.find({ restaurantId: paramRestaurantId });
        } else {
          query = Review.find({ customerId: userId });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized role.'
        });
      }
  
      // Add restaurant preview info
      query = query.populate({
        path: 'restaurantId',
        select: 'name province tel imgPath'
      }).populate({
        path: 'customerId',
        select: 'name'
      });
  
      const reviews = await query;
  
      res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Cannot find reviews"
      });
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
        
        if (!restaurant.verified) {
            return res.status(400).json({
              success: false,
              message: 'Cannot add a review to an unverified restaurant.'
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
  
      await review.deleteOne();
  
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
  