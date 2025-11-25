//--------------------------------------------------------------------------------------------------------------------//
// SESSIONS SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Define Current Access Sub-Schema:
const subSchemaCurrentAccess = new mongoose.Schema({
    domain:         { type: mongoose.ObjectId, required: true },
    role:           { type: Number, required: true },
    concession:     { type: [Number] }
},
{ _id : false });

//Define Schema:
const Schema = new mongoose.Schema({
    start:              { type: Date, required: true },
    fk_user:            { type: mongoose.ObjectId, required: true },
    current_access:     { type: subSchemaCurrentAccess, required: true }
},
{ timestamps: false },
{ versionKey: false });

//Define model:
const Model = mongoose.model('sessions', Schema, 'sessions');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_session',
    Plural      : 'fk_sessions'
};

//Register allowed unset values:
const AllowedUnsetValues = [];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('start').trim(),

    body('fk_user')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_user" (ObjectId).'),

    body('current_access.domain')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "current_access.domain" (ObjectId).'),

    body('current_access.role')
        .trim()
        .isInt()
        .withMessage(currentLang.ris.schema_validator.isRequiredInt + ' | "current_access.role".'),

    body('current_access.concession').optional().isArray(),
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//