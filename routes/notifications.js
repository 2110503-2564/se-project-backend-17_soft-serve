const express = require('express')
const router = express.Router()
const {createNotification, getNotifications} = require('../controllers/notifications');
const { protect,authorize } = require('../middleware/auth');

router.route('/')
    .get(protect, authorize('admin', 'restaurantManager', 'user'), getNotifications)
    .post(protect, authorize('admin','restaurantManger'), createNotification);

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
 *               $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Invalid user role or missing targetAudience (if admin)
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Retrieve all notifications based on user role
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
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
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *       500:
 *         description: Server error
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
 *       properties:
 *         _id:
 *           type: string
 *           example: 642f11a62e631f1c15dfb123
 *         title:
 *           type: string
 *           example: Promotion for Summer
 *         message:
 *           type: string
 *           example: Get 20% off all items!
 *         creatorId:
 *           type: string
 *           example: 60b8d295f1e2e74f30c6c123
 *         createdBy:
 *           type: string
 *           enum: [Admin, RestaurantManager]
 *           example: Admin
 *         targetAudience:
 *           type: string
 *           enum: [Customers, RestaurantManagers, All]
 *           example: Customers
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-04-12T13:00:00.000Z
 */
