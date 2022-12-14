//Import the node modules
const express = require('express');
const cookieParser = require('cookie-parser');
const https = require('https');
const fs = require('fs');
const mongoose = require('mongoose');
const winston = require('winston');
require('dotenv').config();

//Initialize global variables
const app = express();
const homeDirectory = process.env.HOME_DIRECTORY;

//Set the app configurations
app.use(express.static(__dirname + '/Client'));
app.use(express.json());
app.use(cookieParser());

//Configure the SSl certificate
const sslOptions = {
    key: fs.readFileSync('./cert/key.pem'),
    cert: fs.readFileSync('./cert/cert.pem')
};

//Import routes
const LoginRouter = require('./routes/login.js');
const EmailRouter = require('./routes/emailverifcation.js');
const ContentRouter = require('./routes/content.js');

//Import MongoDB models
const CookieModel = require('./models/cookie.js');

//Connect to MongoDB database
mongoose.connect('mongodb://127.0.0.1:27017/EEB3_APP_DEV', {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;

//Configure the logger
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({filename: 'Error.log'})
    ]
});

//Set the routes
app.get('/', function(req, res){
    try{
        res.status(200).sendFile(`${homeDirectory}/Client/Home/index.html`);
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
});
app.get('/logout', function(req, res){
    try{
        res.clearCookie('SID');
        res.redirect('/auth/login');
        if(req.cookies.SID != undefined){
            CookieModel.findOneAndDelete({UUID: req.cookies.SID}, function(err, Cookie){});
        }
    }catch(e){
        console.log(e);
        logger.log(e);
        res.sendStatus(500);
    }
});

//Connect routes
app.use('/auth', LoginRouter);
app.use('/email', EmailRouter);
app.use('/content', ContentRouter);

//Start the server
https.createServer(sslOptions, app).listen(process.env.PORT);
console.log(`EEB3 App running on port: ${process.env.PORT}`);