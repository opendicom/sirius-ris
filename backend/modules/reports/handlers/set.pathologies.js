//--------------------------------------------------------------------------------------------------------------------//
// SET PATHOLOGIES HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res, currentSchema) => {
    //Set referenced elements (FKs - Check existence):
    let referencedElements = [];
    if(req.body.fk_report){ referencedElements.push([ req.body.fk_report, 'reports' ]); }
        
    //Set referenced elements (FKs - Check existence) [Arrays case]:
    if(req.body.fk_pathologies && req.body.fk_pathologies.length > 0){
        for(let currentKey in req.body.fk_pathologies){
            referencedElements.push([ req.body.fk_pathologies[currentKey], 'pathologies' ]);
        }
    } else {
        //Set pathologies array (empty | clear pathologies case):
        req.body['fk_pathologies'] = [];
    }

    //Preserve only fk_report and fk_pathologies:
    const fk_report = req.body.fk_report;
    const fk_pathologies = [... req.body.fk_pathologies];

    //Clear request body (Prevent update other fields):
    req['body'] = {};

    //Add preserved fields:
    req.body['_id'] = fk_report;

    //Initialize validation result object (Inside the Request):
    req['validatedResult'] = {};
    req.validatedResult['set'] = {
        fk_pathologies  : fk_pathologies
    };

    //Set other validated result (does not use middleware allowedValidate):
    req.validatedResult['blocked'] = { _id: fk_report };    //Block _id to set.
    req.validatedResult['unset'] = false;                   //No unset attributes.
    req.validatedResult['blocked_unset'] = false;           //No blocked_unset attributes.

    //Save pathologies data (update report):
    await moduleServices.update(req, res, currentSchema, referencedElements);
}
//--------------------------------------------------------------------------------------------------------------------//