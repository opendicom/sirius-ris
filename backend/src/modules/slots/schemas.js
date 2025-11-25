//--------------------------------------------------------------------------------------------------------------------//
// SLOTS SCHEMA:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Define Domain Sub-Schema:
const subSchemaDomain = new mongoose.Schema({
    organization:   { type: mongoose.ObjectId, required: true },
    branch:         { type: mongoose.ObjectId, required: true },
    service:        { type: mongoose.ObjectId, required: true },
},
{ _id : false });

//Define Schema:
const Schema = new mongoose.Schema({
    domain:         { type: subSchemaDomain, required: true },
    fk_equipment:   { type: mongoose.ObjectId, required: true },
    fk_procedure:   { type: mongoose.ObjectId },
    start:          { type: Date, required: true },
    end:            { type: Date, required: true },
    urgency:        { type: Boolean, required: true, default: false },
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('slots', Schema, 'slots');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_slot',
    Plural      : 'fk_slots'
};

//Register allowed unset values:
const AllowedUnsetValues = ['fk_procedure'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('domain.organization')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "domain.organization" (ObjectId).'),
    
    body('domain.branch')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "domain.branch" (ObjectId).'),

    body('domain.service')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "domain.service" (ObjectId).'),

    body('fk_equipment')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_equipment" (ObjectId).'),

    body('fk_procedure')
        .optional()
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_procedure" (ObjectId).'),

    body('start').trim(),

    body('end').trim(),

    body('urgency')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "urgency" (true or false).')
        .toBoolean()
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//