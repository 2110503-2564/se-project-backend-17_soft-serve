const express = require('express');
const {getRestaurants, getRestaurant, createRestaurant, updateRestaurant, 
    deleteRestaurant,createRestaurantForRestaurantManager,deleteRestaurantOnUserFailure,
    getAvailability} = require('../controllers/restaurants');
const {protect, authorize} = require('../middleware/auth');
// Include other resource routers
const reservationRouter = require('./reservations');
const reviewRouter = require('./reviews');
const systemAuthMiddleware = require('../middleware/systemauth');
    
const logAdminAction = require('../middleware/logAdminAction');

const router = express.Router();

router.use('/:restaurantId/reservations/', reservationRouter);
router.use('/:restaurantId/reviews/', reviewRouter);

router.route('/').get(getRestaurants)
                 .post(protect, authorize('admin'), createRestaurant);

router.route('/:id').get(getRestaurant)
                    .put(protect, authorize('admin', 'restaurantManager'), updateRestaurant)
                    .delete(protect, authorize('admin'), deleteRestaurant);

router.route('/:restaurantId/availability').get(getAvailability);

/**
 * @swagger
 * tags:
 *   name: Restaurants
 *   description: API for managing restaurants
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Restaurant:
 *       type: object
 *       required:
 *         - name
 *         - foodType
 *         - address
 *         - province
 *         - district
 *         - postalcode
 *         - tel
 *         - openTime
 *         - closeTime
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique ID
 *         name:
 *           type: string
 *           example: "Pizza Palace"
 *         description:
 *           type: string
 *           example: "Pizza House"
 *         foodType:
 *           type: string
 *           example: "Italian"
 *         address:
 *           type: string
 *           example: "123 Main Street"
 *         province:
 *           type: string
 *           example: "Bangkok"
 *         district:
 *           type: string
 *           example: "Sathorn"
 *         postalcode:
 *           type: string
 *           example: "10120"
 *         tel:
 *           type: string
 *           example: "0812345678"
 *         openTime:
 *           type: string
 *           example: "10:00"
 *         closeTime:
 *           type: string
 *           example: "22:00"
 *         ratingrating:
 *           type: number
 *           example: 4.5
 *         reviewCount:
 *           type: number
 *           example: 5
 *         maxReservation:
 *           type: number
 *           example: 20
 *         imgPath:
 *           type: string
 *           example: "https://example.com/image.jpg"
 *         verified:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /restaurants:
 *   get:
 *     summary: Get all restaurants
 *     tags: [Restaurants]
 *     parameters:
 *       - in: query
 *         name: select
 *         required: false
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to include in the response (e.g., name,address)
 *       - in: query
 *         name: sort
 *         required: false
 *         schema:
 *           type: string
 *         description: Sort the results by fields (e.g., name,-createdAt for descending order)
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: List of restaurants
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
 *                   example: 25
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     next:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                     prev:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Invalid query parameters
 */

/**
 * @swagger
 * /restaurants/{id}:
 *   get:
 *     summary: Get a single restaurant by ID
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Restaurant details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: Restaurant not found
 */

/**
 * @swagger
 * /restaurants:
 *   post:
 *     summary: Create a new restaurant
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Restaurant'
 *     responses:
 *       201:
 *         description: Restaurant created
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /restaurants/{id}:
 *   put:
 *     summary: Update restaurant details
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Restaurant'
 *     responses:
 *       200:
 *         description: Restaurant updated
 *       404:
 *         description: Restaurant not found
 */

/**
 * @swagger
 * /restaurants/{id}:
 *   delete:
 *     summary: Delete a restaurant
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Restaurant deleted
 *       404:
 *         description: Restaurant not found
 */
router.route('/create').post(createRestaurantForRestaurantManager);
router.delete('/system/:id', systemAuthMiddleware, async (req, res) => {
    try {
      const result = await deleteRestaurantOnUserFailure(req.params.id);
      
      if (result.success) {
        return res.status(200).json({ success: true, message: result.message });
      } else {
        return res.status(400).json({ success: false, message: result.message });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: err.message });
    }
});
module.exports = router;