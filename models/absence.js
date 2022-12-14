const mongoose = require('mongoose');

const AbsenceSchema = new mongoose.Schema({
    Teachers: [{
        Name: {
            type: String
        },
        Email: {
            type: String
        },
        CancelledPeriods: [{
            type: Number
        }]
    }],
    Periods: [{
        CancelledClasses: [{
            type: String
        }]
    }],
    Date:{
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Absence', AbsenceSchema);