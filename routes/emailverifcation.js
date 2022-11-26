//Import modules
const express = require('express');
const mongoose = require('mongoose');
const winston = require('winston');
const bcrypt = require('bcrypt');
const {v4: uuidv4} = require('uuid');

//Initialize global variables
const router = express.Router();
const homeDirectory = process.env.HOME_DIRECTORY;

//Import MongoDB models
const UserModel = require('../models/user');
const EmailTokenModel = require('../models/emailtoken.js');
const RecoveryTokenModel = require('../models/recoverytoken.js');

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

router.get('/', function(req, res){
    res.redirect('/');
});
router.get('/verify/:id', async function(req, res){
    try{
        var token = req.params.id;
        //Deleting the token once it is used
        EmailTokenModel.findOneAndRemove({Token: token}, async function(err, Token){
            if(err){
                logger.log(err);
                console.log(err);
                res.sendStatus(500);
            }else if(Token === null){
                res.status(401).sendFile(`${homeDirectory}/Client/VerifyEmail/error.html`);
            }else{
                //Activate the account of the user
                UserModel.findByIdAndUpdate(Token.UserId, {Activated: true}, async function(err, User){
                    if(err){
                        logger.log(err);
                        console.log(err);
                        res.sendStatus(500);
                    }else{
                        res.status(200).sendFile(`${homeDirectory}/Client/VerifyEmail/success.html`);
                    }
                });
            }
        });
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
});
router.get('/newtoken', function(req, res){
    try{
        res.status(200).sendFile(`${homeDirectory}/Client/VerifyEmail/newtoken.html`);
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
});
router.get('/recover', function(req, res){
    try{
        res.status(200).sendFile(`${homeDirectory}/Client/Recover/main.html`);
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
});
router.get('/recover/:id', function(req, res){
    try{
        //Check that the recovery token is valid
        var RecoveryToken = req.params.id || "";
        RecoveryTokenModel.findOne({Token: RecoveryToken}, function(err, Token){
            if(err){
                logger.log(err);
                console.log(err);
                res.sendStatus(500);
            }else if(Token == null){
                //The recovery token may have expired
                res.status(401).sendFile(`${homeDirectory}/Client/Recover/error.html`);
            }else{
                //Set a cookie with the recovery token that expires in one day
                res.cookie('RecoveryToken', RecoveryToken, {maxAge: 86400000});
                //Send the html page
                res.status(200).sendFile(`${homeDirectory}/Client/Recover/recover.html`);
            }
        });
    }catch(e){
        logger.log(e);
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/newtoken', async function(req, res){
    try{
        var Email = req.body.Email || "";
        if(Email.includes(" ") || Email == ""){
            res.status(401).send({error: "Invalid email", code: 0});
        }else{
            //Check if there is an user with this email
            UserModel.findOne({Email: Email}, async function(err, User){
                if(err){
                    logger.log(err);
                    console.log(err);
                    res.sendStatus(500);
                }else if(User == null){
                    res.status(401).send({error: "No user with this email", code: 1});
                }else if(User.Activated == true){
                    res.status(401).send({error: "Account already activated", code: 2});
                }else{
                    var Token = new EmailTokenModel({
                        UserId: User._id,
                        Token: uuidv4()
                    });
                    try{
                        await Token.save();
                        //TODO: send verification email
                        //Temporarely send the email verification url
                        res.status(200).send({url: `/email/verify/${Token.Token}`});
                    }catch(e){
                        console.log(e);
                        logger.log(e);
                        res.sendStatus(500);
                    }
                }
            });
        }
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
});
router.post('/recoverytoken', async function(req, res){
    try{
        var Email = req.body.email || "";
        if(Email.includes(" ") || Email == ""){
            res.status(401).send({error: "Invalid email", code: 0});
        }else{
            //Check if there is an user with this email
            UserModel.findOne({Email: Email}, async function(err, User){
                if(err){
                    logger.log(err);
                    console.log(err);
                    res.sendStatus(500);
                }else if(User == null){
                    res.status(401).send({error: "No user with this email", code: 1});
                }else{
                    var Token = new RecoveryTokenModel({
                        UserId: User._id,
                        Token: uuidv4()
                    });
                    try{
                        await Token.save();
                        //TODO: send recovery email
                        res.status(200).send({url: `/email/recover/${Token.Token}`});
                    }catch(e){
                        console.log(e);
                        logger.log(e);
                        res.sendStatus(500);
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
router.post('/recover', function(req, res){
    try{
        var RecoveryToken = req.cookies.RecoveryToken || "";
        RecoveryTokenModel.findOne({Token: RecoveryToken}, async function(err, Token){
            if(err){
                logger.log(err);
                console.log(err);
                res.sendStatus(500);
            }else if(!Token){
                //The token doesn't exist or has expired
                res.status(401).send({error: "Inexisting token", code: 0});
            }else{
                var Password = req.body.password || "";
                if((Password == "") || (Password == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")){ //Hash of ""
                    res.status(401).send({error: "Invalid password", code: 1});
                }else{
                    var Salt = await bcrypt.genSalt(10);
                    var PasswordHash = await bcrypt.hash(Password, Salt);
                    UserModel.findByIdAndUpdate(Token.UserId, {Password: PasswordHash}, async function(err, User){
                        if(err){
                            logger.log(err);
                            console.log(err);
                            res.sendStatus(500);
                        }else if(!User){
                            //The user has been deleted
                            res.clearCookie('RecoveryToken');
                            res.status(401).send({error: "Inexisting user", code: 2});
                        }else{
                            var Verification = await bcrypt.compare(Password, User.Password)
                            if(Verification === true){
                                res.status(401).send({error: "The new password is the same as the old password", code: 3});
                            }else{
                                res.clearCookie('RecoveryToken');
                                res.sendStatus(200);
                                var temp = await RecoveryTokenModel.findOneAndDelete({Token: RecoveryToken});
                            }
                        }
                    });
                }
            }
        });
    }catch(e){
        logger.log(e);
        console.log(e);
        res.sendStatus(500);
    }
});

//Export route
module.exports = router;