//--------------------------------------------------------------------------------------------------------------------//
// APPOINTMENTS DRAFTS SAVE HANDLER:
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

    //Schema:
    if(req.body.fk_patient){ referencedElements.push([ req.body.fk_patient, 'users' ]); }
    if(req.body.fk_coordinator){ referencedElements.push([ req.body.fk_coordinator, 'users' ]); }
    if(req.body.fk_slot){ referencedElements.push([ req.body.fk_slot, 'slots' ]); }
    if(req.body.fk_procedure){ referencedElements.push([ req.body.fk_procedure, 'procedures' ]); }
    //----------------------------------------------------------------------------------------------------------------//

    //Convert start and end to date formats for comparison:
    const start = new Date(req.body.start);
    const end = new Date(req.body.end);

    //Get start and end date and parse to string to comparison:
    const startStringDate = JSON.stringify(start).split('T')[0].slice(1);
    const endStringDate = JSON.stringify(end).split('T')[0].slice(1);

    //Check that start and end date are the same:
    if(startStringDate == endStringDate){
        //Check that end is greater than start:
        if(start < end){
            //Excecute main query:
            switch(operation){
                case 'insert':
                    //Initializate update_flow_state_result:
                    let update_flow_state_result = undefined;

                    //Check appointment request (Change appointment request flow state):
                    if(req.body.fk_appointment_request){ update_flow_state_result = await moduleServices.setFlowState(req.body.fk_appointment_request, 'AR05', 'appointment_requests'); }
                    
                    //Check update_flow_state_result:
                    if(update_flow_state_result == undefined || update_flow_state_result == 'success'){
                        await moduleServices.insert(req, res, currentSchema, referencedElements);    
                    } else {
                        //Return the result (HTML Response):
                        res.status(422).send({ success: false, message: currentLang.ris.flow_state_error, error: update_flow_state_result });
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