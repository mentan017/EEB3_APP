const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    Name:{
        type: String,
        required: true
    },
    Email:{
        type: String,
        required: true
    },
    Password:{
        type: String,
        required: true
    },
    Type:{ //This is either 'admin', 'teacher' or 'student'
        type: String,
        required: true
    },
    Schedule:{ //Available to teachers and students
        type: mongoose.Schema.Types.ObjectId
    },
    Year:{ //Available to students
        type: Number
    },
    Activated:{ //This is set to false by default because users have to confirm their email
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('User', UserSchema);