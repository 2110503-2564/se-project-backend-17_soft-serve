const express = require('express')
const router = express.Router()
const {createNotification, getNotifications, deleteNotification, getNotifications_test} = require('../controllers/notifications');
const { protect,authorize } = require('../middleware/auth');

router.route('/')
    .get(protect, authorize('admin', 'restaurantManager', 'user'), getNotifications)
    .post(protect, authorize('admin','restaurantManager'), createNotification);

router.route('/:id')
    .delete(protect, authorize('admin', 'restaurantManager'), deleteNotification);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: API for managing notifications
 */

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Create a new notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       - Admin can create a notification with any target audience and must provide targetAudience.
 *       - Restaurant Manager can only create a notification for "Customers" and must be verified and associated with a restaurant.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Promotion for Summer
 *               message:
 *                 type: string
 *                 example: Get 20% off all items!
 *               targetAudience:
 *                 type: string
 *                 enum: [Customers, RestaurantManagers, All]
 *                 example: Customers
 *               publishAt:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-04-12T13:00:00.000Z
 *             required:
 *               - title
 *               - message
 *               - targetAudience
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: |
 *           Invalid user role or missing required data:
 *           - For admin: targetAudience is required.
 *           - For restaurantManager: Must be verified and associated with a restaurant.
 *           - Invalid role if user is neither admin nor restaurantManager.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Restaurant manager must be verified to create notifications"
 *       403:
 *         description: User does not have the required permissions or role to create notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Unauthorized role"
 *       500:
 *         description: Server error - Unable to process the request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Retrieve all notifications based on user role
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         required: false
 *         description: Page number for pagination (optional, default is 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         required: false
 *         description: Number of items per page (optional, default is 25)
 *       - in: query
 *         name: select
 *         schema:
 *           type: string
 *         required: false
 *         description: Comma-separated list of fields to select (optional)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         required: false
 *         description: Comma-separated list of fields to sort by (optional)
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *                   example: 1
 *                 total:
 *                   type: integer
 *                   example: 10
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     next:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                           example: 3
 *                         limit:
 *                           type: number
 *                           example: 25
 *                     prev:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                           example: 1
 *                         limit:
 *                           type: number
 *                           example: 25
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification by ID
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the notification to delete
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notification deleted successfully
 *       403:
 *         description: |
 *           Not authorized to delete the notification.
 *           - User must be the creator of the notification or an admin.
 *           - User role should not be 'user' for deleting the notification.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Not authorized to delete this notification"
 *       404:
 *         description: Notification not found with the provided ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "No notification found with ID of {id}"
 *       500:
 *         description: Server error - Unable to process the request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - _id
 *         - title
 *         - message
 *         - createdBy
 *         - targetAudience
 *         - publishAt
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique ID
 *         title:
 *           type: string
 *           example: Promotion for Summer
 *         message:
 *           type: string
 *           example: Get 20% off all items!
 *         creatorId:
 *           type: string
 *           format: objectId
 *           example: 60b8d295f1e2e74f30c6c123
 *         createdBy:
 *           type: string
 *           enum: [admin, restaurantManager, system]
 *           example: admin
 *         restaurant:
 *           type: string
 *           format: objectId
 *           example: 60b8d295f1e2e74f30c6c124
 *         targetAudience:
 *           type: string
 *           description: Can be 'Customers', 'RestaurantManagers', or 'All' or ReservationObjectId
 *           example: Customers
 *         publishAt:
 *           type: string
 *           format: date-time
 *           example: 2025-04-12T13:00:00.000Z
 */
