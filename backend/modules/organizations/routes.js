//--------------------------------------------------------------------------------------------------------------------//
// ROUTES:
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
const organizations = require('./schemas');

//Create Router.
const router = express.Router();

//Routes:
//FIND - FIND BY ID:
router.get(
    '/find',
    //mainMiddlewares.checkJWT,
    //checkSession (middleware)
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
                genericCRUD.find(req, res, organizations);
                break;
            case 'findById':
                genericCRUD.findById(req, res, organizations);
                break;
        }
    }
);

//FIND ONE - FIND BY ID:
router.get(
    '/findOne',
    //mainMiddlewares.checkJWT,
    //checkSession (middleware)
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
                genericCRUD.findOne(req, res, organizations);
                break;
            case 'findById':
                genericCRUD.findById(req, res, organizations);
                break;
        }
    }
);

//INSERT:
router.post(
    '/insert',
    //mainMiddlewares.checkJWT,
    //checkSession (middleware)
    (req, res) => { genericCRUD.insert(req, res, organizations); }
);

//UPDATE:
router.post(
    '/update',
    //mainMiddlewares.checkJWT,
    //checkSession (middleware)
    (req, res) => { genericCRUD.update(req, res, organizations); }
);

//DELETE:
router.post(
    '/delete',
    //mainMiddlewares.checkJWT,
    //checkSession (middleware)
    (req, res) => { genericCRUD._delete(req, res, organizations); }
);

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//