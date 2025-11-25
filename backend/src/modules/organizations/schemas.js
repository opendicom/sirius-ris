//--------------------------------------------------------------------------------------------------------------------//
// ORGANIZATIONS SCHEMAS:
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
    name:           { type: String, required: true },
    short_name:     { type: String, required: true },
    OID:            { type: String },
    country_code:   { type: String, required: true },
    structure_id:   { type: String },
    suffix:         { type: String },
    status:         { type: Boolean, required: true, default: false },
    base64_logo:    { type: String }, //This parameter is created in backend server (not validate).
    base64_cert:    { type: String }, //This parameter is created in backend server (not validate).
    password_cert:  { type: String }  //This parameter is not validated since it has different characteristics.
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('organizations', Schema, 'organizations');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_organization',
    Plural      : 'fk_organizations',
    Domain      : 'domain.organization',
    Imaging     : 'imaging.organization',
    Referring   : 'referring.organization',
    Reporting   : 'reporting.organization'
};

//Register allowed unset values:
const AllowedUnsetValues = ['OID', 'structure_id', 'suffix', 'base64_logo', 'base64_cert', 'password_cert'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('name')
        .trim()
        .isLength({ min: 3, max: 64 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "name" (min: 3, max: 64 [chars]).'),

    body('short_name')
        .trim()
        .isLength({ min: 3, max: 32 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "short_name" (min: 3, max: 32 [chars]).'),

    body('OID')
        .optional()
        .trim()
        .isLength({ min: 1, max: 64 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "OID" (min: 1, max: 64 [chars]).'),

    body('country_code')
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "country_code" (min: 3, max: 3 [chars]).')
        .toLowerCase(),

    body('structure_id')
        .optional()
        .trim()
        .isLength({ min: 1, max: 64 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "structure_id" (min: 1, max: 64 [chars]).'),

    body('suffix')
        .optional()
        .trim()
        .isLength({ min: 1, max: 64 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "suffix" (min: 1, max: 64 [chars]).'),
    
    body('status')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "status" (true or false).')
        .toBoolean(),

    body('base64_logo')
        .optional(),

    body('base64_cert')
        .optional(),

    body('password_cert')
        .optional()
        .trim(),
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//