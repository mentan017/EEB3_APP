//Import modules
const express = require('express');
const mongoose = require('mongoose');
const winston = require('winston');

//Initialize global variables
const router = express.Router();

//Import MongoDB models
const CookieModel = require('../models/cookie.js');

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

//Connect routes
router.use('/student', StudentRouter);
router.use('/teacher', TeacherRouter);
router.use('/admin', AdminRouter);

module.exports = router;