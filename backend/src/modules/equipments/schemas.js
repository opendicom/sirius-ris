//--------------------------------------------------------------------------------------------------------------------//
// EQUIPMENTS SCHEMA:
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
    fk_modalities:  { type: [mongoose.ObjectId], required: true },
    fk_branch:      { type: mongoose.ObjectId, required: true },
    name:           { type: String, required: true },
    serial_number:  { type: String },
    AET:            { type: String },
    status:         { type: Boolean, required: true, default: false },
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('equipments', Schema, 'equipments');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_equipment',
    Plural      : 'fk_equipments'
};

//Register allowed unset values:
const AllowedUnsetValues = ['serial_number', 'AET'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('fk_modalities')
        .isArray()
        .withMessage(currentLang.ris.schema_validator.isRequired + ' | "fk_modalities" (Array).'),

    body('fk_modalities.*')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_modalities.*" (ObjectId).'),

    body('fk_branch')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_branch" (ObjectId).'),

    body('name')
        .trim()
        .isLength({ min: 3, max: 64 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "name" (min: 3, max: 64 [chars]).'),
    
    body('serial_number')
        .optional()
        .trim()
        .isLength({ min: 3, max: 64 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "serial_number" (min: 3, max: 64 [chars]).'),

    body('AET')
        .optional()
        .trim()
        .isLength({ min: 3, max: 32 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "AET" (min: 3, max: 32 [chars]).'),

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