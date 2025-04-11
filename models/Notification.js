const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
      },
      text: {
        type: String,
        required: true
      },
      creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'createdBy' 
      },
      createdBy: {
        type: String,
        enum: ['Admin', 'RestaurantManager'],
        required: true
      },
      targetAudience: {
        type: String,
        // Restaurant Manager can only sent to customers that are has reserved in his restaurant
        // Admin can sent to customers or restaurant managers or all users
        enum: ['Customers', 'RestaurantManagers', 'All'],
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now,
        required : true
      }
});

module.exports = mongoose.model('Notification', NotificationSchema);