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
const appointmentsHandler   = require('./handlers/appointments');
const performingHandler     = require('./handlers/performing');
const organizationsHandler  = require('./handlers/organizations');

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

//PERFORMING:
router.get(
    '/performing',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    async (req, res) => {
        performingHandler(req, res);
    }
);

//ORGANIZATIONS:
router.get(
    '/organizations',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    async (req, res) => {
        organizationsHandler(req, res);
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//