//--------------------------------------------------------------------------------------------------------------------//
// REPORTS SAVE HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res, currentSchema, operation) => {
    //Initialize duplicated control var:
    let duplicated = false;
    
    //Check duplicated if this params exists:
    if(req.body.fk_performing != ''){
        //Set params for check duplicates:
        const params = { fk_performing: req.body.fk_performing };

        //Search for duplicates:
        duplicated = await moduleServices.isDuplicated(req, res, currentSchema, params);
    }

    //Check for duplicates:
    if(duplicated == false){
        //Set referenced elements (FKs - Check existence):
        let referencedElements = [];
        if(req.body.fk_appointment){ referencedElements.push([ req.body.fk_performing, 'performing' ]); }
        
        /* TEMP DISABLED (WORK IN PROGRESS):
        //Set referenced elements (FKs - Check existence) [Arrays case]:
        if(req.body.fk_medical_signatures){
            for(let currentKey in req.body.fk_medical_signatures){
                referencedElements.push([ req.body.fk_medical_signatures[currentKey], 'signatures' ]);
            }
        }

        if(req.body.fk_pathologies){
            for(let currentKey in req.body.fk_pathologies){
                referencedElements.push([ req.body.fk_pathologies[currentKey], 'pathologies' ]);
            }
        }
        */

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
}
//--------------------------------------------------------------------------------------------------------------------//