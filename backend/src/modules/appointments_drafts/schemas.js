//--------------------------------------------------------------------------------------------------------------------//
// APPOINTMENTS DRAFTS SCHEMA:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Define Imaging Sub-Schema:
const subSchemaImaging = new mongoose.Schema({
    organization:   { type: mongoose.ObjectId, required: true },
    branch:         { type: mongoose.ObjectId, required: true },
    service:        { type: mongoose.ObjectId, required: true }
},
{ _id : false });

//Define Schema:
const Schema = new mongoose.Schema({
    fk_appointment_request: { type: mongoose.ObjectId },
    imaging:                { type: subSchemaImaging, required: true },
    fk_patient:             { type: mongoose.ObjectId, required: true },
    fk_coordinator:         { type: mongoose.ObjectId, required: true },
    start:                  { type: Date, required: true },
    end:                    { type: Date, required: true },
    fk_slot:                { type: mongoose.ObjectId, required: true },
    fk_procedure:           { type: mongoose.ObjectId, required: true },
    extra_procedures:       { type: [mongoose.ObjectId] },
    urgency:                { type: Boolean, required: true },
    friendly_pass:          { type: String },
    overbooking:            { type: Boolean }
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('appointments_drafts', Schema, 'appointments_drafts');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_appointment_draft',
    Plural      : 'fk_appointments_drafts'
};

//Register allowed unset values:
const AllowedUnsetValues = ['fk_appointment_request', 'extra_procedures'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('fk_appointment_request')
        .optional()
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_appointment_request" (ObjectId).'),

    //----------------------------------------------------------------------------------------------------------------//
    // IMAGING:
    //----------------------------------------------------------------------------------------------------------------//
    body('imaging.organization')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "imaging.organization" (ObjectId).'),
    
    body('imaging.branch')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "imaging.branch" (ObjectId).'),

    body('imaging.service')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "imaging.service" (ObjectId).'),
    //----------------------------------------------------------------------------------------------------------------//
    
    body('fk_patient')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_patient" (ObjectId).'),

    body('fk_coordinator')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_coordinator" (ObjectId).'),

    body('start').trim(),

    body('end').trim(),

    body('fk_slot')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_slot" (ObjectId).'),

    body('fk_procedure')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_procedure" (ObjectId).'),

    body('extra_procedures')
        .optional()
        .isArray()
        .withMessage(currentLang.ris.schema_validator.isArray + ' | "extra_procedures" (Array).'),

    body('extra_procedures.*')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "extra_procedures.*" (ObjectId).'),

    body('urgency')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "urgency" (true or false).')
        .toBoolean(),

    body('friendly_pass')
        .optional(),

    body('overbooking')
        .optional()
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "overbooking" (true or false).')
        .toBoolean()
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//