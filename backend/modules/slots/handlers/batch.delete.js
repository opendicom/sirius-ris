//--------------------------------------------------------------------------------------------------------------------//
// SLOTS BATCH DELETE HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res, currentSchema) => {
    //Remove duplicates from an array:
    const toDelete = [...new Set(req.body._id)];

    //Check that there is at least one _id in the request:
    if(toDelete.length > 0){
        //Set header sent (First time):
        res.headerSent = false;

        //Loop through an id:
        for(let key in toDelete){
            //Set current _id into the request (prepare delete):
            req.body._id = toDelete[key];

            //Check if header have already been sent (Posibly validation errors):
            if(res.headerSent == false){
                //Send to module service:
                await moduleServices._delete(req, res, currentSchema, false);
            }
        }
        
        //Check if header have already been sent (Posibly validation errors):
        if(res.headerSent == false){
            //Send successfully response:
            res.status(200).send({ success: true, message: 'Turnos eliminados correctamente.' });
        }
    } else {
        //Return the result (HTML Response):
        res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: 'Debe especificar al menos un _id para la eliminación.' });
    }
}
//--------------------------------------------------------------------------------------------------------------------//