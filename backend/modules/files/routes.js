//--------------------------------------------------------------------------------------------------------------------//
// FILES ROUTES:
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

//Import Module Services:
const moduleServices = require('../modules.services');

//Import schemas:
const files = require('./schemas');

//Get keys from current schema:
const allSchemaKeys     = mainServices.getSchemaKeys(files);            //All.
const allowedSchemaKeys = mainServices.getSchemaKeys(files, true);      //No parameters that cannot be modified.

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
        findHandler(req, res, files);
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
        findHandler(req, res, files);
    }
);

//INSERT:
router.post(
    '/insert',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    files.Validator,
    (req, res) => {
        //Send to handler:
        saveHandler(req, res, files, 'insert');
    }
);

//UPDATE:
router.post(
    '/update',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.allowedValidate(allowedSchemaKeys, files.AllowedUnsetValues),
    files.Validator,
    async (req, res) => {
        //Search for duplicates:
        const base64 = await moduleServices.isDuplicated(req, res, files, { base64: req.body.base64 });  //Same base64 = same file (duplicated).

        //Check for duplicates:
        if(base64 == false){
            //Send to handler:
            saveHandler(req, res, files, 'update');
        }
    }
);

//DELETE:
router.post(
    '/delete',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.checkDeleteCode,
    async (req, res) => { 
        //Search for duplicates:
        const base64 = await moduleServices.isDuplicated(req, res, files, { base64: req.body.base64 });  //Same base64 = same file (duplicated).

        //Check for duplicates:
        if(base64 == false){
            //Send to module service:
            moduleServices._delete(req, res, files);
        }
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// FILES BATCH:
//--------------------------------------------------------------------------------------------------------------------//
//DELETE BATCH:
router.post(
    '/batch/delete',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.checkDeleteCode,
    async (req, res) => { await moduleServices.batchDelete(req, res, files) }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//