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

//Import Module Services:
const moduleServices = require('../modules.services');

//Import schemas:
const users = require('./schemas');

//Create Router.
const router = express.Router();

//Routes:
//FIND:
router.get(
    '/find',
    mainMiddlewares.checkJWT,
    //checkSession (middleware),
    (req, res) => {
        //Send to handler:
        findHandler(req, res, users);
    }
);


//FIND ONE:
router.get(
    '/findOne',
    mainMiddlewares.checkJWT,
    //checkSession (middleware),
    (req, res) => {
        //Force limit to one result:
        req.query.skip = 0;                                 //No skip
        req.query.limit = 1;                                //One document
        if(req.query.pager) { delete req.query.pager };     //No pager

        //Send to handler:
        findHandler(req, res, users);
    }
);

//DELETE:
router.post(
    '/delete',
    mainMiddlewares.checkJWT,
    //checkSession (middleware),
    mainMiddlewares.checkDeleteCode,
    (req, res) => {
        //Send to module service:
        moduleServices._delete(req, res, users);
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//