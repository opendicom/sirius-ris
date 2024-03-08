//--------------------------------------------------------------------------------------------------------------------//
// STATS ROUTES:
// In this file the routes of the stats module are declared.
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
const appointmentsHandler  = require('./handlers/appointments');

//Create Router.
const router = express.Router();

//Routes:
//APPOINTMENTS:
router.get(
    '/appointments',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    async (req, res) => {
        appointmentsHandler(req, res);
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//