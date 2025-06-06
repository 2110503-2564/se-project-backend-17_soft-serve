const Reservation = require('../models/Reservation');
const Restaurant = require('../models/Restaurant');
const AdminLog = require('../models/AdminLog');
const Notification = require('../models/Notification');

const moment = require('moment-timezone');

const logAdminAction = async (adminId, action, resource, resourceId) => {
    try {
      await AdminLog.create({
        adminId,
        action,
        resource,
        resourceId,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('Failed to log admin action:', err);
    }
  };

// @desc    Get all reservations
// @route   GET /api/v1/reservations
// @access  Public
exports.getReservations = async (req, res, next) => {
    let query;

    if (req.user.role === 'user') {
        // General users can see only their reservations
        query = Reservation.find({
            user: req.user.id,
            revDate: { $gte: moment().subtract(24, 'hours').toDate() }
        }).populate({
            path: 'restaurant',
            select: 'name province tel imgPath'
        }).sort({ revDate: -1, createdAt: 1 });
    } else if(req.user.role === 'restaurantManager') {
        query = Reservation.find({ restaurant: req.user.restaurant })
            .populate({
            path: 'user',
            select: 'name tel -_id'
            })
            .sort({ revDate: -1, createdAt: 1 });
    }else {
        // Admin can see all reservations

        if (req.params.restaurantId) {
            // console.log(req.params.restaurantId);

            query = Reservation.find({ restaurant: req.params.restaurantId });
            // .populate({
            //     path : 'restaurant',
            //     select : 'name province tel'
            // });
        } else {
            query = Reservation.find().populate({
                path: 'restaurant',
                select: 'name province tel imgPath'
            }).sort({ revDate: -1, createdAt: 1 });;
        }
    }

    try {
        const reservations = await query;

        res.status(200).json({
            success: true,
            count: reservations.length,
            data: reservations
        });
    } catch (err) {
        // console.log(err.message);
        res.status(500).json({ success: false, message: 'Failed to retrieve reservations. Please try again later.' });
    }
};

// @desc    Get single reservation
// @route   GET /api/v1/reservations/:id
// @access  Public
exports.getReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate({
            path: 'restaurant',
            select: 'name province tel maxReservation openTime closeTime imgPath rating imgPath address district postalcode'
        });

        if (!reservation) {
            console.log(`id ${req.params.id}`);
            
            return res.status(404).json({ success: false, message: `Reservation not found. Please check the reservation ID.` });
        }

        res.status(200).json({
            success: true,
            data: reservation
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Failed to retrieve reservation. Please try again later.' });
    }
};

// @desc    Add reservation
// @route   POST /api/v1/restaurants/:restaurantId/reservation
// @access  Private
exports.addReservation = async (req, res, next) => {
    try {
        req.body.restaurant = req.params.restaurantId;

        const restaurant = await Restaurant.findById(req.params.restaurantId);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: `Restaurant not found. Please check the restaurant ID.`
            });
        }

        if (!restaurant.verified) {
            return res.status(400).json({
                success: false,
                message: 'Cannot make a reservation because the restaurant is not yet verified.'
            });
        }

        const openTime = restaurant.openTime;
        const closeTime = restaurant.closeTime;

        const revTime = moment(req.body.revDate);

        try {
            isReservationWithinOpeningHours(revTime, openTime, closeTime);
        } catch (error) {
            return res.status(error.status).json({
                success: false,
                message: error.message
            });
        }

        const revDate = new Date(req.body.revDate);
        const currentReserved = await getReservedPeopleCount(restaurant._id, revDate);
        const requestedPeople = req.body.numberOfPeople;

        if (currentReserved + requestedPeople > restaurant.maxReservation) {
            return res.status(400).json({
                success: false,
                message: `Not enough reservation slots available. Only ${restaurant.maxReservation - currentReserved} slots left for ${revDate.toDateString()}`
            });
        }

        req.body.user = req.user.id;

        const existedReservations = await Reservation.find({
            user: req.user.id,
            revDate: {
                $gte: new Date(revDate.setHours(0, 0, 0, 0)),
                $lt: new Date(revDate.setHours(23, 59, 59, 999))
            }
        });

        if (existedReservations.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: `The user has already made 3 reservations on ${revDate.toDateString()}`
            });
        }

        const allExistedReservations = await Reservation.find({ user: req.user.id }).sort({ revDate: -1 });

        for (const existingReservation of allExistedReservations) {
            const existingRevTime = moment(existingReservation.revDate);
            const oneHourBefore = existingRevTime.clone().subtract(1, 'hours');
            const oneHourAfter = existingRevTime.clone().add(1, 'hours');

            if (
                revTime.isBetween(oneHourBefore, oneHourAfter, null, '()') &&
                existingReservation._id.toString() !== req.body.id
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Please ensure there is at least 1 hour gap between reservations.'
                });
            }
        }

        const reservation = await Reservation.create(req.body);

        const publishAt = moment(reservation.revDate).subtract(24, 'hours').isBefore(moment())
            ? moment().toDate()
            : moment(reservation.revDate).subtract(24, 'hours').toDate();

        await Notification.create({
            title: 'Reservation Reminder',
            message: `You have a reservation at ${restaurant.name} on ${moment(reservation.revDate).utcOffset('+07:00').format('YYYY-MM-DD HH:mm')}`,
            createdBy: 'system',
            targetAudience: reservation._id,
            publishAt,
            createdAt: new Date()
        });

        res.status(200).json({
            success: true,
            data: reservation
        });
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to create reservation. Please try again later.'
        });
    }
};

function isReservationWithinOpeningHours(revTime, openTime, closeTime) {
    // Check if the restaurant is open
    if (!openTime || !closeTime) {
        throw {status: 400, message: 'Restaurant opening hours are not properly set. '};
    }

    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);
    const revHour = revTime.hours(), revMinute = revTime.minutes();
    // console.log(openHour, openMinute, closeHour, closeMinute, revHour, revMinute);

    const open = moment({ hour: openHour, minute: openMinute }).tz('Asia/Bangkok');
    const close = moment({ hour: closeHour, minute: closeMinute }).tz('Asia/Bangkok');
    const rev = moment({ hour: revHour, minute: revMinute }).tz('Asia/Bangkok');

    const isOpen = rev.isSameOrAfter(open) && rev.isSameOrBefore(close);

    if (!isOpen) {
        throw {status: 400, message: 'Reservation time must be within the restaurant\'s operating hours.'};
    }
}

// Function to get the total number of people reserved for a specific restaurant on a specific date
const getReservedPeopleCount = async (restaurantId, revDate) => {
    const startOfDay = new Date(revDate);
    startOfDay.setHours(0, 0, 0, 0); // Normalize time to start of the day

    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999); // End of the day

    // Calculate the total number of people reserved for the given date
    const totalPeopleReserved = await Reservation.aggregate([
        {
            $match: {
                restaurant: restaurantId,
                revDate: { $gte: startOfDay, $lt: endOfDay }
            }
        },
        {
            $group: {
                _id: null,
                totalPeople: { $sum: "$numberOfPeople" }
            }
        }
    ]);

    return totalPeopleReserved.length > 0 ? totalPeopleReserved[0].totalPeople : 0;
};

// @desc    Update reservation
// @route   PUT /api/v1/reservations/:id
// @access  Private
exports.updateReservation = async (req, res, next) => {
    try {
        let reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            console.log(`id is ${req.params.id}`);
            
            return res.status(404).json({ success: false, message: `Reservation not found. Please check the ID and try again.` });
        }

        const restaurant = await Restaurant.findById(reservation.restaurant._id);

        if (!restaurant) {
            console.log(`id ${req.params.restaurantId}`);
            
            return res.status(404).json({ success: false, message: `Associated restaurant not found. Please verify the restaurant ID.` });
        }

        // Get the number of people already reserved for the given date
        const revDate = new Date(!req.body.revDate ? reservation.revDate : req.body.revDate);
        let currentReserved = await getReservedPeopleCount(restaurant._id, revDate);
        const requestedPeople = !req.body.numberOfPeople ? reservation.numberOfPeople : req.body.numberOfPeople;
        if (revDate.toDateString() === new Date(reservation.revDate).toDateString()) {
            currentReserved = currentReserved - reservation.numberOfPeople;
        }

        // Check if the new reservation exceeds max capacity
        if (currentReserved + requestedPeople > restaurant.maxReservation) {
            return res.status(400).json({
                success: false,
                message: `Not enough reservation slots available. Only ${restaurant.maxReservation - currentReserved} slots left for ${revDate.toDateString()}`
            });
        }

        const openTime = restaurant.openTime;
        const closeTime = restaurant.closeTime;
        const revTime = moment(!req.body.revDate ? reservation.revDate : req.body.revDate);
        try {
            isReservationWithinOpeningHours(revTime, openTime, closeTime);
        } catch (error) {
            return res.status(error.status).json({ success: false, message: error.message });
        }

        // Convert reservation time to Date object
        const reservationTime = new Date(reservation.revDate);
        const currentTime = new Date();

        // Check if user is trying to update within 1 hour of reservation time
        if (req.user.role !== 'admin' && reservationTime - currentTime <= 60 * 60 * 1000) {
            return res.status(400).json({
                success: false,
                message: 'Reservations cannot be updated within 1 hour of the scheduled time.'
            });
        }

        if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
            console.log(`id ${req.user.id}`);
            
            return res.status(401).json({
                success: false,
                message: `User is not authorized to update this reservation`
            });
        }

        // Check for all existing reservations by the user (for the 1-hour gap)
        const allExistedReservations = await Reservation.find({ user: req.user.id }).sort({ revDate: -1 });

        // Check for 1 hour time gap from all reservations
        for (const existingReservation of allExistedReservations) {
            // Skip the current reservation
            if (existingReservation._id.toString() !== req.params.id) { 
                const existingRevTime = moment(existingReservation.revDate);
                const oneHourBefore = existingRevTime.clone().subtract(1, 'hours');
                const oneHourAfter = existingRevTime.clone().add(1, 'hours');

                if (revTime.isBetween(oneHourBefore, oneHourAfter, null, '()') && existingReservation._id.toString() !== req.body.id) {
                    return res.status(400).json({
                        success: false,
                        message: 'There must be at least a 1-hour gap between your reservations.'
                    });
                }
            }
        }

        // Add log for admin action
        if (req.user.role === 'admin') {
            await logAdminAction(req.user.id, 'Update', 'Reservation', req.params.id);
        }

        reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        const notification = await Notification.findOne({ targetAudience: reservation._id });
        const publishAt = moment(reservation.revDate).subtract(24, 'hours').isBefore(moment()) 
            ? moment().toDate() 
            : moment(notification.publishAt).subtract(24, 'hours').toDate();

        if (notification) {
            notification.message = `Your reservation at ${restaurant.name} has been updated to ${moment(reservation.revDate).utcOffset('+07:00').format('YYYY-MM-DD HH:mm')}`;
            notification.publishAt = publishAt
            await notification.save();
        }

        res.status(200).json({
            success: true,
            data: reservation
        });

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ success: false, message: 'Cannot update the reservation' });
    }
};

// @desc    Delete reservation
// @route   DELETE /api/v1/reservations/:id
// @access  Private
exports.deleteReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ success: false, message: `No reservation with the id of ${req.params.id}` });
        }

        // Convert reservation time to Date object
        const reservationTime = new Date(reservation.revDate);
        const currentTime = moment().toDate();

        console.log(moment(reservationTime).toDate());
        console.log(currentTime);

        // Check if user is trying to delete within 1 hour of reservation time
        if (req.user.role !== 'admin' && reservationTime - currentTime <= 60 * 60 * 1000) {
            return res.status(400).json({
                success: false,
                message: `You cannot delete the reservation within 1 hour of the scheduled time`
            });
        }

        if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
            console.log(`id ${req.user.id}`);
            
            return res.status(401).json({
                success: false,
                message: `User  is not authorized to delete this reservation`
            });
        }

        // Add log for admin action
        if (req.user.role === 'admin') {
            await logAdminAction(req.user.id, 'Delete', 'Reservation', req.params.id);
        }
        await Notification.deleteMany({ targetAudience: reservation._id });
        await reservation.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Cannot delete the reservation' });
    }
};