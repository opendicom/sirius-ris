//--------------------------------------------------------------------------------------------------------------------//
// PEOPLE ROUTES:
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
const people = require('./schemas');

//Get keys from current schema:
const allSchemaKeys     = mainServices.getSchemaKeys(people);            //All.
const allowedSchemaKeys = mainServices.getSchemaKeys(people, true);      //No parameters that cannot be modified.

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
                moduleServices.find(req, res, people);
                break;
            case 'findById':
                moduleServices.findById(req, res, people);
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
                moduleServices.findOne(req, res, people);
                break;
            case 'findById':
                moduleServices.findById(req, res, people);
                break;
        }
    }
);

//INSERT:
router.post(
    '/insert',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    people.Validator,
    async (req, res) => {
        //Check if the person already exists in the database:
        const personExist = await moduleServices.checkPerson(req, res);

        //Check for duplicates:
        if(personExist == false){
            //Save data:
            moduleServices.insert(req, res, people);
        }
    }
);

//UPDATE:
router.post(
    '/update',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.allowedValidate(allowedSchemaKeys, people.AllowedUnsetValues),
    people.Validator,
    async (req, res) => {
        //Check if the person already exists in the database:
        const personExist = await moduleServices.checkPerson(req, res);

        //Data normalization - toUpperCase for names and surnames:
        //Fix allowedValidate case: NO Data normalization because body is cloned in set object.
        if(req.validatedResult.set.name_01 !== undefined && req.validatedResult.set.name_01 !== ''){ req.validatedResult.set.name_01 = req.validatedResult.set.name_01.toUpperCase(); }
        if(req.validatedResult.set.name_02 !== undefined && req.validatedResult.set.name_02 !== ''){ req.validatedResult.set.name_02 = req.validatedResult.set.name_02.toUpperCase(); }
        if(req.validatedResult.set.surname_01 !== undefined && req.validatedResult.set.name_02 !== ''){ req.validatedResult.set.surname_01 = req.validatedResult.set.surname_01.toUpperCase(); }
        if(req.validatedResult.set.surname_02 !== undefined && req.validatedResult.set.name_02 !== ''){ req.validatedResult.set.surname_02 = req.validatedResult.set.surname_02.toUpperCase(); }

        //Check for duplicates:
        if(personExist == false){
            //Save data:
            moduleServices.update(req, res, people);
        }
    }
);

//DELETE:
router.post(
    '/delete',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.checkDeleteCode,
    (req, res) => { moduleServices._delete(req, res, people); }
);

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//