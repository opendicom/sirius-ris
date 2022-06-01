//--------------------------------------------------------------------------------------------------------------------//
// SESSIONS ROUTES:
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
const sessions = require('./schemas');

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
                moduleServices.find(req, res, sessions);
                break;
            case 'findById':
                moduleServices.findById(req, res, sessions);
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
                moduleServices.findOne(req, res, sessions);
                break;
            case 'findById':
                moduleServices.findById(req, res, sessions);
                break;
        }
    }
);

//DELETE:
router.post(
    '/delete',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.checkDeleteCode,
    (req, res) => { moduleServices._delete(req, res, sessions); }
);

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//