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
    if(req.body.domain.organization){ referencedElements.push([ req.body.domain.organization, 'organizations' ]); }
    if(req.body.domain.branch){ referencedElements.push([ req.body.domain.branch, 'branches' ]); }
    if(req.body.fk_modality){ referencedElements.push([ req.body.fk_modality, 'modalities' ]); }

    //Set referenced elements (FKs - Check existence) [Arrays of objects case]:
    if(req.body.equipments){
        for(let currentKey in req.body.equipments){
            referencedElements.push([ req.body.equipments[currentKey].fk_equipment, 'equipments' ]);
        }
    }

    //Excecute main query:
    switch(operation){
        case 'insert':
            //Check if is PET-CT procedure:
            if(await moduleServices.isPET(req.body.fk_modality)){
                //Require coefficient in PET-CT Procedures:
                if(req.body.coefficient !== '' && req.body.coefficient !== undefined && req.body.coefficient !== null){
                    //Replace commas with dots:
                    req.body.coefficient = req.body.coefficient.replace(',', '.');

                    //Check that the entered coefficient is numeric:
                    if(isNaN(req.body.coefficient)){
                        //Return the result (HTML Response):
                        res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.ris.validate.pet_coef_NaN });
                    } else {
                        //Save PET-CT procedure:
                        await moduleServices.insert(req, res, currentSchema, referencedElements);
                    }

                } else {
                    //Return the result (HTML Response):
                    res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.ris.validate.pet_coef_required });
                }
            } else {
                //Save others procedures:
                await moduleServices.insert(req, res, currentSchema, referencedElements);
            }
            
            break;
        case 'update':
            //Check and normalize coefficient in PET-CT cases:
            if(req.body.coefficient !== '' && req.body.coefficient !== undefined && req.body.coefficient !== null){
                //Replace commas with dots:
                req.body.coefficient = req.body.coefficient.replace(',', '.');

                //Check that the entered coefficient is numeric:
                if(isNaN(req.body.coefficient)){
                    //Return the result (HTML Response):
                    res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.ris.validate.pet_coef_NaN });
                } else {
                    //Update PET-CT procedure:
                    await moduleServices.update(req, res, currentSchema, referencedElements);
                }
            } else {
                //Update others procedures:
                await moduleServices.update(req, res, currentSchema, referencedElements);
            }

            break;
        default:
            res.status(500).send({ success: false, message: currentLang.db.not_allowed_save });
            break;
    }
}
//--------------------------------------------------------------------------------------------------------------------//

