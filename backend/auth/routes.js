//--------------------------------------------------------------------------------------------------------------------//
// ROUTES:
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
const singinHuman       = require('./handlers/singin.human');
const singinMachine     = require('./handlers/singin.machine');
const authorizeHandler  = require('./handlers/authorize');

//Create Router.
const router = express.Router();

//Routes:
router.post(
    '/',
    authMiddlewares.accessControl, (req, res) => {
        // Human singin:
        if(req.body.documents && req.body.password){
            singinHuman(req, res);
        // Machine singin:
        } else if (req.body.username && req.body.password){
            singinMachine(req, res);
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