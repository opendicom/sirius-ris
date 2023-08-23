//--------------------------------------------------------------------------------------------------------------------//
// AUTH ROUTES:
// In this file the routes of the module are declared.
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const express   = require('express');

//Import app modules:
const mainServices  = require('../main.services');                          // Main services
const mainSettings  = mainServices.getFileSettings();                       // File settings (YAML)
const currentLang   = require('../main.languages')(mainSettings.language);  // Language Module

//Import middlewares:
const mainMiddlewares = require('../main.middlewares');
const authMiddlewares = require('./middlewares');

//Import Handlers:
const signinHuman       = require('./handlers/signin.human');
const signinMachine     = require('./handlers/signin.machine');
const authorizeHandler  = require('./handlers/authorize');

//Create Router.
const router = express.Router();

//Routes:
router.post(
    '/',
    authMiddlewares.accessControl, (req, res) => {
        //Send INFO Message:
        mainServices.sendConsoleMessage('INFO', mainServices.reqReceived(req));

        // Human signin:
        if(req.body.doc_country_code && req.body.doc_type && req.body.document && req.body.password){
            signinHuman(req, res);
        // Machine signin:
        } else if (req.body.username && req.body.password){
            signinMachine(req, res);
        } else {
            res.status(400).send({ success: false, message: currentLang.http.bad_request });
        }
    }
);

router.post(
    '/authorize',
    mainMiddlewares.checkJWT,
    (req, res) => {
        if (req.body.domain && req.body.role){
            authorizeHandler(req, res);
        } else {
            res.status(400).send({ success: false, message: currentLang.http.bad_request });
        }
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//