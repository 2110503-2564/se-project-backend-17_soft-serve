const express = require('express');
const {
  addReview,
  deleteReview,
  getReviews,
  logAdminAction, // Not used yet?
} = require('../controllers/reviews');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

// Public for admin, restricted for others
router
  .route('/')
  .get(protect,authorize('admin', 'restaurantManager', 'user'), getReviews) // Get all reviews or by restaurantId
  .post(protect,authorize('admin', 'user'), addReview); // User/Manager adds review

router
  .route('/:id')
  .delete(protect, authorize('admin'), deleteReview); // Only admin can delete

module.exports = router;
