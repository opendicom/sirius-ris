//--------------------------------------------------------------------------------------------------------------------//
// MWL ROUTES:
// In this file the routes of the module are declared.
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules
const express = require('express');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Import middlewares:
const mainMiddlewares = require('../../main.middlewares');

//Import Handlers:
const tcpClientHandler = require('./handlers/tcp-client');

//Create Router.
const router = express.Router();

//Routes:
//INSERT:
router.post(
    '/insert',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    async (req, res) => {
        //Send to handler:
        tcpClientHandler(req, res);
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//