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
 *         - revDate
 *         - user
 *         - restaurant
 *         - numberOfPeople
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated unique ID
 *         revDate:
 *           type: string
 *           format: date-time
 *           example: "2025-04-01T19:00:00Z"
 *         user:
 *           type: string
 *           description: User ID
 *           example: "65f1b2c4e5d6a7b8c9d0e1f2"
 *         restaurant:
 *           type: string
 *           description: Restaurant ID
 *           example: "60d0fe4f5311236168a109ca"
 *         numberOfPeople:
 *           type: number
 *           example: 4
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-03-18T15:30:00Z"
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
 *       404:
 *         description: Reservation not found
 */

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reservation'
 *     responses:
 *       201:
 *         description: Reservation created
 *       400:
 *         description: Invalid input
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