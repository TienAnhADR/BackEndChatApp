const mongoose = require('mongoose')
const UserSchema = new mongoose.Schema({
    name:{
        type: String,
        require: true
    },
    email:{
        type: String,
        require: true,
        unique: true
    },
    password:{
        type: String,
        require:true
    },
    image:{
        type: String,
        require:true
    },
    freindRequests:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    friends:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:'User'
        }
    ],
    sentFriendRequests:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
})
const User = mongoose.model('User',UserSchema)
module.exports = User