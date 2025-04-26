const express = require('express');
const {
  addReview,
  deleteReview,
  getReviews,
  logAdminAction, // Not used yet?
} = require('../controllers/reviews');

const router = express.Router({ mergeParams: true });

const { protect, authorize, protect_review } = require('../middleware/auth');

// Public for admin, restricted for others
router.route('/')
  .get(protect_review, getReviews) // Get all reviews or by restaurantId
  .post(protect,authorize('user'), addReview); // User adds review

router.route('/:id')
  .delete(protect, authorize('admin'), deleteReview); // Only admin can delete

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       required:
 *         - rating
 *         - review
 *         - customerId
 *         - restaurantId
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique ID
 *         rating:
 *           type: number
 *           description: Rating from 1.0 to 5.0
 *           example: 4.5
 *         review:
 *           type: string
 *           example: "The food was delicious and the service was great!"
 *         customerId:
 *           type: string
 *           format: objectId
 *           example: 60b8d295f1e2e74f30c6c123
 *         restaurantId:
 *           type: string
 *           format: objectId
 *           example: 60c72b2f9b1e8a001c8e4f3d
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *       403:
 *         description: Unauthorized access - User does not have the required permissions
 *       500:
 *         description: Server error - Internal server issues while processing the request
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
