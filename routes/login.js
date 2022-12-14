//Import modules
const express = require('express');
const mongoose = require('mongoose');
const winston = require('winston');
const bcrypt = require('bcrypt');
const {v4: uuidv4} = require('uuid');
const nodemailer = require('nodemailer');

//Initialize global variables
const router = express.Router();
const homeDirectory = process.env.HOME_DIRECTORY;

//Import MongoDB models
const UserModel = require('../models/user.js');
const EmailTokenModel = require('../models/emailtoken.js');
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

router.use(CheckCookie);

router.get('/', function(req, res){
    res.redirect('/auth/login');
});
router.get('/login', function(req, res){
    try{
        res.status(200).sendFile(`${homeDirectory}/Client/Auth/Login/index.html`);
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
});
router.post('/login', function(req, res){
    try{
        var Email = req.body.email || "";
        var Password = req.body.password || "";
        if(Email.includes(" ") || Email == ""){
            res.status(401).send({error: "Invalid email", code: 0});
        }else if(!isEmailValid(Email)){
            res.status(401).send({error: "Invalid email", code: 0});
        }else if((Password == "") || (Password == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")){ //Hash of ""
            res.status(401).send({error: "Invalid password", code: 1});
        }else{
            //Search for the user with this email
            UserModel.findOne({Email: Email}, async function(err, User){
                if(err){
                    logger.log(e);
                    console.log(e);
                    res.sendStatus(500);
                }else if(User == null){
                    //The user doesn't exist
                    res.status(401).send({error: "No user with this email", code: 2});
                }else{
                    //Check if the passwords match
                    var Verification = await bcrypt.compare(Password, User.Password);
                    if(Verification === true){
                        if(User.Activated == true){
                            //TODO: Create a cookie
                            var Cookie = new CookieModel({
                                UUID: uuidv4(),
                                UserId: User._id,
                                UserType: User.Type
                            });
                            try{
                                await Cookie.save();
                                res.status(200).cookie("SID", Cookie.UUID).send();

                            }catch(e){
                                logger.log(e);
                                console.log(e);
                                res.sendStatus(500);
                            }
                        }else{
                            //The user didn't activate his account
                            res.status(401).send({error: "Account not activated", code: 3});
                        }
                    }else{
                        res.status(401).send({error: "Wrong password", code: 4});
                    }
                }
            });
        }
    }catch(e){
        logger.log(e);
        console.log(e);
        res.sendStatus(500);
    }
});
router.get('/register', function(req, res){
    try{
        res.status(200).sendFile(`${homeDirectory}/Client/Auth/Register/index.html`);
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
});
router.post('/register', async function(req, res){
    try{
        //Verify that the request variables are valid
        var Email = req.body.email || "";
        var Name = req.body.name || "";
        var Password = req.body.password || "";
        if(Email.includes(" ") || Email == ""){
            res.status(401).send({error: "Invalid email", code: 0});
        }else if(Name == ""){
            res.status(401).send({error: "Invalid name", code: 1});
        }else if((Password == "") || (Password == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")){ //Hash of ""
            res.status(401).send({error: "Invalid password", code: 2});
        }else{
            //TODO: Verify if the email exists
            var ValidEmail = await isEmailValid(Email);
            if(ValidEmail){
                //TODO: Verify that the email is from the school
                var AccountType = "student";
                if(Email.includes("@eursc.eu")){
                    AccountType = "admin";
                }else if(Email.includes("@teacher.eursc.eu")){
                    AccountType = "teacher";
                }
                //Verify that a user with this email doesn't exist
                UserModel.findOne({Email: Email}, async function(err, User){
                    if(err){
                        logger.log(err);
                        console.log(err);
                        res.sendStatus(500);
                    }else if(User !== null){
                        res.status(401).send({error: "Email in use", code: 3});
                    }else{
                        //Hash the password
                        var Salt = await bcrypt.genSalt(10);
                        var PasswordHash = await bcrypt.hash(Password, Salt);
                        var User = new UserModel({
                            Name: Name,
                            Email: Email,
                            Password: PasswordHash,
                            Type: AccountType,
                        });
                        try{
                            await User.save();
                            //Create an email verification token
                            var Token = new EmailTokenModel({
                                UserId: User._id,
                                Token: uuidv4()
                            });
                            try{
                                await Token.save();
                                //TODO: send verification email
                                //Temporarely send to the email verification page
                                res.status(200).send({url: `/email/verify/${Token.Token}`})
                            }catch(e){
                                console.log(e);
                                logger.log(e);
                                res.sendStatus(500);
                            }
                        }catch(e){
                            console.log(e);
                            logger.log(e);
                            res.sendStatus(500);
                        }
                    }
                });
            }else{
                res.status(401).send({error: "Invalid email", code: 0});
            }
        }
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
});

async function isEmailValid(email){
    return((email.substring(email.length-17) === "@student.eursc.eu") || (email.substring(email.length-17) === "@teacher.eursc.eu") || (email.substring(email.length-9) === "@eursc.eu"));
}

//Setup Middleware
async function CheckCookie(req, res, next){
    if(req.cookies.SID == undefined){
        next();
    }else{
        CookieModel.findOne({UUID: req.cookies.SID}, async function(err, Cookie){
            if(err){
                logger.log(err);
                console.log(err);
                next();
            }else if(Cookie == null){
                res.clearCookie('SID');
                next();
            }else{
                res.redirect('/');
            }
        });
    }
}

//Export route
module.exports = router;