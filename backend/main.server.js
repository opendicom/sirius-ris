//--------------------------------------------------------------------------------------------------------------------//
// MAIN SERVER:
// This module creates Sirius RISjs backend server (WebServer).
//--------------------------------------------------------------------------------------------------------------------//
module.exports = function() {
    //Import external modules:
    const express       = require('express');
    const http          = require('http');
    const https         = require('https');
    const cors          = require('cors');
    const mongoose      = require('mongoose');
    const moment        = require('moment');
    const path          = require("path");
    const fs            = require('fs');

    //Import router modules:
    const authRoutes            = require('./auth/routes');
    const modalitiesRoutes      = require('./modules/modalities/routes');
    const organizationsRoutes   = require('./modules/organizations/routes');
    const usersRoutes           = require('./modules/users/routes');

    //Import app modules:
    const mainServices  = require('./main.services');                           // Main services
    const mainSettings = mainServices.getFileSettings();                        // File settings (YAML)
    const currentLang = require('./main.languages')(mainSettings.language);     // Language Module

    //Set verbose mode (true or false):
    const verboseMode = mainSettings.verbose_log_enabled;

    //Initialize enviroment variables:
    process.env.REGISTERED_IPS = '';

    //Define console message separator:
    const consoleLn = "|---------------------------------------------------------------------------------------------------------------|";

    //Create express object (app webServer):
    const app = express();

    //Check if CORS is enabled or disabled:
    if(mainSettings.cors_enabled === true){
        //Set whitelist (CORS):
        let whiteList = [
            "http://" + mainSettings.webserver.host + ":" + mainSettings.webserver.http_port,
            "https://" + mainSettings.webserver.host + ":" + mainSettings.webserver.https_port
        ];

        //Check mainSettings cors whitelist (not empty):
        if(mainSettings.cors_whitelist){
            whiteList = whiteList.concat(mainSettings.cors_whitelist);
        }

        //Set CORS Asynchronously options:
        const corsOptionsDelegate = (req, callback) => {
            let corsOptions;
            if (whiteList.indexOf(req.header('Origin')) !== -1){
                corsOptions = { origin: true };     //Reflect (enable) the requested origin in the CORS response.
            } else {
                corsOptions = { origin: false };    //Disable CORS for this request.
            }
            callback(null, corsOptions);            //Callback expects two parameters: error and options.
        }

        //Apply CORS options:
        app.use(cors(corsOptionsDelegate));
    } else {
        //Enable All CORS Requests:
        app.use(cors());
    }

    //Configure express Middleware (ex bodyParser):
    app.use(express.json());                            //Parsing application/json
    app.use(express.urlencoded({ extended: true }));    //Parsing application/x-www-form-urlencoded

    //Set Auth path (JWT):
    app.post('/auth', (req, res) => {
        //DEBUG:
        res.status(200).send({ success: true, message: 'AUTH TEST OK' });
    });

    //Set MongoDB URI:
    const mongodbURI = 'mongodb://' + mainSettings.db.host + ':' + mainSettings.db.port + '/' + mainSettings.db.name;

    //Establish connection with MongoDB:
    mongoose.connect(mongodbURI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }, (err) => {
        if(err){
            console.error('| ' + currentLang.server.db_cnx_error + mongodbURI);
            console.log(consoleLn + '\n');
            throw err;
        } else {
            console.log('| ' + currentLang.server.db_cnx_success + mongodbURI);
            console.log(consoleLn + '\n');
        }

        //Verbose mode message:
        if(verboseMode === true) {
            console.log('Verbose Mode: enabled\n')
        } else {
            console.log('Verbose Mode: disabled\n')
        }
    });

    //Set default path:
    app.get('/', (req, res) => {
        //DEBUG:
        res.status(200).send({ success: true, message: 'MAIN OK' });
    });

    //Set modules routes:
    app.use('/singin', authRoutes);
    app.use('/modalities', modalitiesRoutes);
    app.use('/organizations', organizationsRoutes);
    app.use('/users', usersRoutes);

    //Start message:
    console.log('\n' + consoleLn);
    console.log('| ' + currentLang.server.start + ' | ' + moment().format('DD/MM/YYYY H:mm:ss'));
    console.log(consoleLn);

    //HTTP Enabled:
    if(mainSettings.webserver.http_enabled === true){
        //Create HTTP server:
        const httpServer = http.createServer(app);

        //Start listening on our server:
        httpServer.listen(mainSettings.webserver.http_port, () => {
            console.log('| http://' + mainSettings.webserver.host + ':' + mainSettings.webserver.http_port);
        });
    }

    //HTTPS Enabled:
    if(mainSettings.webserver.https_enabled === true){
        const httpsOptions = {
            //Reference SSL certificates:
            key     : fs.readFileSync(path.resolve('./', mainSettings.ssl_certificates.key)),
            cert    : fs.readFileSync(path.resolve('./', mainSettings.ssl_certificates.cert)),
        };

        //If certificates is not self-signed:
        if(mainSettings.ssl_certificates.ca){
            httpsOptions['ca'] = fs.readFileSync(path.resolve('./', mainSettings.ssl_certificates.ca));
        }

        //Create HTTPS Server:
        https.createServer(httpsOptions, app).listen(mainSettings.webserver.https_port, () => {
            console.log('| https://' + mainSettings.webserver.host + ':' + mainSettings.webserver.https_port);
        });
    }

    //HTTP and HTTPS Advice:
    if(mainSettings.webserver.http_enabled === false && mainSettings.webserver.https_enabled === false ){
        console.log('| ' + currentLang.server.non_server);
    }

    //Export WebServer:
    return app;
};
//--------------------------------------------------------------------------------------------------------------------//