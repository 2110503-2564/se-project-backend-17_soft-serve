const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        min: 0,
        max: 5,
        required: true,
        set: v => (Math.round(v * 10) / 10).toFixed(1)
    },
    review: {
        type: String,
        required: false,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
    createdAt : {
        type : Date,
        default : Date.now()
    }
});

module.exports = mongoose.model('Review', ReviewSchema);