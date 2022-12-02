//--------------------------------------------------------------------------------------------------------------------//
// SLOTS SAVE HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res, currentSchema, operation) => {
    //Set referenced elements (FKs - Check existence):
    let referencedElements = [];
    if(req.body.domain.organization){ referencedElements.push([ req.body.domain.organization, 'organizations' ]); }
    if(req.body.domain.branch){ referencedElements.push([ req.body.domain.branch, 'branches' ]); }
    if(req.body.domain.service){ referencedElements.push([ req.body.domain.service, 'services' ]); }
    if(req.body.fk_equipment){ referencedElements.push([ req.body.fk_equipment, 'equipments' ]); }
    if(req.body.fk_procedure){ referencedElements.push([ req.body.fk_procedure, 'procedures' ]); } //Optional in schema

    //Convert start and end to date formats for comparison:
    const start = new Date(req.body.start);
    const end = new Date(req.body.end);

    //Get start and end date and parse to string to comparison:
    const startStringDate = JSON.stringify(start).split('T')[0].slice(1);
    const endStringDate = JSON.stringify(end).split('T')[0].slice(1);

    //Check if is update without editing dates:
    if(operation == 'update' && (req.body.start == '' || req.body.start == undefined || req.body.start == null || req.body.end == '' || req.body.end == undefined || req.body.end == null)){
        await moduleServices.update(req, res, currentSchema, referencedElements);
        
    //Check that start and end date are the same:
    } else if(startStringDate == endStringDate){
        //Check that end is greater than start:
        if(start < end){
            //Excecute main query:
            switch(operation){
                case 'insert':
                    //Check that the request has a domain:
                    if(req.body.domain){
                        await moduleServices.insert(req, res, currentSchema, referencedElements);
                    } else {
                        //Bad request:
                        res.status(400).send({ success: false, message: currentLang.http.bad_request });
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