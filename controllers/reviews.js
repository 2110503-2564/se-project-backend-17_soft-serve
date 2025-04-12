const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');

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

exports.getReviews=async (req,res,next)=>{
    let query;
//General users can see only their appointments!
    if(req.user.role !== 'admin'){
         query = Review.find({customerId:req.user.id}).populate({
            path: 'restaurantId',
            select: 'name province tel imgPath'
         }); 
    }
    else{
        if (req.params.restaurantId) {
                console.log(req.params.restaurantId);
                query = Review.find({ restaurantId: req.params.restaurantId }).populate({
                    path: "restaurantId",
                    select: 'name province tel imgPath',
                });
        }else
            query = Review.find().populate({
                path: 'restaurantId',
                select: 'name province tel imgPath'
            });
    }

    try {
        const reviews = await query;


        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } 
    catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Cannot find Review"});
    }
};

exports.addReview = async (req, res, next) => {
  console.log('addReview controller is called');
 
  try {
     req.body.restaurant = req.params.restaurantId;
    
    const restaurant = await Restaurant.findById(req.params.restaurantId);
            
    if(!restaurant){
      return res.status(404).json({success: false, message: `No restaurant with the id of ${req.params.restaurantId}`});
    }

    

    // Create a new review linked to the booking
    const review = new Review({
      rating: req.body.rating,
      review: req.body.review,
      customerId:req.user,
      restaurantId:req.params.restaurantId
    });

    // Save the review to the database
    const savedReview = await review.save();

    // Send response with the saved review
    res.status(201).json({
      success: true,
      data: savedReview,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error creating review",
    });
  }
};

exports.deleteReview = async (req,res,next)=>{
    try {
        const review = await Review.findById(req.params.id);

        if(!review){ 
            return res.status(404).json({success: false, message: `No Review with the id of ${req.params.id}`}); 
        }

        if(review.customerId.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({success: false, message: `User ${req.user.id} is not authorized to delete this Review`});
        }

        await review.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Cannot delete Review"});
    }
};