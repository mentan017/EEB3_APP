//Import modules
const express = require('express');
const mongoose = require('mongoose');
const winston = require('winston');

//Initialize global variables
const router = express.Router();
const homeDirectory = process.env.HOME_DIRECTORY;

//Import MongoDB models
const UserModel = require('../models/user');
const EmailTokenModel = require('../models/emailtoken.js');
const { route } = require('./login');

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
                res.status(401).send("The token does not exist, it may have expired");
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

//Export route
module.exports = router;