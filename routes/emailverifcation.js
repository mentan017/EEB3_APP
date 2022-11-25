//Import modules
const express = require('express');
const mongoose = require('mongoose');
const winston = require('winston');
const {v4: uuidv4} = require('uuid');

//Initialize global variables
const router = express.Router();
const homeDirectory = process.env.HOME_DIRECTORY;

//Import MongoDB models
const UserModel = require('../models/user');
const EmailTokenModel = require('../models/emailtoken.js');

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
router.get('/newtoken', async function(req, res){
    try{
        res.status(200).sendFile(`${homeDirectory}/Client/VerifyEmail/newtoken.html`);
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
});
router.post('/newtoken', async function(req, res){
    try{
        var Email = req.body.Email || "";
        if(Email.includes(" ") || Email == ""){
            res.status(401).send({error: "Invalid email", code: 0});
        }else{
            //Check if there is a user with this email
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

//Export route
module.exports = router;