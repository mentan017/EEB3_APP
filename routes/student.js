//Import modules
const express = require('express');
const mongoose = require('mongoose');
const winston = require('winston');

//Initialize global variables
const router = express.Router();
const homeDirectory = process.env.HOME_DIRECTORY;

//Import MongoDB models
const UserModel = require('../models/user.js');
const CookieModel = require('../models/cookie.js');

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
        res.status(200).sendFile(`${homeDirectory}/Client/Content/Student/Home/index.html`);
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
            }else if(Cookie.UserType != 'student'){
                res.redirect('/content');
            }else{
                next();
            }
        });
    }
}

//Export route
module.exports = router;