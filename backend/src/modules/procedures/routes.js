//--------------------------------------------------------------------------------------------------------------------//
// PROCEDURES ROUTES:
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

//Import Module Services:
const moduleServices = require('../modules.services');

//Import schemas:
const procedures = require('./schemas');

//Get keys from current schema:
const allSchemaKeys     = mainServices.getSchemaKeys(procedures);            //All.
const allowedSchemaKeys = mainServices.getSchemaKeys(procedures, true);      //No parameters that cannot be modified.

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
        findHandler(req, res, procedures);
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
        findHandler(req, res, procedures);
    }
);

//INSERT:
router.post(
    '/insert',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    procedures.Validator,
    (req, res) => {
        //Send to handler:
        saveHandler(req, res, procedures, 'insert');
    }
);

//UPDATE:
router.post(
    '/update',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.allowedValidate(allowedSchemaKeys, procedures.AllowedUnsetValues),
    procedures.Validator,
    (req, res) => { 
        //Send to handler:
        saveHandler(req, res, procedures, 'update');
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
        moduleServices._delete(req, res, procedures);
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//