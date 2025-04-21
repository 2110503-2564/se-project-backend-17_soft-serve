const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      validate: {
        validator: function(value) {
          if (this.createdBy === 'admin' || this.createdBy === 'restaurantManager') {
            return value != null;
          }
            return true;
        },
          message: 'creatorId is required when createdBy is admin or restaurantManager'
        }
    },
    createdBy: {
      type: String,
      enum: ['admin', 'restaurantManager', 'system'],
      required: true
    },
    targetAudience: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function(value) {
          const allowedStrings = ['Customers', 'RestaurantManagers', 'All'];
          return (
            allowedStrings.includes(value) ||
            mongoose.Types.ObjectId.isValid(value)
          );
        },
        message: 'targetAudience must be Customers, RestaurantManagers, All, or Reservation ObjectId'
      }
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required : true
    }
});

module.exports = mongoose.model('Notification', NotificationSchema);