//--------------------------------------------------------------------------------------------------------------------//
// PERFORMING FAST INSERT HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res) => {
    console.log('\n[ TEST ]:');
    console.log(req.body);
    res.status(200).send({ test: true, req: req.body });
}
//--------------------------------------------------------------------------------------------------------------------//