//--------------------------------------------------------------------------------------------------------------------//
// LOGS ROUTES:
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
const logs = require('./schemas');

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
                genericCRUD.find(req, res, logs);
                break;
            case 'findById':
                genericCRUD.findById(req, res, logs);
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
                genericCRUD.findOne(req, res, logs);
                break;
            case 'findById':
                genericCRUD.findById(req, res, logs);
                break;
        }
    }
);

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//