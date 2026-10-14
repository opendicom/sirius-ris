//--------------------------------------------------------------------------------------------------------------------//
// BOARDS SCHEMA:
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
    fk_branch:      { type: mongoose.ObjectId, required: true },
    name:           { type: String, required: true },
    details:        { type: String },
    base64_screen:  { type: String },
    status:         { type: Boolean, required: true, default: false },
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('boards', Schema, 'boards');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_board',
    Plural      : 'fk_boards'
};

//Register allowed unset values:
const AllowedUnsetValues = ['details', 'base64_screen'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('fk_branch')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_branch" (ObjectId).'),

    body('name')
        .trim()
        .isLength({ min: 2, max: 32 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "name" (min: 2, max: 32 [chars]).'),

    body('details')
        .optional()
        .trim()
        .isLength({ min: 3, max: 128 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "details" (min: 3, max: 128 [chars]).'),

    body('base64_screen')
        .optional()
        .isString()
        .withMessage(currentLang.ris.schema_validator.isString + ' | "base64_screen".'),

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
