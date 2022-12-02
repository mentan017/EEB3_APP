const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
    Days:[{
        Classes:[{
            Subject:{
                type: String
            },
            Classroom:{
                type: String
            },
            TimePeriod:{ //Ranging from 1 to 9
                type: Number
            }
        }]
    }]
});

module.exports = mongoose.model('Schedule', ScheduleSchema);