//--------------------------------------------------------------------------------------------------------------------//
// PROXY ROUTES:
// In this file the routes of the Sirius Proxy service are declared.
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules
const express   = require('express');

//Import app modules:
const mainServices  = require('../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                        // File settings (YAML)
const currentLang   = require('../main.languages')(mainSettings.language);   // Language Module

//Import middlewares:
const mainMiddlewares = require('../main.middlewares');

//Import Handlers:
const wadoHandler  = require('./handlers/wado');

//Create Router.
const router = express.Router();

//Routes:
//WADO:
router.get(
    '/wado',
    //NO checkJWT -> Check Wezen JWT
    //NO RABC     -> Previous check in wezen handlers and check Wezen JWT.
    async (req, res) => {
        wadoHandler(req, res);
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//