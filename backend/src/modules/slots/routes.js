//--------------------------------------------------------------------------------------------------------------------//
// SLOTS ROUTES:
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
const findHandler           = require('./handlers/find');
const saveHandler           = require('./handlers/save');
const saveBatchHandler      = require('./handlers/batch.save');

//Import Module Services:
const moduleServices = require('../modules.services');

//Import schemas:
const slots = require('./schemas');

//Get keys from current schema:
const allSchemaKeys     = mainServices.getSchemaKeys(slots);            //All.
const allowedSchemaKeys = mainServices.getSchemaKeys(slots, true);      //No parameters that cannot be modified.

//Create Router.
const router = express.Router();

//Routes:
//FIND:
router.get(
    '/find',
    mainMiddlewares.checkJWT,
    mainMiddlewares.checkDBConnection,
    mainMiddlewares.roleAccessBasedControl,
    (req, res) => {
        //Send to handler:
        findHandler(req, res, slots);
    }
);

//FIND ONE:
router.get(
    '/findOne',
    mainMiddlewares.checkJWT,
    mainMiddlewares.checkDBConnection,
    mainMiddlewares.roleAccessBasedControl,
    (req, res) => {
        //Force limit to one result:
        req.query.skip = 0;                                 //No skip
        req.query.limit = 1;                                //One document
        if(req.query.pager) { delete req.query.pager };     //No pager

        //Send to handler:
        findHandler(req, res, slots);
    }
);

//INSERT:
router.post(
    '/insert',
    mainMiddlewares.checkJWT,
    mainMiddlewares.checkDBConnection,
    mainMiddlewares.roleAccessBasedControl,
    slots.Validator,
    (req, res) => {
        //Send to handler:
        saveHandler(req, res, slots, 'insert');
    }
);

//UPDATE:
router.post(
    '/update',
    mainMiddlewares.checkJWT,
    mainMiddlewares.checkDBConnection,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.allowedValidate(allowedSchemaKeys, slots.AllowedUnsetValues),
    slots.Validator,
    (req, res) => { 
        //Send to handler:
        saveHandler(req, res, slots, 'update');
    }
);

//DELETE:
router.post(
    '/delete',
    mainMiddlewares.checkJWT,
    mainMiddlewares.checkDBConnection,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.checkDeleteCode,
    (req, res) => { 
        //Send to module service:
        moduleServices._delete(req, res, slots);
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SLOTS BATCH:
//--------------------------------------------------------------------------------------------------------------------//
//INSERT BATCH:
router.post(
    '/batch/insert',
    mainMiddlewares.checkJWT,
    mainMiddlewares.checkDBConnection,
    mainMiddlewares.roleAccessBasedControl,
    //slots.Validator, //Desactivated because request have other parameters (Example: range_start).
    (req, res) => {
        //Send to handler:
        saveBatchHandler(req, res, slots);
    }
);

//DELETE BATCH:
router.post(
    '/batch/delete',
    mainMiddlewares.checkJWT,
    mainMiddlewares.checkDBConnection,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.checkDeleteCode,
    async (req, res) => { await moduleServices.batchDelete(req, res, slots) }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//