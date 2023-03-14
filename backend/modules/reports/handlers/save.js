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
    //Set referenced elements (FKs - Check existence):
    let referencedElements = [];
    if(req.body.fk_performing){ referencedElements.push([ req.body.fk_performing, 'performing' ]); }
        
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

    //Excecute main query:
    switch(operation){
        case 'insert':
            //Check and update performing flow_state to 'P07 - Informe borrador':
            const result = await moduleServices.performingFSController(req, 'insert_report');

            //Check result:
            if(result.success){
                //Save report data:
                await moduleServices.insert(req, res, currentSchema, referencedElements);
            } else {
                //Send error message:
                res.status(422).send({ success: false, message: result.message });
            }
                
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