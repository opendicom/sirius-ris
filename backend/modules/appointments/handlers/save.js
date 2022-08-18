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
    if(req.body.consents.informed_consent){ referencedElements.push([ req.body.consents.informed_consent, 'files' ]); }
    if(req.body.consents.clinical_trial){ referencedElements.push([ req.body.consents.clinical_trial, 'files' ]); }

    //Set referenced elements (FKs - Check existence) [Arrays case]:
    if(req.body.attached_files){
        for(let currentKey in req.body.attached_files){
            referencedElements.push([ req.body.attached_files[currentKey], 'files' ]);
        }
    }
    //----------------------------------------------------------------------------------------------------------------//

    //Excecute main query:
    switch(operation){
        case 'insert':
            await moduleServices.insert(req, res, currentSchema, referencedElements);
            break;
        case 'update':
            await moduleServices.update(req, res, currentSchema, referencedElements);
            break;
        default:
            res.status(500).send({ success: false, message: currentLang.db.not_allowed_save });
            break;
    }
}
//--------------------------------------------------------------------------------------------------------------------//