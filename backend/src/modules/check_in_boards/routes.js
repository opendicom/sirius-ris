//--------------------------------------------------------------------------------------------------------------------//
// CHECK_IN_BOARDS ROUTES:
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
const check_in_boards = require('./schemas');

//Get keys from current schema:
const allSchemaKeys     = mainServices.getSchemaKeys(check_in_boards);            //All.
const allowedSchemaKeys = mainServices.getSchemaKeys(check_in_boards, true);      //No parameters that cannot be modified.

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
        findHandler(req, res, check_in_boards);
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
        findHandler(req, res, check_in_boards);
    }
);

//INSERT:
router.post(
    '/insert',
    mainMiddlewares.checkJWT,
    mainMiddlewares.checkDBConnection,
    mainMiddlewares.roleAccessBasedControl,
    check_in_boards.Validator,
    (req, res) => {
        //Send to handler:
        saveHandler(req, res, check_in_boards, 'insert');
    }
);

//UPDATE:
router.post(
    '/update',
    mainMiddlewares.checkJWT,
    mainMiddlewares.checkDBConnection,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.allowedValidate(allowedSchemaKeys, check_in_boards.AllowedUnsetValues),
    check_in_boards.Validator,
    (req, res) => {
        //Send to handler:
        saveHandler(req, res, check_in_boards, 'update');
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
        moduleServices._delete(req, res, check_in_boards);
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//
