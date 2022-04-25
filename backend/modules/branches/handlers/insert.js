//--------------------------------------------------------------------------------------------------------------------//
// BRANCHES INSERT HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

//Import schemas:
const branches = require('../schemas');

module.exports = async (req, res) => {
    //Check Non-Duplicated:
    //Buscar un campo en particular (required), no repetible con findOne (parecido a referencedElements).

    //Set referenced elements (FKs):
    let referencedElements = [];
    referencedElements.push([ req.body.fk_organization, 'organizations' ]);

    //Excecute main query:
    await moduleServices.insert(req, res, branches, referencedElements);
}
//--------------------------------------------------------------------------------------------------------------------//