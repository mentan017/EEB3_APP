//Import modules
const express = require('express');
const mongoose = require('mongoose');
const winston = require('winston');

//Initialize global variables
const router = express.Router();

//Import MongoDB models
const CookieModel = require('../models/cookie.js');
const ScheduleModel = require('../models/schedule.js');
const UserModel = require('../models/user.js');

//Import routes
const StudentRouter = require('./student.js');
const TeacherRouter = require('./teacher.js');
const AdminRouter = require('./admin.js');

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

//Redirect the user
router.get('/', function(req, res){
    try{
        if(req.cookies.SID == undefined){
            res.redirect('/auth/login');
        }else{
            CookieModel.findOne({UUID: req.cookies.SID}, async function(err, Cookie){
                if(err){
                    logger.log(err);
                    console.log(err);
                    res.sendStatus(500);
                }else if(Cookie == null){
                    res.clearCookie('SID');
                    res.redirect('/auth/login');
                }else if(Cookie.UserType == 'admin'){
                    res.redirect('/content/admin');
                }else if(Cookie.UserType == 'teacher'){
                    res.redirect('/content/teacher');
                }else{
                    res.redirect('/content/student');
                }
            });
        }
    }catch(e){
        logger.log(e);
        console.log(e);
        res.sendStatus(500);
    }
});

//Set the routes
router.post('/schedule', CheckCookie, async function(req, res){
    try{
        UserModel.findById(req.body.UserId, function(err, User){
            if(err){
                console.log(err);
                logger.log(err);
                res.sendStatus(500);
            }else if(User == null){
                res.clearCookie('SID');
                res.status(401).send({error: "User does not exist", code: 0});
            }else if(User.Activated == false){
                res.clearCookie('SID');
                res.status(401).send({error: "Account not activated", code: 1});
            }else{
                if(User.Schedule != undefined){
                    ScheduleModel.findById(User.Schedule, function(err, Schedule){
                        if(err){
                            console.log(err);
                            logger.log(err);
                            res.sendStatus(500);
                        }else{

                            res.status(200).send(Schedule.Days);
                        }
                    });
                }else{
                    res.sendStatus(204);
                }
            }
        });
    }catch(e){
        logger.log(e);
        console.log(e);
        res.sendStatus(500);
    }
});
router.put('/uploadSchedule', CheckCookie, async function(req, res){
    try{
        var Schedule = req.body.Schedule || "";
        var UserId = req.body.UserId;
        if(Schedule == ""){
            //The request didn't send a schedule
            res.sendStatus(400);
        }else{
            UserModel.findById(UserId, async function(err, User){
                if(err){
                    console.log(err);
                    logger.log(err);
                    res.sendStatus(500);
                }else if(User == null){
                    res.clearCookie('SID');
                    res.status(401).send({error: "User does not exist", code: 0});
                }else if(User.Activated == false){
                    res.status(401).send({error: "Account not activated", code: 1});
                }else{
                    //Create the Schedule element
                    var ScheduleItem = new ScheduleModel({
                        Days: Schedule.map(a => ({Classes: a}))
                    });
                    await ScheduleItem.save();
                    //Delete the previous schedule
                    if(User.Schedule != undefined) await ScheduleModel.findOneAndDelete({_id: User.Schedule});
                    res.sendStatus(200);
                    //Link the schedule to the user
                    User.Schedule = ScheduleItem._id;
                    User.save();              
                }
            });
        }
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
});

//Setup middleware
async function CheckCookie(req, res, next){
    if(req.cookies.SID == undefined){
        res.status(400).redirect('/auth/login');
    }else{
        CookieModel.findOne({UUID: req.cookies.SID}, async function(err, Cookie){
            if(err){
                logger.log(err);
                console.log(err);
                next();
            }else if(Cookie == null){
                res.clearCookie('SID');
                res.status(400).redirect('/auth/login');
            }else{
                //The user can continue
                req.body.UserId = Cookie.UserId;
                next();
            }
        });
    }
}

//Connect routes
router.use('/student', StudentRouter);
router.use('/teacher', TeacherRouter);
router.use('/admin', AdminRouter);

module.exports = router;