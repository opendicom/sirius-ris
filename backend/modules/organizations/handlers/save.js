//--------------------------------------------------------------------------------------------------------------------//
// ORGANIZATIONS SAVE HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res, currentSchema, operation) => {
    //Set base64 upload file in the request:
    await moduleServices.setBase64File(req, operation, 'base64_logo');
    
    //Execute main query:
    switch(operation){
        case 'insert':
            await moduleServices.insert(req, res, currentSchema);
            break;
        case 'update':
            await moduleServices.update(req, res, currentSchema);
            break;
        default:
            res.status(500).send({ success: false, message: currentLang.db.not_allowed_save });
            break;
    }
}
//--------------------------------------------------------------------------------------------------------------------//