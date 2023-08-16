//--------------------------------------------------------------------------------------------------------------------//
// APPOINTMENTS DRAFTS ROUTES:
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
const appointments_drafts = require('./schemas');

//Get keys from current schema:
const allSchemaKeys     = mainServices.getSchemaKeys(appointments_drafts);            //All.
const allowedSchemaKeys = mainServices.getSchemaKeys(appointments_drafts, true);      //No parameters that cannot be modified.

//Create Router.
const router = express.Router();

//Set ObjectId Regex to validate:
const regexObjectId = /^[0-9a-fA-F]{24}$/;

//Routes:
//FIND:
router.get(
    '/find',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    (req, res) => {
        //Send to handler:
        findHandler(req, res, appointments_drafts);
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
        findHandler(req, res, appointments_drafts);
    }
);

//INSERT:
router.post(
    '/insert',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    appointments_drafts.Validator,
    async (req, res) => {
        //Set params for check duplicates - The same patient on the same exact date and time (start end):
        const patientParams = { start: req.body.start, end: req.body.end, fk_patient: req.body.fk_patient };

        //Search for duplicates:
        const duplicatedPatientInDate = await moduleServices.isDuplicated(req, res, appointments_drafts, patientParams);

        //Check for duplicates (Patient in date):
        if(duplicatedPatientInDate == false){
            //Check fk_slot:
            if(req.body.fk_slot !== undefined && req.body.fk_slot !== ''){
                //Check if slot is available or not:
                const available_slot = await moduleServices.checkSlot(req, res);
                    
                if(available_slot == true){
                    //Check urgency:
                    const urgency_check = await moduleServices.checkUrgency(req, res, 'insert');

                    if(urgency_check === true){
                        //Send to handler:
                        saveHandler(req, res, appointments_drafts, 'insert');
                    }
                }
            } else {
                //Return the result (HTML Response):
                res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.ris.validate.fk_slot_required });
            }
        }
    }
);

//DELETE:
router.post(
    '/delete',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    //Disabled checkDeleteCode (all users should be able to cancel appointments in progress):
    //mainMiddlewares.checkDeleteCode,      
    (req, res) => {
        //Send to module service:
        moduleServices._delete(req, res, appointments_drafts, true, async (data) => {
            //Check appointment_draft to confirm if you have an appointment_request:
            if(data.fk_appointment_request !== undefined && data.fk_appointment_request !== null && regexObjectId.test(data.fk_appointment_request)){
                //Return the appointment_request to its original first flow state:
                await moduleServices.setFlowState(data.fk_appointment_request, 'AR01', 'appointment_requests');
            }
        });
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//