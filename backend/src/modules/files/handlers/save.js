//--------------------------------------------------------------------------------------------------------------------//
// FILES SAVE HANDLER:
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
    if(req.body.domain.organization){ referencedElements.push([ req.body.domain.organization, 'organizations' ]); }
    if(req.body.domain.branch){ referencedElements.push([ req.body.domain.branch, 'branches' ]); }

    //Set base64 upload file in the request:
    await moduleServices.setBase64Files(req, 'insert');
    
    //Save in database:
    await moduleServices.insert(req, res, currentSchema, referencedElements);
}
//--------------------------------------------------------------------------------------------------------------------//