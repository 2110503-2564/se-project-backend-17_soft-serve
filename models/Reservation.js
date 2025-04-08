const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
    revDate : {
        type : Date,
        required : true,
        validate: {
            validator: function(date) {
                return date >= new Date();
            },
            message: 'Reservation date cannot be in the past'
        }
    },
    user : {
        type : mongoose.Schema.ObjectId,
        ref : 'User',
        required : true
    },
    restaurant : {
        type : mongoose.Schema.ObjectId,
        ref : 'Restaurant',
        required : true
    },
    numberOfPeople: {
        type: Number,
        required: true,
        min: [1, 'At least one person is required for a reservation'],
        default: 1
    },
    createdAt : {
        type : Date,
        default : Date.now()
    }
});

module.exports = mongoose.model('Reservation', ReservationSchema);