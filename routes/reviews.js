const express = require('express');
const {  addReview,deleteReview,getReviews,logAdminAction } = require('../controllers/reviews');
const router = express.Router({ mergeParams: true });
const { protect, authorize } = require('../middleware/auth');



router.route('/').get(protect, getReviews).post(protect, addReview);
router.route('/:id').delete(protect,authorize('admin'), deleteReview);


module.exports = router;