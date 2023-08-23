//--------------------------------------------------------------------------------------------------------------------//
// EXPORTER ROUTES:
// In this file the routes of the exporter are declared.
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
const reportsHandler  = require('./handlers/reports');

//Create Router.
const router = express.Router();

//Routes:
//REPORTS:
router.get(
    '/reports',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,     //Without exporter addDomain case (Force filters in handler with JWT data).
    async (req, res) => {
        reportsHandler(req, res);
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//