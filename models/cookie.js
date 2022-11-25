const mongoose = require('mongoose');

const CookieSchema = new mongoose.Schema({
    UUID:{
        type: String,
        required: true
    },
    UserId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    UserType:{
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Cookie', CookieSchema);