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
 *         - _id
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
 *     summary: Get all reviews (admin, restaurant manager, user)
 *     tags: [Reviews]
 *     description: >
 *       - Admin: View all reviews or filter by restaurantId (query param).  
 *       - Restaurant Manager: View reviews of their assigned restaurant only.  
 *       - User: View their own reviews or filter by restaurantId (query param).
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional restaurant ID to filter reviews (admin, user only)
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
 *                   example: 5
 *                 starCount:
 *                   type: object
 *                   properties:
 *                     1:
 *                       type: integer
 *                       example: 1
 *                     2:
 *                       type: integer
 *                       example: 0
 *                     3:
 *                       type: integer
 *                       example: 2
 *                     4:
 *                       type: integer
 *                       example: 1
 *                     5:
 *                       type: integer
 *                       example: 1
 *                   description: (Only for restaurant manager) Summary of reviews by star rating
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *       403:
 *         description: Unauthorized - Access forbidden due to role or assignment
 *       500:
 *         description: Server error - Unable to retrieve reviews
 *
 * /restaurants/{restaurantId}/reviews:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get reviews for a specific restaurant
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         schema:
 *           type: string
 *         required: true
 *         description: Restaurant ID to filter reviews
 *     responses:
 *       200:
 *         description: Successfully retrieved restaurant reviews
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
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *       403:
 *         description: Unauthorized - Access forbidden due to role or assignment
 *       500:
 *         description: Server error - Unable to retrieve reviews
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
 *                 description: The rating for the restaurant, typically between 1 and 5 stars
 *               review:
 *                 type: string
 *                 example: "Excellent food!"
 *                 description: The text of the review or comment about the restaurant
 *     responses:
 *       201:
 *         description: Review successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109d2"
 *                     rating:
 *                       type: number
 *                       example: 4.5
 *                     review:
 *                       type: string
 *                       example: "Excellent food!"
 *                     customerId:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109d3"
 *                     restaurantId:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109d4"
 *       400:
 *         description: Invalid input or unverified restaurant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid rating value or unverified restaurant"
 *       404:
 *         description: Restaurant not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No restaurant found with ID {restaurantId}"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error creating review"
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   example: {}
 *       403:
 *         description: Not authorized to delete review (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 'User {userId} is not authorized to delete this review'
 *       404:
 *         description: Review not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 'No review found with ID {id}'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 'Cannot delete review'
 */

module.exports = router;
