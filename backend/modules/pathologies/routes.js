//--------------------------------------------------------------------------------------------------------------------//
// PATHOLOGIES ROUTES:
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

//Import Module Services:
const moduleServices = require('../modules.services');

//Import schemas:
const pathologies = require('./schemas');

//Get keys from current schema:
const allSchemaKeys     = mainServices.getSchemaKeys(pathologies);            //All.
const allowedSchemaKeys = mainServices.getSchemaKeys(pathologies, true);      //No parameters that cannot be modified.

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

        //Switch operation type:
        switch(operation_type){
            case 'find':
                moduleServices.find(req, res, pathologies);
                break;
            case 'findById':
                moduleServices.findById(req, res, pathologies);
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

        //Switch operation type:
        switch(operation_type){
            case 'findOne':
                moduleServices.findOne(req, res, pathologies);
                break;
            case 'findById':
                moduleServices.findById(req, res, pathologies);
                break;
        }
    }
);

//INSERT:
router.post(
    '/insert',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    pathologies.Validator,
    async (req, res) => {
        //Search for duplicates:
        const duplicated = await moduleServices.isDuplicated(req, res, pathologies, { name: req.body.name });

        //Check for duplicates:
        if(duplicated == false){
            //Save data:
            moduleServices.insert(req, res, pathologies);
        }
    }
);

//UPDATE:
router.post(
    '/update',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.allowedValidate(allowedSchemaKeys, pathologies.AllowedUnsetValues),
    pathologies.Validator,
    async (req, res) => {
        //Search for duplicates:
        const duplicated = await moduleServices.isDuplicated(req, res, pathologies, { name: req.body.name });

        //Data normalization - toUpperCase for pathology name:
        //Fix allowedValidate case: NO Data normalization because body is cloned in set object.
        if(req.validatedResult.set.name !== undefined && req.validatedResult.set.name !== ''){ req.validatedResult.set.name = req.validatedResult.set.name.toUpperCase(); }

        //Check for duplicates:
        if(duplicated == false){
            //Save data:
            moduleServices.update(req, res, pathologies);
        }
    }
);

//DELETE:
router.post(
    '/delete',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.checkDeleteCode,
    (req, res) => { moduleServices._delete(req, res, pathologies); }
);

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//