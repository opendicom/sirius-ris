//--------------------------------------------------------------------------------------------------------------------//
// ORGANIZATIONS ROUTES:
// In this file the routes of the module are declared.
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules
const express = require('express');
const multer  = require('multer');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Import middlewares:
const mainMiddlewares = require('../../main.middlewares');

//Import Handlers:
const saveHandler   = require('./handlers/save');

//Import Module Services:
const moduleServices = require('../modules.services');

//Import schemas:
const organizations = require('./schemas');

//Get keys from current schema:
const allSchemaKeys     = mainServices.getSchemaKeys(organizations);            //All.
const allowedSchemaKeys = mainServices.getSchemaKeys(organizations, true);      //No parameters that cannot be modified.

//Set storage parameters:
const upload = multer({ storage: mainServices.setStorage() });

//Create Router.
const router = express.Router();

//Routes:
//FIND - FIND BY ID:
router.get(
    '/find',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    (req, res) => {
        //Initialize operation type:
        let operation_type = 'find';

        //Set operation type:
        if(req.query.filter){
            if(req.query.filter._id){
                operation_type = 'findById';
            }
        }

        //Remove base64 and timestamps from default projection:
        //Important note: Request project replaces the aggregation projection (This prevent mix content proj error).
        if(!req.query.proj){ req.query['proj'] = { base64_logo: 0, base64_cert: 0, 'createdAt': 0, 'updatedAt': 0, '__v': 0 }; }

        //Switch operation type:
        switch(operation_type){
            case 'find':
                moduleServices.find(req, res, organizations);
                break;
            case 'findById':
                moduleServices.findById(req, res, organizations);
                break;
        }
    }
);

//FIND ONE - FIND BY ID:
router.get(
    '/findOne',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    (req, res) => {
        //Initialize operation type:
        let operation_type = 'findOne';

        //Set operation type:
        if(req.query.filter){
            if(req.query.filter._id){
                operation_type = 'findById';
            }
        }

        //Remove base64 and timestamps from default projection:
        //Important note: Request project replaces the aggregation projection (This prevent mix content proj error).
        if(!req.query.proj){ req.query['proj'] = { base64_logo: 0, base64_cert: 0, 'createdAt': 0, 'updatedAt': 0, '__v': 0 }; }

        //Switch operation type:
        switch(operation_type){
            case 'findOne':
                moduleServices.findOne(req, res, organizations);
                break;
            case 'findById':
                moduleServices.findById(req, res, organizations);
                break;
        }
    }
);

//INSERT:
router.post(
    '/insert',
    mainMiddlewares.checkJWT,
    upload.any(),
    mainMiddlewares.roleAccessBasedControl,
    organizations.Validator,
    (req, res) => {
        //Send to handler:
        saveHandler(req, res, organizations, 'insert');
    }
);

//UPDATE:
router.post(
    '/update',
    mainMiddlewares.checkJWT,
    upload.any(),
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.allowedValidate(allowedSchemaKeys, organizations.AllowedUnsetValues),
    organizations.Validator,
    (req, res) => {
        //Send to handler:
        saveHandler(req, res, organizations, 'update');
    }
);

//DELETE:
router.post(
    '/delete',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.checkDeleteCode,
    (req, res) => { moduleServices._delete(req, res, organizations); }
);

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//