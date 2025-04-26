const express = require('express');
const { register, login, logout, getMe,
        deleteUser, updateMe, changePassword, verifyRestaurant, getAllRestaurantManagers} = require('../controllers/auth');
const {protect,authorize} = require('../middleware/auth');

const router = express.Router();

const AdminLog = require('../models/AdminLog');

/**
* @swagger
* components:
*   schemas:
*     User:
*       type: object
*       required:
*         - name
*         - email
*         - tel
*         - password
*         - role
*       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique ID
*         name:
*           type: string
*           description: Name of user
*         email:
*           type: string
*           description: Email of user
*         tel:
*           type: string
*           description: Telephone number of user
*         role:
*           type: string
*           description: Role of user (admin, user, or restaurantManager), default is user
*         verified:
*           type: boolean
*           description: Whether the user is verified (default is false)
*         restaurant:
*           type: string
*           description: Restaurant ID if the user is a restaurantManager
*         password:
*           type: string
*           description: Password of user 
*/

/**
* @swagger
* components:
*   securitySchemes:
*     bearerAuth:
*       type: http
*       scheme: bearer
*       bearerFormat: JWT
*/

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
* @swagger
* /auth/register:
*   post:
*     summary: Create a new user
*     tags: [Authentication]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - name
*               - email
*               - tel
*               - role
*               - password
*             properties:
*               name:
*                 type: string
*                 description: Name of user
*               email:
*                 type: string
*                 description: Email of user
*               tel:
*                 type: string
*                 description: Telephone number of user
*               role:
*                 type: string
*                 description: Role of user (admin, user, or restaurantManager)
*               password:
*                 type: string
*                 description: Password of user
*     responses:
*       201:
*         description: Successfully created and return JWT token
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 token:
*                   type: string
*                   description: JWT Token
*                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
*       400:
*         description: Bad request, such as validation error or duplicate email
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
*                   description: Error message
*                   example: "Email already exists"
*       500:
*         description: Some server error
*/
router.post('/register', register);

/**
* @swagger
* /auth/login:
*   post:
*     summary: Log in to the system
*     tags: [Authentication]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - email
*               - password
*             properties:
*               email:
*                 type: string
*                 description: User's email
*                 example: user@example.com
*               password:
*                 type: string
*                 description: User's password
*                 example: yourpassword123
*     responses:
*       200:
*         description: Login successful, returns JWT token
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 token:
*                   type: string
*                   description: JWT Token
*                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
*       400:
*         description: Bad request, invalid credentials or not verified
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
*                   description: Error message
*                   example: "Invalid credentials"
*       500:
*         description: Some server error
*/
router.post('/login', login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out the current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', protect, logout);

/**
* @swagger
* /auth/me:
*   get:
*     security:
*       - bearerAuth: []
*     summary: Return information about me
*     tags: [Authentication]
*     responses:
*       201:
*         description: My user profile
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/User'
*       500:
*         description: Some server error
*/

/**
 * @swagger
 * /auth/me:
 *   patch:
 *     security:
 *       - bearerAuth: []
 *     summary: Update my profile
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated name of the user
 *                 example: "John Doe"
 *               tel:
 *                 type: string
 *                 description: Updated telephone number
 *                 example: "0812345678"
 *             additionalProperties: false
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                       example: "660e8d1d5a6e0e1234567890"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "johndoe@example.com"
 *                     tel:
 *                       type: string
 *                       example: "0812345678"
 *                     role:
 *                       type: string
 *                       example: "user"
 *                     verified:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-04-26T10:30:00.000Z"
 *       400:
 *         description: Bad request (invalid fields)
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
 *                   example: "Invalid update fields"
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
 *                   example: "Internal server error"
 */
router.route('/me')
                .get(protect, getMe)
                .patch(protect, updateMe);

// router.patch('/changepassword', protect, changePassword);
                
/**
 * @swagger
 * /auth/restaurantmanagers:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get all users (admin only)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/restaurantmanagers', protect, authorize('admin'), getAllRestaurantManagers);

/**
 * @swagger
 * /auth/verify:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Verify a restaurant manager account (admin only)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
*               isApprove:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User verified successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/verify', protect, authorize('admin'), verifyRestaurant);

/**
 * @swagger
 * /auth/deluser/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     summary: Delete a user (admin only)
 *     tags: [Authentication]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/deluser/:id', protect, authorize('admin'), deleteUser);

// Admin logs route
router.get('/admin/logs', protect, authorize('admin'), async (req, res) => {
    const logs = await AdminLog.find().populate('adminId', 'name email').sort({ timestamp: -1 });
    res.status(200).json({ success: true, data: logs });
});

module.exports = router;
