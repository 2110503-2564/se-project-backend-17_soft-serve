const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add name'],
        maxlength: [50, 'Name cannot be more than 50 characters'],
        validate: {
            validator: function (v) {
                return v.trim().length > 0; // check not space
            },
            message: 'Name cannot be empty or contain only spaces'
        }
    },
    description: {
        type: String
    },
    foodType: {
        type: String,
        required: [true, 'Please add a food type']
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    province: {
        type: String,
        required: [true, 'Please add a province']
    },
    district: {
        type: String,
        required: [true, 'Please add a district']
    },
    postalcode: {
        type: String,
        required: [true, 'Please add a postal code'],
        minlength: [5, 'Postal Code must be exactly 5 digits'],
        maxlength: [5, 'Postal Code must be exactly 5 digits'],
        match: [/^\d{5}$/, 'Postal Code must be exactly 5 digits and contain only numbers']
    },
    tel: {
        type: String,
        required: [true, 'Please add a telephone number'],
        validate: [
            {
                validator: function (v) {
                    return /^[0-9-]+$/.test(v);
                },
                message: 'Telephone number must contain digits and hyphens only'
            },
            {
                validator: function (v) {
                    return v.length <= 15;
                },
                message: 'Telephone number must not exceed 15 characters'
            }
        ]
    },
    openTime: {
        type: String,
        required: [true, 'Please add an opening time'],
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Opening time must be in the format hh:mm']
    },
    closeTime: {
        type: String,
        required: [true, 'Please add a closing time'],
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Closing time must be in the format hh:mm'],
        validate: {
            validator: function (value) {
                // Check that openTime is before closeTime
                const openTime = this.openTime;

                if (!openTime) {
                    return true;
                }

                const [openHour, openMinute] = openTime.split(':').map(Number);
                const [closeHour, closeMinute] = value.split(':').map(Number);

                return closeHour > openHour || (closeHour === openHour && closeMinute > openMinute);
            },
            message: 'Closing time must be after opening time'
        }
    },
    maxReservation: {
        type: Number,
        min: [0, 'Max reservation must be greater than or equal to 0'],
        default: 0,
        required: [true, 'Please add a max reservation']
    },
    ratingrating: {
        type: Number,
        min: 0,
        max: 5,
        required: true,
        default: 0,
        set: v => (Math.round(v * 10) / 10).toFixed(1)
    },
    reviewCount: {
        type: Number,
        default: 0,
        min : 0,
        required : true
    },
    imgPath : {
        type: String,
        default : "https://drive.google.com/uc?id=1lwTwYL45cFtoBKQvvj0V49Zd8j_PWiyr",
        required: [true, 'Please add an image path']
    },
    verified: {
        type: Boolean,
        default: false,
        required: [true, 'Please add a verified status']
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Reverse populate with virtuals
RestaurantSchema.virtual('reservations', {
    ref: 'Reservation',
    localField: '_id',
    foreignField: 'restaurant',
    justOne: false
});

// Static method to update rating and review count
RestaurantSchema.statics.updateRatingAndCount = async function (restaurantId) {
    const Review = require('./Review');

    const reviews = await Review.find({ restaurantId });

    if (reviews.length === 0) {
        return await this.findByIdAndUpdate(restaurantId, {
            ratingrating: 0,
            reviewCount: 0
        });
    }

    const reviewCount = reviews.length;
    const avgRating = reviews.reduce((acc, r) => acc + parseFloat(r.rating), 0) / reviewCount;

    return await this.findByIdAndUpdate(restaurantId, {
        ratingrating: parseFloat(avgRating.toFixed(1)),
        reviewCount
    });
};

module.exports = mongoose.model('Restaurant', RestaurantSchema);
