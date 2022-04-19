//--------------------------------------------------------------------------------------------------------------------//
// MODALITIES ROUTES:
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
//const checkSession = require('../');

//Import Generic CRUD Service:
const genericCRUD = require('../crud.services');

//Import schemas:
const modalities = require('./schemas');

//Get keys from current schema:
const allSchemaKeys     = mainServices.getSchemaKeys(modalities);            //All.
const allowedSchemaKeys = mainServices.getSchemaKeys(modalities, true);      //No parameters that cannot be modified.

//Create Router.
const router = express.Router();

//Routes:
//FIND - FIND BY ID:
router.get(
    '/find',
    //mainMiddlewares.checkJWT,
    //checkSession (middleware),
    (req, res) => {
        //Initialize operation type:
        let operation_type = 'find';

        //Set operation type:
        if(req.query.filter){
            if(req.query.filter._id){
                operation_type = 'findById';
            }
        }

        //Switch operation type:
        switch(operation_type){
            case 'find':
                genericCRUD.find(req, res, modalities);
                break;
            case 'findById':
                genericCRUD.findById(req, res, modalities);
                break;
        }
    }
);

//FIND ONE - FIND BY ID:
router.get(
    '/findOne',
    //mainMiddlewares.checkJWT,
    //checkSession (middleware),
    (req, res) => {
        //Initialize operation type:
        let operation_type = 'findOne';

        //Set operation type:
        if(req.query.filter){
            if(req.query.filter._id){
                operation_type = 'findById';
            }
        }

        //Switch operation type:
        switch(operation_type){
            case 'findOne':
                genericCRUD.findOne(req, res, modalities);
                break;
            case 'findById':
                genericCRUD.findById(req, res, modalities);
                break;
        }
    }
);

//INSERT:
router.post(
    '/insert',
    //mainMiddlewares.checkJWT,
    //checkSession (middleware),
    modalities.Validator,
    (req, res) => { genericCRUD.insert(req, res, modalities); }
);

//UPDATE:
router.post(
    '/update',
    //mainMiddlewares.checkJWT,
    //checkSession (middleware),
    mainMiddlewares.allowedValidate(allowedSchemaKeys),
    modalities.Validator,
    (req, res) => { genericCRUD.update(req, res, modalities); }
);

//DELETE:
router.post(
    '/delete',
    //mainMiddlewares.checkJWT,
    mainMiddlewares.checkDeleteCode,
    //checkSession (middleware),
    (req, res) => { genericCRUD._delete(req, res, modalities); }
);

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//