//--------------------------------------------------------------------------------------------------------------------//
// PATHOLOGIES SCHEMA:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Define Schema:
const Schema = new mongoose.Schema({
    fk_organization:    { type: mongoose.ObjectId, required: true },
    name:               { type: String, required: true },
    description:        { type: String },
    status:             { type: Boolean, required: true, default: false },
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('pathologies', Schema, 'pathologies');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_pathology',
    Plural      : 'fk_pathologies'
};

//Register allowed unset values:
const AllowedUnsetValues = ['description'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('fk_organization')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_organization" (ObjectId).'),
        
    body('name')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "name" (min: 3, max: 50 [chars]).')
        .toUpperCase(),

    body('description')
        .optional()
        .trim()
        .isLength({ min: 2, max: 1000 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "description" (min: 2, max: 1000 [chars]).'),
        
    body('status')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "status" (true or false).')
        .toBoolean()
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//