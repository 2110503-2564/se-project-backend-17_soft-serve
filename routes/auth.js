const express = require('express');
const { register, login, logout, getMe,
        deleteUser, updateMe, changePassword, verifyUser, getAllRestaurantManagers} = require('../controllers/auth');
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
*         createdAt:
*           type: string
*           format: date
*           example: '2023-08-20'
*           description: Date of creation (default is current date-time)
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
*             $ref: '#/components/schemas/User'
*     responses:
*       201:
*         description: The user was successfully created
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/User'
*       500:
*         description: Some server error
*/
router.post('/register', register);

/**
* @swagger
* /auth/login:
*   post:
*     summary: Log-in to the system
*     tags: [Authentication]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties: 
*               email: 
*                   type: string
*               password: 
*                   type: string
*     responses:
*       201:
*         description: Log-in Successfully
*       500:
*         description: Some server error
*/
router.post('/login', login);

/**
 * @swagger
 * /api/v1/auth/logout:
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
 *               tel:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       500:
 *         description: Server error
 */
router.route('/me')
                .get(protect, getMe)
                .patch(protect, updateMe);

/**
 * @swagger
 * /auth/changepassword:
 *   patch:
 *     security:
 *       - bearerAuth: []
 *     summary: Change password of current user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid old password
 *       500:
 *         description: Server error
 */
router.patch('/changepassword', protect, changePassword);
                
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
 * /auth/verifyuser:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Verify a user account (admin only)
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
 *     responses:
 *       200:
 *         description: User verified successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/verifyuser', protect, authorize('admin'), verifyUser);

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
