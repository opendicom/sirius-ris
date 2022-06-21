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
    referencedElements.push([ req.body.domain.organization, 'organizations' ]);
    referencedElements.push([ req.body.domain.branch, 'branches' ]);
    referencedElements.push([ req.body.domain.service, 'services' ]);
    referencedElements.push([ req.body.fk_equipment, 'equipments' ]);

    //Optional reference:
    if(req.body.fk_procedure){
        referencedElements.push([ req.body.fk_procedure, 'procedures' ]);
    }

    //Convert start and end to date formats for comparison:
    const start = new Date(req.body.start);
    const end = new Date(req.body.end);

    //Check that end is greater than start:
    if(start < end){
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
    } else {
        //Return the result (HTML Response):
        res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: 'La hora de inicio debe ser menor que la hora de fin.' });
    }
}
//--------------------------------------------------------------------------------------------------------------------//