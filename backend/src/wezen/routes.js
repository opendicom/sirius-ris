//--------------------------------------------------------------------------------------------------------------------//
// WEZEN ROUTES:
// In this file the routes of the wezen service are declared.
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules
const express   = require('express');
const mongoose  = require('mongoose');

//Import app modules:
const mainServices  = require('../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                        // File settings (YAML)
const currentLang   = require('../main.languages')(mainSettings.language);   // Language Module

//Import middlewares:
const mainMiddlewares = require('../main.middlewares');

//Import Handlers:
const studyTokenHandler  = require('./handlers/studyToken');

//Create Router.
const router = express.Router();

//Routes:
//STUDY TOKEN:
router.get(
    '/studyToken',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    async (req, res) => {
        studyTokenHandler(req, res);
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//