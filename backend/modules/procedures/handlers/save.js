//--------------------------------------------------------------------------------------------------------------------//
// PROCEDURES SAVE HANDLER:
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
    referencedElements.push([ req.body.domain.organization, 'organizations' ]);
    referencedElements.push([ req.body.domain.branch, 'branches' ]);
    referencedElements.push([ req.body.fk_modality, 'modalities' ]);

    //Set referenced elements (FKs - Check existence) [Arrays of objects case]:
    for(let currentKey in req.body.equipments){
        referencedElements.push([ req.body.equipments[currentKey].fk_equipment, 'equipments' ]);
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