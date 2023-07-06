//--------------------------------------------------------------------------------------------------------------------//
// MAIL ROUTES:
// In this file the routes of the mail server are declared.
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules
const express = require('express');

//Import app modules:
const mainServices  = require('../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                        // File settings (YAML)
const currentLang   = require('../main.languages')(mainSettings.language);   // Language Module

//Import middlewares:
const mainMiddlewares = require('../main.middlewares');

//Import Handlers:
const sendHandler     = require('./handlers/send');

//Create Router.
const router = express.Router();

//Routes:
//SEND:
router.post(
    '/send',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    async (req, res) => {
        sendHandler(req, res);
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//