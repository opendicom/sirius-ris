//--------------------------------------------------------------------------------------------------------------------//
// UPDATE USER SETTINGS:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const { set } = require('mongoose');
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res) => {
    //Bad request:
    if( (req.body.max_row == undefined || req.body.max_row == '' || req.body.max_row == null) && 
        (req.body.viewer == undefined || req.body.viewer == '' || req.body.viewer == null) && 
        (req.body.language == undefined || req.body.language == '' || req.body.language == null) && 
        (req.body.theme == undefined || req.body.theme == '' || req.body.theme == null)
    ){
        res.status(400).send({ success: false, message: currentLang.http.bad_request });
    } else {
        //Save data:
        moduleServices.updateUserSettings(req, res);
    }
}
//--------------------------------------------------------------------------------------------------------------------//