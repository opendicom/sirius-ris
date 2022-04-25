//--------------------------------------------------------------------------------------------------------------------//
// EQUIPMENTS ROUTES:
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

//Import Module Services:
const moduleServices = require('../modules.services');

//Import schemas:
const equipments = require('./schemas');

//Get keys from current schema:
const allSchemaKeys     = mainServices.getSchemaKeys(equipments);            //All.
const allowedSchemaKeys = mainServices.getSchemaKeys(equipments, true);      //No parameters that cannot be modified.

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
                moduleServices.find(req, res, equipments);
                break;
            case 'findById':
                moduleServices.findById(req, res, equipments);
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
                moduleServices.findOne(req, res, equipments);
                break;
            case 'findById':
                moduleServices.findById(req, res, equipments);
                break;
        }
    }
);

//INSERT:
router.post(
    '/insert',
    //mainMiddlewares.checkJWT,
    //checkSession (middleware),
    equipments.Validator,
    (req, res) => { moduleServices.insert(req, res, equipments); }
);

//UPDATE:
router.post(
    '/update',
    //mainMiddlewares.checkJWT,
    //checkSession (middleware),
    mainMiddlewares.allowedValidate(allowedSchemaKeys),
    equipments.Validator,
    (req, res) => { moduleServices.update(req, res, equipments); }
);

//DELETE:
router.post(
    '/delete',
    //mainMiddlewares.checkJWT,
    mainMiddlewares.checkDeleteCode,
    //checkSession (middleware),
    (req, res) => { moduleServices._delete(req, res, equipments); }
);

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//