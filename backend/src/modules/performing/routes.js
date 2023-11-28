//--------------------------------------------------------------------------------------------------------------------//
// PERFORMING ROUTES:
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
const findHandler   = require('./handlers/find');
const saveHandler   = require('./handlers/save');
const fastHandler   = require('./handlers/fast.insert');

//Import Module Services:
const moduleServices = require('../modules.services');

//Import schemas:
const performing = require('./schemas');

//Get keys from current schema:
const allSchemaKeys     = mainServices.getSchemaKeys(performing);            //All.
const allowedSchemaKeys = mainServices.getSchemaKeys(performing, true);      //No parameters that cannot be modified.

//Create Router.
const router = express.Router();

//Routes:
//FIND:
router.get(
    '/find',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    (req, res) => {
        //Send to handler:
        findHandler(req, res, performing);
    }
);

//FIND ONE:
router.get(
    '/findOne',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    (req, res) => {
        //Force limit to one result:
        req.query.skip = 0;                                 //No skip
        req.query.limit = 1;                                //One document
        if(req.query.pager) { delete req.query.pager };     //No pager

        //Send to handler:
        findHandler(req, res, performing);
    }
);

//INSERT:
router.post(
    '/insert',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    performing.Validator,
    (req, res) => {
        //Send to handler:
        saveHandler(req, res, performing, 'insert');
    }
);

//FAST INSERT:
router.post(
    '/fast-insert',
    //mainMiddlewares.checkJWT,
    //mainMiddlewares.roleAccessBasedControl,
    //performing.Validator,
    (req, res) => {
        //Send to handler:
        fastHandler(req, res);
    }
);

//UPDATE:
router.post(
    '/update',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.allowedValidate(allowedSchemaKeys, performing.AllowedUnsetValues),
    performing.Validator,
    (req, res) => { 
        //Send to handler:
        saveHandler(req, res, performing, 'update');
    }
);

//DELETE:
router.post(
    '/delete',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.checkDeleteCode,
    (req, res) => { 
        //Send to module service:
        moduleServices._delete(req, res, performing);
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//