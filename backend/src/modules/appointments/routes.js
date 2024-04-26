//--------------------------------------------------------------------------------------------------------------------//
// APPOINTMENTS ROUTES:
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
const findHandler           = require('./handlers/find');
const saveHandler           = require('./handlers/save');

//Import Module Services:
const moduleServices = require('../modules.services');

//Import schemas:
const appointments = require('./schemas');

//Get keys from current schema:
const allSchemaKeys     = mainServices.getSchemaKeys(appointments);            //All.
const allowedSchemaKeys = mainServices.getSchemaKeys(appointments, true);      //No parameters that cannot be modified.

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
        findHandler(req, res, appointments);
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
        findHandler(req, res, appointments);
    }
);

//INSERT:
router.post(
    '/insert',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    appointments.Validator,
    async (req, res) => {
        //Set params for check duplicates:
        const params = { start: req.body.start, end: req.body.end, fk_patient: req.body.fk_patient, flow_state: 'A01' };

        //Search for duplicates:
        const duplicated = await moduleServices.isDuplicated(req, res, appointments, params);

        //Check for duplicates:
        if(duplicated == false){
            //Check fk_slot:
            if(req.body.fk_slot !== undefined && req.body.fk_slot !== ''){
                //Check if slot is available or not:
                const available_slot = await moduleServices.checkSlot(req, res);
                
                if(available_slot == true){
                    //Check urgency:
                    const urgency_check = await moduleServices.checkUrgency(req, res, 'insert');

                    if(urgency_check === true){
                        //Send to handler:
                        saveHandler(req, res, appointments, 'insert');
                    }
                }
            } else {
                //Return the result (HTML Response):
                res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.ris.validate.fk_slot_required });
            }
        }
    }
);

//UPDATE:
router.post(
    '/update',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    mainMiddlewares.allowedValidate(allowedSchemaKeys, appointments.AllowedUnsetValues),
    appointments.Validator,
    async (req, res) => {
        //Initialize duplicated control var:
        let duplicated = false;

        //Check duplicated if this params exists:
        if(req.body.start != '' && req.body.end != '' && req.body.fk_patient != ''){
            //Set params for check duplicates:
            const params = { start: req.body.start, end: req.body.end, fk_patient: req.body.fk_patient, flow_state: 'A01' };

            //Search for duplicates:
            duplicated = await moduleServices.isDuplicated(req, res, appointments, params);
        }

        //Check for duplicates:
        if(duplicated == false){
            //Initializate available_slot and urgency_check:
            let available_slot = true;
            let urgency_check = true;

            //Check Slot:
            if(req.body.fk_slot != ''){
                //Check if slot is available or not:
                available_slot = await moduleServices.checkSlot(req, res);
            }

            //Check Urgency:
            if(req.body.urgency != ''){
                urgency_check = await moduleServices.checkUrgency(req, res, 'update');
            }

            //Check urgency and slot (Empty or not):
            if(urgency_check === true && available_slot === true){
                //Send to handler:
                saveHandler(req, res, appointments, 'update');
            }
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
        moduleServices._delete(req, res, appointments);
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//