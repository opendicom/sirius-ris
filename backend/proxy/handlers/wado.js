//--------------------------------------------------------------------------------------------------------------------//
// PROXY > WADO HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const jwt       = require('jsonwebtoken');
const mongoose  = require('mongoose');

//Import app modules:
const mainServices  = require('../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                            // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);    // Language Module

module.exports = async (req, res) => {
    res.status(200).send({ test : true });
}
//--------------------------------------------------------------------------------------------------------------------//