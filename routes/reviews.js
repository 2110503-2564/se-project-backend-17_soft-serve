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
router.route('/')
  .get(protect, getReviews) // Get all reviews or by restaurantId
  .post(protect,authorize('user'), addReview); // User adds review

router.route('/:id')
  .delete(protect, authorize('admin'), deleteReview); // Only admin can delete

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Review ID
 *           example: 660d91fd7f9dc3c02b166cb2
 *         rating:
 *           type: number
 *           description: Rating from 1.0 to 5.0
 *           example: 4.5
 *         review:
 *           type: string
 *           description: Optional review text
 *           example: "The food was delicious and the service was great!"
 *         customerId:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 660c889c7f9dc3c02b166cac
 *             name:
 *               type: string
 *               example: "John Doe"
 *         restaurantId:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 660a12347f9dc3c02b166abc
 *             name:
 *               type: string
 *               example: "Pizza Palace"
 *             province:
 *               type: string
 *               example: "Bangkok"
 *             tel:
 *               type: string
 *               example: "0891234567"
 *             imgPath:
 *               type: string
 *               example: "/uploads/restaurant/pizza-palace.jpg"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-04-14T13:22:07.123Z"
 */

/**
 * @swagger
 * /reviews:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get all reviews or filter by restaurant (admin, manager, user)
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional restaurant ID to filter reviews
 *     responses:
 *       200:
 *         description: Successfully retrieved reviews
 *       403:
 *         description: Unauthorized access
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /restaurants/{restaurantId}/reviews:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Create a new review for a restaurant
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the restaurant to review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 example: 4.5
 *               review:
 *                 type: string
 *                 example: "Excellent food!"
 *     responses:
 *       201:
 *         description: Review successfully created
 *       400:
 *         description: Invalid input or unverified restaurant
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     summary: Delete a review (admin only)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review to delete
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Review not found
 *       500:
 *         description: Server error
 */


module.exports = router;
