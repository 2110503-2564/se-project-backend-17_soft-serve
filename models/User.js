const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

const UserSchema = new mongoose.Schema({
    name : {
        type : String,
        required : [true , 'Please add a name'],
        validate: {
            validator: function (v) {
                return v.trim().length > 0 // check not space
            },
            message: 'Name cannot be empty or contain only spaces'
        }
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
    email : {
        type : String,
        required :[true,'Please add an email'],
        unique : true,
        match : [ /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[ \]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[09]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please add a valid email']
    },
    role : {
        type : String,
        enum : ['user', 'admin','restaurantManager'],
        default : 'user'
    },
    password : {
        type : String,
        required : [true,'Please add a password'],
        minlength: 8,
        select: false
    },
    //validation for restaurant manager
    verified: {
        type: Boolean,
        default: undefined
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        default: undefined
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt:{ type: Date, default:Date.now }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next){
    if (!this.isModified('password')) {
        return next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({id : this._id}, process.env.JWT_SECRET, {
        expiresIn : process.env.JWT_EXPIRE
    });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model('User', UserSchema);