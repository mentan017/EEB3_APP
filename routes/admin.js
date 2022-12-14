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
router.put('/addAbsence', async function(req, res){
    try{
        var Email = req.body.Email || "";
        if(Email != ""){
            //Get the current date
            var CurrentDate = (new Date()).toDateString();
            var CurrentDay = (new Date()).getDay();
            var Teacher = await UserModel.findOne({Email: Email});
            if(CurrentDay > 4){
                //CurrentDay is 5 or 6 (weekend days)
                res.status(401).send({error: 'Today is a weekend', code: 0});
            }else if(Teacher != null){
                //Fetch the Teachers Schedule if there is one and get the cancelled classes. By default it's empty
                var CancelledPeriods = [];
                var CancelledClasses = [];
                if(Teacher.Schedule){
                    //Get the Cancelled Periods and Classes
                    var Schedule = await ScheduleModel.findById(Teacher.Schedule);
                    for(var i=0; i<Schedule.Days[CurrentDay].Classes.length; i++){
                        if(Schedule.Days[CurrentDay].Classes[i].Subject.length != 0){
                            CancelledPeriods.push(i);
                        }
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
                                CancelledPeriods: CancelledPeriods
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
                                CancelledPeriods: CancelledPeriods
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