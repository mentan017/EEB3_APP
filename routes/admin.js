//Import modules
const express = require('express');
const mongoose = require('mongoose');
const winston = require('winston');
const absence = require('../models/absence.js');

//Initialize global variables
const router = express.Router();
const homeDirectory = process.env.HOME_DIRECTORY;

//Import MongoDB models
const AbsenceModel = require('../models/absence.js');
const CookieModel = require('../models/cookie.js');
const ScheduleModel = require('../models/schedule.js');
const UserModel = require('../models/user.js');

//Connect to MongoDB database
mongoose.connect('mongodb://127.0.0.1:27017/EEB3_APP_DEV', {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;

//Set the logger
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({filename: 'Error.log'})
    ]
});

//Configuration
router.use(VerifyUserType);

router.get('/', function(req, res){
    try{
        res.status(200).sendFile(`${homeDirectory}/Client/Content/Admin/Home/index.html`);
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
});
router.get('/absences', function(req, res){
    try{
        res.status(200).sendFile(`${homeDirectory}/Client/Content/Admin/Absences/index.html`);
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
});
router.post('/fetchTeacherNames', async function(req, res){
    try{
        var Query = req.body.Query || "";
        if(req.body.Query == ""){
            res.sendStatus(400);
        }else{
            //Fetch the teachers from the database
            Teachers = await UserModel.find({$or: [{Name: {$regex: Query, $options: "i"}, $or: [{Type: 'teacher'}, {Type: 'admin'}]}, {Email: {$regex: Query, $options: "i"}, $or: [{Type: 'teacher'}, {Type: 'admin'}]}]});
            Teachers.slice(0, 4);
            //Format the data
            for(var i=0; i<Teachers.length; i++){
                Teachers[i] = {
                    Name: Teachers[i].Name,
                    Email: Teachers[i].Email
                }
            }
            res.status(200).send(Teachers);
        }
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
});
router.post('/fetchAbsentTeachers', async function(req, res){
    try{
        var CurrentDate = (new Date()).toDateString();
        AbsenceModel.findOne({Date: CurrentDate}, function(err, Absence){
            if(err){
                console.log(err);
                logger.log(err);
                res.sendStatus(500);
            }else if(Absence == null){
                res.status(200).send([]);
            }else{
                res.status(200).send(Absence.Teachers);
            }
        });
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
});
router.put('/addAbsence', async function(req, res){
    try{
        var Email = req.body.Email || "";
        if(Email != ""){
            //Get the current date
            var CurrentDate = (new Date()).toDateString();
            var CurrentDay = (new Date()).getDay()-1;
            var Teacher = await UserModel.findOne({Email: Email});
            if(CurrentDay > 4){
                //CurrentDay is 5 or 6 (weekend days)
                res.status(401).send({error: 'Today is a weekend', code: 0});
            }else if(Teacher != null){
                //Fetch the Teachers Schedule if there is one and get the cancelled classes. By default it's empty
                var CancelledClasses = [];
                if(Teacher.Schedule){
                    //Get the Cancelled Periods and Classes
                    var Schedule = await ScheduleModel.findById(Teacher.Schedule);
                    for(var i=0; i<Schedule.Days[CurrentDay].Classes.length; i++){
                        CancelledClasses.push(Schedule.Days[CurrentDay].Classes[i].Subject);
                    }
                }
                //Update the Absences
                AbsenceModel.findOne({Date: CurrentDate}, async function(err, Absence){
                    if(err){
                        console.log(err);
                        logger.log(e);
                        res.sendStatus(500);
                    }else if(Absence == null){
                        //Create a new absence
                        var Periods = [];
                        for(var i=0; i<9; i++){
                            if((CancelledClasses[i] != undefined) && (CancelledClasses[i] != "")){
                                Periods.push({CancelledClasses: [CancelledClasses[i]]});
                            }else{
                                Periods.push({CancelledClasses: []});
                            }
                        }
                        var CurrentAbsence = new AbsenceModel({
                            Teachers: [{
                                Name: Teacher.Name,
                                Email: Teacher.Email,
                                CancelledPeriods: [0, 1, 2, 3, 4, 5, 6, 7, 8]
                            }],
                            Periods: Periods,
                            Date: CurrentDate
                        });
                        await CurrentAbsence.save();
                        res.sendStatus(200);
                    }else{
                        //Check that the Teacher is not already in the absence
                        var TeacherExists = false
                        for(var j=0; j<Absence.Teachers.length; j++){
                            if(Absence.Teachers[j].Email == Email){
                                TeacherExists = true;
                                j = Absence.Teachers.length;
                            }
                        }
                        if(!TeacherExists){
                            Absence.Teachers.unshift({
                                Name: Teacher.Name,
                                Email: Email,
                                CancelledPeriods: [0, 1, 2, 3, 4, 5, 6, 7, 8]
                            });
                            for(var i=0; i<CancelledClasses.length; i++){
                                if(CancelledClasses[i] != ""){
                                    Absence.Periods[i].CancelledClasses.push(CancelledClasses[i]);
                                }
                            }
                            await Absence.save();
                            res.sendStatus(200);
                        }else{
                            //The Teacher is already in the absence
                            res.status(401).send({error: "The teacher is already in the absence today", code: 1});
                        }
                    }
                });
            }else{
                res.status(401).send({error: "No teacher matching this email", code: 2});
            }
        }else{
            res.sendStatus(400);
        }
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
});
router.put('/updateAbsentPeriods', async function(req, res){
    try{
        var Email = req.body.Email || "";
        var Period = req.body.Period || -1;
        var Remove = req.body.Remove || false;
        if((Email != "") && (Period != -1)){
            UserModel.findOne({Email: Email}, async function(err, Teacher){
                if(err){
                    console.log(err);
                    logger.log(err);
                    res.sendStatus(500);
                }else if(!Teacher){
                    res.status(401).send({error: "There aren't any teachers with this email"});
                }else{
                    var CurrentDate = (new Date).toDateString();
                    var CurrentDay = (new Date).getDay()-1;
                    var Absence = await AbsenceModel.findOne({Date: CurrentDate});
                    for(var i=0; i<Absence.Teachers.length; i++){
                        if(Absence.Teachers[i].Email == Email){
                            if(Remove == true){
                                var index = Absence.Teachers[i].CancelledPeriods.indexOf(Period);
                                if(index > -1) Absence.Teachers[i].CancelledPeriods.splice(index, 1);
                            }else{
                                var index = Absence.Teachers[i].CancelledPeriods.indexOf(Period);
                                if(index == -1) Absence.Teachers[i].CancelledPeriods.push(Period);
                            }
                            i = Absence.Teachers.length;
                        }
                    }
                    if(Teacher.Schedule){
                        var Schedule = await ScheduleModel.findById(Teacher.Schedule);
                        var Class = Schedule.Days[CurrentDay].Classes[Period].Subject;
                        if(Remove == true){
                            var index = Absence.Periods[Period].CancelledClasses.indexOf(Class);
                            if(index > -1) Absence.Periods[Period].CancelledClasses.splice(index, 1);
                        }else{
                            var index = Absence.Periods[Period].CancelledClasses.indexOf(Class);
                            if(index == -1) Absence.Periods[Period].CancelledClasses.push(Class);
                        }
                    }
                    await Absence.save();
                    res.sendStatus(200);
                }
            })
        }else{
            res.sendStatus(400);
        }
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
})
router.delete('/deleteAbsence', async function(req, res){
    try{
        var Email = req.body.Email || "";
        if(Email != ""){
            //Get the current date
            var CurrentDate = (new Date()).toDateString();
            AbsenceModel.findOne({Date: CurrentDate}, async function(err, Absence){
                if(err){
                    console.log(err);
                    logger.log(err);
                    res.sendStatus(500);
                }else if(Absence == null){
                    res.status(401).send({error: "There are no absences today", code: 0});
                }else{
                    var i=0;
                    while(i<Absence.Teachers.length){
                        if(Absence.Teachers[i].Email == Email){
                            //Splice is not a function
                            Absence.Teachers.splice(i, 1);
                            i = Absence.Teachers.length;
                            //Remove the cancelled classes of this teacher
                            UserModel.findOne({Email: Email}, async function(err, Teacher){
                                if(err){
                                    console.log(err);
                                    logger.log(err);
                                    res.sendStatus(500);
                                }else if(Teacher){
                                    if(Teacher.Schedule){
                                        var Schedule = await ScheduleModel.findById(Teacher.Schedule);
                                        var CurrentDay = (new Date()).getDay()-1;
                                        for(var j=0; j<Schedule.Days[CurrentDay].Classes.length; j++){
                                            for(var k=0; k<Absence.Periods.length; k++){
                                                var index = Absence.Periods[k].CancelledClasses.indexOf(Schedule.Days[CurrentDay].Classes[j].Subject);
                                                if(index > -1){
                                                    Absence.Periods[k].CancelledClasses.splice(index, 1);
                                                }
                                            }
                                        }
                                    }
                                }
                                await Absence.save();
                            });
                        }
                        i++;
                    }
                    res.sendStatus(200);
                }
            });
        }else{
            res.sendStatus(400);
        }
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
});

//Setup Middleware
async function VerifyUserType(req, res, next){
    if(req.cookies.SID == undefined){
        res.redirect('/auth/login');
    }else{
        CookieModel.findOne({UUID: req.cookies.SID}, async function(err, Cookie){
            if(err){
                logger.log(err);
                console.log(err);
                res.redirect('/');
            }else if(Cookie == null){
                res.clearCookie('SID');
                res.redirect('/auth/login');
            }else if(Cookie.UserType != 'admin'){
                res.redirect('/content');
            }else{
                next();
            }
        });
    }
}
//Export route
module.exports = router;