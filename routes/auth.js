const express = require('express');
const {register, login, logout, getMe,deleteUser, updateMe, changePassword} = require('../controllers/auth');
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
*           description: Role of user (admin or user), default is user
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
 *   get:
 *     summary: Log out the current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.get('/logout', protect, logout);

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
router.get('/me', protect, getMe);

router.get('/admin/logs', protect, authorize('admin'), async (req, res) => {
    const logs = await AdminLog.find().populate('adminId', 'name email').sort({ timestamp: -1 });
    res.status(200).json({ success: true, data: logs });
});

router.route('/deluser/:id').delete(protect,authorize('admin'),deleteUser);
router.patch('/updateuser', protect, updateMe);
router.patch('/changepassword', protect, changePassword);
module.exports = router;
