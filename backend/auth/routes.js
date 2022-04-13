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
        if(req.body.documents){
            singinHuman(req, res);
        // Machine singin:
        } else if (req.body.username){
            singinMachine(req, res);
        } else {
            res.status(400).send({ success: false, message: currentLang.http.bad_request });
        }
        
    }
);

router.post(
    '/authorize',
    mainMiddlewares.checkJWT,
    (req, res) => { authorizeHandler(req, res); }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//