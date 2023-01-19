//--------------------------------------------------------------------------------------------------------------------//
// PERFORMING SAVE HANDLER:
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
    if(req.body.fk_appointment != ''){
        //Set params for check duplicates:
        const params = { fk_appointment: req.body.fk_appointment };

        //Search for duplicates:
        duplicated = await moduleServices.isDuplicated(req, res, currentSchema, params);
    }

    //Check for duplicates:
    if(duplicated == false){
        //Set referenced elements (FKs - Check existence):
        let referencedElements = [];
        if(req.body.fk_appointment){ referencedElements.push([ req.body.fk_appointment, 'appointments' ]); }
        if(req.body.fk_equipment){ referencedElements.push([ req.body.fk_equipment, 'equipments' ]); }
        if(req.body.fk_procedure){ referencedElements.push([ req.body.fk_procedure, 'procedures' ]); }

        //Nested references:
        if(req.body.injection){
            if(req.body.injection.injection_technician){ referencedElements.push([ req.body.injection.injection_technician, 'users' ]); }    
        }

        if(req.body.acquisition){
            if(req.body.acquisition.console_technician){ referencedElements.push([ req.body.acquisition.console_technician, 'users' ]); }    
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
}
//--------------------------------------------------------------------------------------------------------------------//