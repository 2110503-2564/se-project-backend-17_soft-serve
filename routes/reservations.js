const express = require('express')

const {getReservations, getReservation, addReservation, updateReservation, deleteReservation} = require('../controllers/reservations');

const router = express.Router({mergeParams : true});

// protect use to check user roles
const {protect, authorize} = require('../middleware/auth');

const logAdminAction = require('../middleware/logAdminAction');

router.route('/').get(protect, getReservations)
                 .post(protect, authorize('admin', 'user'), addReservation);

router.route('/:id').get(protect, getReservation)
                    .put(protect, authorize('admin', 'user'), updateReservation)
                    .delete(protect, authorize('admin', 'user'), deleteReservation);

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: API for managing restaurant reservations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Reservation:
 *       type: object
 *       required:
 *         - _id
 *         - revDate
 *         - restaurant
 *         - user
 *         - numberOfPeople
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique ID
 *         revDate:
 *           type: string
 *           format: date-time
 *           example: "2025-04-01T19:00:00Z"
 *         user:
 *           type: string
 *           format: objectId
 *           example: 60b8d295f1e2e74f30c6c123
 *         restaurant:
 *           type: string
 *           format: objectId
 *           example: "60d0fe4f5311236168a109ca"
 *         numberOfPeople:
 *           type: number
 *           example: 4
 */

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: Get all reservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reservations
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
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "6629fe3aab5f983c4c2be733"
 *                       revDate:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-05-01T18:00:00.000Z"
 *                       numberOfPeople:
 *                         type: integer
 *                         example: 2
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-04-26T10:00:00.000Z"
 *                       user:
 *                         oneOf:
 *                           - type: string
 *                             example: "661e23f6f5a0f9b28a7e894e"
 *                           - type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: "John Doe"
 *                               tel:
 *                                 type: string
 *                                 example: "081-234-5678"
 *                       restaurant:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Soft Serve Cafe"
 *                           province:
 *                             type: string
 *                             example: "Bangkok"
 *                           tel:
 *                             type: string
 *                             example: "02-123-4567"
 *                           imgPath:
 *                             type: string
 *                             example: "/uploads/restaurants/softserve.jpg"
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
 *                   example: "Failed to retrieve reservations. Please try again later."
 */

/**
 * @swagger
 * /reservations/{id}:
 *   get:
 *     summary: Get a single reservation by ID
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     responses:
 *       200:
 *         description: Reservation details
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
 *                       example: "6629fe3aab5f983c4c2be733"
 *                     revDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-05-01T18:00:00.000Z"
 *                     numberOfPeople:
 *                       type: integer
 *                       example: 4
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-04-26T10:00:00.000Z"
 *                     user:
 *                       oneOf:
 *                         - type: string
 *                           example: "661e23f6f5a0f9b28a7e894e"
 *                         - type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: "John Doe"
 *                             tel:
 *                               type: string
 *                               example: "081-234-5678"
 *                     restaurant:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "Soft Serve Cafe"
 *                         province:
 *                           type: string
 *                           example: "Bangkok"
 *                         tel:
 *                           type: string
 *                           example: "02-123-4567"
 *                         imgPath:
 *                           type: string
 *                           example: "/uploads/restaurants/softserve.jpg"
 *       404:
 *         description: Reservation not found
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
 *                   example: "Reservation not found"
 */

/**
 * @swagger
 * /restaurants/{restaurantId}/reservation:
 *   post:
 *     summary: Create a reservation for a restaurant
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the restaurant where the reservation is being made
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               revDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-04-01T19:00:00Z"
 *               numberOfPeople:
 *                 type: integer
 *                 example: 4
 *     responses:
 *       200:
 *         description: Reservation created successfully
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
 *                   $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Invalid input or reservation cannot be made
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /reservations/{id}:
 *   put:
 *     summary: Update a reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reservation'
 *     responses:
 *       200:
 *         description: Reservation updated
 *       404:
 *         description: Reservation not found
 */

/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     summary: Delete a reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     responses:
 *       200:
 *         description: Reservation deleted
 *       404:
 *         description: Reservation not found
 */

module.exports = router;