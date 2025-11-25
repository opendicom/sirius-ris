//--------------------------------------------------------------------------------------------------------------------//
// LOGS SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Define Privileges Sub-Schema:
const subSchemaElement = new mongoose.Schema({
    type:               { type: String, required: true },
    _id:                { type: mongoose.ObjectId, required: true },
    details:            { type: String }
},
{ _id : false });

//Define Schema:
const Schema = new mongoose.Schema({
    fk_organization:    { type: mongoose.ObjectId, required: true },
    event:              { type: Number, required: true },
    datetime:           { type: Date, required: true },
    fk_user:            { type: mongoose.ObjectId, required: true }, //Author
    element:            { type: subSchemaElement },
    ip_client:          { type: String, required: true }
},
{ timestamps: false },
{ versionKey: false });

//Define model:
const Model = mongoose.model('logs', Schema, 'logs');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_log',
    Plural      : 'fk_logs'
};

//Register allowed unset values:
const AllowedUnsetValues = [];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('fk_organization')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_organization" (ObjectId).'),
        
    body('event')
        .trim()
        .isInt()
        .withMessage(currentLang.ris.schema_validator.isRequiredInt + ' | "event".'),

    body('datetime').trim(),

    body('fk_user')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_user" (ObjectId).'),

    body('element').optional(),

    body('element.type')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "element.type" (min: 3, max: 30 [chars]).'),

    body('element._id')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "element._id" (ObjectId).'),

    body('element.details')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "element.details" (min: 3, max: 30 [chars]).'),

    body('ip_client')
        .trim()
        .isIP(4)
        .withMessage(currentLang.ris.schema_validator.isIP + ' | "ip_client" (IPv4).')
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//