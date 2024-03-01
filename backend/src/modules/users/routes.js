//--------------------------------------------------------------------------------------------------------------------//
// USERS ROUTES:
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
const findHandler = require('./handlers/find');
const findByServiceHandler = require('./handlers/findByService');
const findByRoleInReportHandler = require('./handlers/findByRoleInReport');

//Import Module Services:
const moduleServices = require('../modules.services');

//Import schemas:
const users = require('./schemas');

//Get keys from current schema:
const allSchemaKeys     = mainServices.getSchemaKeys(users);            //All.
const allowedSchemaKeys = mainServices.getSchemaKeys(users, true);      //No parameters that cannot be modified.

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
        findHandler(req, res, users);
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
        findHandler(req, res, users);
    }
);

//FIND BY ROLE IN REPORT:
router.get(
    '/findByRoleInReport',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    (req, res) => {
        //Send to handler:
        findByRoleInReportHandler(req, res, users);
    }
);

//FIND BY SERVICE:
router.get(
    '/findByService',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    (req, res) => {
        //Send to handler:
        findByServiceHandler(req, res, users);
    }
);

//INSERT:
router.post(
    '/insert',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    users.Validator,
    async (req, res) => {
        //Initialize variables for duplicate checking:
        //let fk_person   = false; (Desactivated for Multiple users)
        let username    = false;

        //Initializate person exist:
        let personCheck = true;

        //Validate particular case of permissions (inserts only):
        if(await moduleServices.validatePermissions(req)){
            //Human user:
            if(req.body.fk_person){
                //Check if referenced person exist in DB (fk_person [users] -> _id [people]):
                personCheck = await moduleServices.ckeckElement(req.body.fk_person, 'people', res);
            
            //Machine user:
            } else if(req.body.username) {
                //Search for duplicates:
                username = await moduleServices.isDuplicated(req, res, users, { username: req.body.username });

            //Bad request:
            } else {
                res.status(400).send({ success: false, message: currentLang.http.bad_request });
            }

            //Check for duplicates:
            //fk_person == false (Desactivated for Multiple users)
            if(username == false && personCheck == true){
                //Save data:
                moduleServices.insert(req, res, users);
            }
        } else {
            //Return the result (HTML Response):
            res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.ris.validate.valid_permission });
        }
    }
);

//UPDATE:
router.post(
    '/update',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.allowedValidate(allowedSchemaKeys, users.AllowedUnsetValues),
    users.Validator,
    async (req, res) => {
        //Initialize variables for duplicate checking:
        let username    = false;

        //Initializate person check:
        let personCheck = true;
        
        //Human user:
        if(req.body.fk_person){
            //Check if referenced person exist in DB (fk_person [users] -> _id [people]):
            personCheck = await moduleServices.ckeckElement(req.body.fk_person, 'people', res);
        
        //Machine user:
        } else if(req.body.username) {
            //Search for duplicates:
            username = await moduleServices.isDuplicated(req, res, users, { username: req.body.username });

        //Bad request:
        } else if(req.body._id == undefined || req.body._id == '' || req.body._id == null) {
            res.status(400).send({ success: false, message: currentLang.http.bad_request });
        }

        //Check for duplicates:
        if(username == false && personCheck == true){
            //Save data:
            moduleServices.update(req, res, users);
        }
    }
);

//DELETE:
router.post(
    '/delete',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.checkDeleteCode,
    (req, res) => {
        //Send to module service:
        moduleServices._delete(req, res, users);
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//