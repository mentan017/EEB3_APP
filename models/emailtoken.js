const mongoose = require('mongoose');

const EmailTokenSchema = new mongoose.Schema({
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    Token:{
        type: String,
        required: true
    },
    "expireAt":{
        type: Date,
        default: Date.now,
        expireAt: 86400 //Expires in 1 day
    }
});

module.exports = mongoose.model('EmailToken', EmailTokenSchema);