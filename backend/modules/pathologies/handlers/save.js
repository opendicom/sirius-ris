//--------------------------------------------------------------------------------------------------------------------//
// PATHOLOGIES SAVE HANDLER:
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
    if(req.body.fk_organization){ referencedElements.push([ req.body.fk_organization, 'organizations' ]); }

    //Search for duplicates:
    const duplicated = await moduleServices.checkPathology(req, res, operation);

    //Check for duplicates:
    if(duplicated == false){
        //Excecute main query:
        switch(operation){
            case 'insert':
                await moduleServices.insert(req, res, currentSchema, referencedElements);
                
                break;
            case 'update':
                //Data normalization - toUpperCase for pathology name:
                //Fix allowedValidate case: NO Data normalization because body is cloned in set object.
                if(req.validatedResult.set.name !== undefined && req.validatedResult.set.name !== ''){ req.validatedResult.set.name = req.validatedResult.set.name.toUpperCase(); }

                //Save data
                await moduleServices.update(req, res, currentSchema, referencedElements);
                
                break;
            default:
                res.status(500).send({ success: false, message: currentLang.db.not_allowed_save });
                break;
        }
    }
}
//--------------------------------------------------------------------------------------------------------------------//