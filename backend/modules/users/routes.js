//--------------------------------------------------------------------------------------------------------------------//
// USERS ROUTES:
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
const findHandler = require('./handlers/find');

//Create Router.
const router = express.Router();

//Routes:
router.get(
    '/find',
    //mainMiddlewares.checkJWT,
    (req, res) => {
        findHandler(req, res);
    }
);

router.get(
    '/findOne',
    //mainMiddlewares.checkJWT,
    (req, res) => {
        //Force limit to one result:
        req.query.skip = 0;                                 //No skip
        req.query.limit = 1;                                //One document
        if(req.query.pager) { delete req.query.pager };     //No pager

        findHandler(req, res);
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//