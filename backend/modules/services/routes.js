//--------------------------------------------------------------------------------------------------------------------//
// SERVICES ROUTES:
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
const services = require('./schemas');

//Create Router.
const router = express.Router();

//Routes:
//FIND:
router.get(
    '/find',
    //mainMiddlewares.checkJWT,
    (req, res) => {
        findHandler(req, res);
    }
);

//FIND ONE:
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

//DELETE:
router.post(
    '/delete',
    //mainMiddlewares.checkJWT,
    mainMiddlewares.checkDeleteCode,
    //checkSession (middleware),
    (req, res) => { moduleServices._delete(req, res, services); }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//