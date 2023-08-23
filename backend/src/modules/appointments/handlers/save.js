//--------------------------------------------------------------------------------------------------------------------//
// APPOINTMENTS SAVE HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res, currentSchema, operation) => {
    //----------------------------------------------------------------------------------------------------------------//
    // Set referenced elements (FKs - Check existence):
    //----------------------------------------------------------------------------------------------------------------//
    let referencedElements = [];

    //Imaging
    if(req.body.imaging.organization){ referencedElements.push([ req.body.imaging.organization, 'organizations' ]); }
    if(req.body.imaging.branch){ referencedElements.push([ req.body.imaging.branch, 'branches' ]); }
    if(req.body.imaging.service){ referencedElements.push([ req.body.imaging.service, 'services' ]); }

    //Referring:
    if(req.body.referring.organization){ referencedElements.push([ req.body.referring.organization, 'organizations' ]); }
    if(req.body.referring.branch){ referencedElements.push([ req.body.referring.branch, 'branches' ]); }
    if(req.body.referring.service){ referencedElements.push([ req.body.referring.service, 'services' ]); }
    if(req.body.referring.fk_referring){ referencedElements.push([ req.body.referring.fk_referring, 'users' ]); }

    //Reporting:
    if(req.body.reporting.organization){ referencedElements.push([ req.body.reporting.organization, 'organizations' ]); }
    if(req.body.reporting.branch){ referencedElements.push([ req.body.reporting.branch, 'branches' ]); }
    if(req.body.reporting.service){ referencedElements.push([ req.body.reporting.service, 'services' ]); }
    if(req.body.reporting.fk_reporting){ referencedElements.push([ req.body.reporting.fk_reporting, 'users' ]); }

    //Schema:
    if(req.body.fk_patient){ referencedElements.push([ req.body.fk_patient, 'users' ]); }
    if(req.body.fk_slot){ referencedElements.push([ req.body.fk_slot, 'slots' ]); }
    if(req.body.fk_procedure){ referencedElements.push([ req.body.fk_procedure, 'procedures' ]); }

    //Consents:
    if(req.body.consents){
        if(req.body.consents.informed_consent){ referencedElements.push([ req.body.consents.informed_consent, 'files' ]); }
        if(req.body.consents.clinical_trial){ referencedElements.push([ req.body.consents.clinical_trial, 'files' ]); }
    }
    
    //Set referenced elements (FKs - Check existence) [Arrays case]:
    if(req.body.attached_files){
        for(let currentKey in req.body.attached_files){
            referencedElements.push([ req.body.attached_files[currentKey], 'files' ]);
        }
    }
    //----------------------------------------------------------------------------------------------------------------//

    //Check if start and end has empty (update case without date):
    let empty_datetimes = false;
    if(req.body.start == '' && req.body.end == ''){ empty_datetimes = true; }

    //Convert start and end to date formats for comparison:
    const start = new Date(req.body.start);
    const end = new Date(req.body.end);

    //Get start and end date and parse to string to comparison:
    const startStringDate = JSON.stringify(start).split('T')[0].slice(1);
    const endStringDate = JSON.stringify(end).split('T')[0].slice(1);

    //Check that start and end date are the same:
    if(startStringDate == endStringDate){
        //Check that end is greater than start:
        if(start < end || (operation == 'update' && empty_datetimes)){
            //Excecute main query:
            switch(operation){
                case 'insert':
                    //Set Study IUID:
                    const operation_status = await moduleServices.setStudyIUID(req, res);

                    //Check operation status:
                    if(operation_status){
                        //Initializate update_flow_state_result:
                        let update_flow_state_result = undefined;

                        //Check appointment request (Change appointment request flow state):
                        if(req.body.fk_appointment_request){ update_flow_state_result = await moduleServices.setFlowState(req.body.fk_appointment_request, 'AR06', 'appointment_requests'); }

                        //Check update_flow_state_result:
                        if(update_flow_state_result == undefined || update_flow_state_result == 'success'){
                            await moduleServices.insert(req, res, currentSchema, referencedElements);
                        } else {
                            //Return the result (HTML Response):
                            res.status(422).send({ success: false, message: currentLang.ris.flow_state_error, error: update_flow_state_result });
                        }
                    }
                    break;
                case 'update':
                    await moduleServices.update(req, res, currentSchema, referencedElements);
                    break;
                default:
                    res.status(500).send({ success: false, message: currentLang.db.not_allowed_save });
                    break;
            }
        } else {
            //Return the result (HTML Response):
            res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.ris.validate.start_time_lte_end_time });
        }
    } else {
        //Return the result (HTML Response):
        res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.ris.validate.same_dates });
    }
}
//--------------------------------------------------------------------------------------------------------------------//