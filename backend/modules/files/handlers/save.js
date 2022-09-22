//--------------------------------------------------------------------------------------------------------------------//
// FILES SAVE HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const fs = require('fs').promises;

//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res, currentSchema) => {
    //Set referenced elements (FKs - Check existence):
    let referencedElements = [];
    if(req.body.domain.organization){ referencedElements.push([ req.body.domain.organization, 'organizations' ]); }
    if(req.body.domain.branch){ referencedElements.push([ req.body.domain.branch, 'branches' ]); }

    //Encode file to base64:
    const fileBase64 = await fs.readFile('uploads/' + req.filename, { encoding: 'base64' }, (error) => {
        if(error){
            console.log(error);
            throw('Error: ' + error);
        }
    });

    //Set base64 in request for insert method:
    req.body.base64 = fileBase64;

    //Remove temp file from uploads:
    await fs.unlink('uploads/' + req.filename, (error) => {
        if(error){
            //Send ERROR Message:
            sendConsoleMessage('ERROR', error);
            throw('Error: ' + error);
        } else {
            //Send DEBUG Message:
            mainServices.sendConsoleMessage('DEBUG', currentLang.db.delete_temp_file_uploads);
        }
    });
    
    //Save in database:
    await moduleServices.insert(req, res, currentSchema, referencedElements);
}
//--------------------------------------------------------------------------------------------------------------------//