//--------------------------------------------------------------------------------------------------------------------//
// SERVICES SAVE HANDLER:
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
    if(req.body.fk_branch){ referencedElements.push([ req.body.fk_branch, 'branches' ]); }
    if(req.body.fk_modality){ referencedElements.push([ req.body.fk_modality, 'modalities' ]); }

    //Set referenced elements (FKs - Check existence) [Arrays case]:
    if(req.body.fk_equipments){
        for(let currentKey in req.body.fk_equipments){
            referencedElements.push([ req.body.fk_equipments[currentKey], 'equipments' ]);
        }
    }

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