//--------------------------------------------------------------------------------------------------------------------//
// MAIN SERVER:
// This module creates Sirius RIS backend server (WebServer).
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
    const logsRoutes                    = require('./modules/logs/routes');
    const sessionsRoutes                = require('./modules/sessions/routes');
    const modalitiesRoutes              = require('./modules/modalities/routes');
    const organizationsRoutes           = require('./modules/organizations/routes');
    const branchesRoutes                = require('./modules/branches/routes');
    const servicesRoutes                = require('./modules/services/routes');
    const equipmentsRoutes              = require('./modules/equipments/routes');
    const peopleRoutes                  = require('./modules/people/routes');
    const usersRoutes                   = require('./modules/users/routes');
    const slotsRoutes                   = require('./modules/slots/routes');
    const proceduresRoutes              = require('./modules/procedures/routes');
    const procedure_categoriesRoutes    = require('./modules/procedure_categories/routes');
    const filesRoutes                   = require('./modules/files/routes');
    const appointmentsRoutes            = require('./modules/appointments/routes');
    const appointments_draftsRoutes     = require('./modules/appointments_drafts/routes');
    const appointment_requestsRoutes    = require('./modules/appointment_requests/routes');
    const pathologiesRoutes             = require('./modules/pathologies/routes');
    const performingRoutes              = require('./modules/performing/routes');
    const reportsRoutes                 = require('./modules/reports/routes');
    const signaturesRoutes              = require('./modules/signatures/routes');

    //Import other routes:
    const authRoutes                    = require('./auth/routes');
    const mwlRoutes                     = require('./mwl/routes');
    const mailRoutes                    = require('./mail/routes');
    const exporterRoutes                = require('./exporter/routes');
    const wezenRoutes                   = require('./wezen/routes');
    const statsRoutes                   = require('./stats/routes');
    const downloadsRoutes               = require('./downloads/routes');

    //Import app modules:
    const mainServices  = require('./main.services');                           // Main services
    const mainSettings = mainServices.getFileSettings();                        // File settings (YAML)
    const currentLang = require('./main.languages')(mainSettings.language);     // Language Module

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
    //Limits were set to allow base64 files on the body (Prevent payload too large).
    app.use(express.json({ limit: '50mb', extended: true }));          //Parsing application/json
    app.use(express.urlencoded({ limit: '50mb', extended: true }));    //Parsing application/x-www-form-urlencoded
    app.use(express.text({ limit: '200mb' }));

    //Set MongoDB URI:
    const mongodbURI = 'mongodb://' + mainSettings.db.user + ':' + mainSettings.db.pass + '@' + mainSettings.db.host + ':' + mainSettings.db.port + '/' + mainSettings.db.name + '?authSource=admin';
    const publicURI = 'mongodb://' + mainSettings.db.user + ':***@' + mainSettings.db.host + ':' + mainSettings.db.port + '/' + mainSettings.db.name;

    //Establish connection with MongoDB:
    let cnxMongoDBStatus = false;
    let cnXMongoDBMessage = '';

    mongoose.connect(mongodbURI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true }, (err) => {
        if(err){
            //Set status conexion:
            cnxMongoDBStatus = false;

            //Set MongoDB Message:
            cnXMongoDBMessage = currentLang.server.db_cnx_error + publicURI;

            //Send messages to console:
            console.error('| ' + cnXMongoDBMessage);
            console.log(consoleLn + '\n');
            throw err;
        } else {
            //Set status conexion:
            cnxMongoDBStatus = true;

            //Set MongoDB Message:
            cnXMongoDBMessage = currentLang.server.db_cnx_success + publicURI;

            //Send messages to console:
            console.log('| ' + cnXMongoDBMessage);
            console.log(consoleLn + '\n');
        }

        //Log level message:
        console.log(' • Log level : ' + mainSettings.log_level + '\n');
    });

    //Set modules routes:
    app.use('/logs',                    logsRoutes);
    app.use('/sessions',                sessionsRoutes);
    app.use('/modalities',              modalitiesRoutes);
    app.use('/organizations',           organizationsRoutes);
    app.use('/branches',                branchesRoutes);
    app.use('/services',                servicesRoutes);
    app.use('/equipments',              equipmentsRoutes);
    app.use('/people',                  peopleRoutes);
    app.use('/users',                   usersRoutes);
    app.use('/slots',                   slotsRoutes);
    app.use('/procedures',              proceduresRoutes);
    app.use('/procedure_categories',    procedure_categoriesRoutes);
    app.use('/files',                   filesRoutes);
    app.use('/appointments',            appointmentsRoutes);
    app.use('/appointments_drafts',     appointments_draftsRoutes);
    app.use('/appointment_requests',    appointment_requestsRoutes);
    app.use('/pathologies',             pathologiesRoutes);
    app.use('/performing',              performingRoutes);
    app.use('/reports',                 reportsRoutes);
    app.use('/signatures',              signaturesRoutes);

    //Set other routes:
    app.use('/signin',                  authRoutes);
    app.use('/mwl',                     mwlRoutes);
    app.use('/mail',                    mailRoutes);
    app.use('/exporter',                exporterRoutes);
    app.use('/wezen',                   wezenRoutes);
    app.use('/stats',                   statsRoutes);
    app.use('/downloads',               downloadsRoutes);

    //Start message:
    let startMessage = currentLang.server.start + ' | ' + moment().format('DD/MM/YYYY HH:mm:ss', { trim: false });
    console.log('\n' + consoleLn);
    console.log('| ' + startMessage);
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

    //Set default server path:
    app.get('/', (req, res) => {
        //Initialize webSerberOptions:
        let sirius_backend = {
            HTTP    : { status: 'disabled', url: false },
            HTTPS   : { status: 'disabled', url: false, ssl_certificates: false }
        };

        //HTTP Enabled:
        if(mainSettings.webserver.http_enabled === true){
            sirius_backend.HTTP.status    = 'enabled';
            sirius_backend.HTTP.url       = 'http://' + mainSettings.webserver.host + ':' + mainSettings.webserver.http_port;
        }

        //HTTPS Enabled:
        if(mainSettings.webserver.https_enabled === true){
            sirius_backend.HTTPS.status   = 'enabled';
            sirius_backend.HTTPS.url      = 'https://' + mainSettings.webserver.host + ':' + mainSettings.webserver.https_port;
            sirius_backend.HTTPS.ssl_certificates = mainSettings.ssl_certificates;
        }

        //Check if complete information is requested (Prevent disclosure of infrastructure information):
        if(mainServices.stringToBoolean(req.query.full_status) === true){
            //Send HTTP/HTTPS Response (Complete information):
            res.status(200).send({
                message: startMessage,
                log_level: mainSettings.log_level,
                sirius_backend,
                sirius_db: {
                    status: cnxMongoDBStatus,
                    message: cnXMongoDBMessage
                },
                mail_server: mainSettings.mailserver,
                pacs: mainSettings.pacs
            });
        } else {
            //Send HTTP/HTTPS Response (Lazy information):
            res.status(200).send({ message: startMessage });
        }
    });

    //Export WebServer:
    return app;
};
//--------------------------------------------------------------------------------------------------------------------//