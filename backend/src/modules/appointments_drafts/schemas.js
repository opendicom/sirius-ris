//--------------------------------------------------------------------------------------------------------------------//
// APPOINTMENTS DRAFTS SCHEMA:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

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
        .withMessage('El parametro fk_appointment_request NO es un ID MongoDB válido.'),

    //----------------------------------------------------------------------------------------------------------------//
    // IMAGING:
    //----------------------------------------------------------------------------------------------------------------//
    body('imaging.organization')
        .trim()
        .isMongoId()
        .withMessage('El parametro imaging.organization NO es un ID MongoDB válido.'),
    
    body('imaging.branch')
        .trim()
        .isMongoId()
        .withMessage('El parametro imaging.branch NO es un ID MongoDB válido.'),

    body('imaging.service')
        .trim()
        .isMongoId()
        .withMessage('El parametro imaging.service NO es un ID MongoDB válido.'),
    //----------------------------------------------------------------------------------------------------------------//
    
    body('fk_patient')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_patient NO es un ID MongoDB válido.'),

    body('fk_coordinator')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_coordinator NO es un ID MongoDB válido.'),

    body('start').trim(),

    body('end').trim(),

    body('fk_slot')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_slot NO es un ID MongoDB válido.'),

    body('fk_procedure')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_procedure NO es un ID MongoDB válido.'),

    body('extra_procedures')
        .optional()
        .isArray()
        .withMessage('El parametro extra_procedures debe ser un array.'),

    body('extra_procedures.*')
        .trim()
        .isMongoId()
        .withMessage('El parametro extra_procedures.* NO es un ID MongoDB válido.'),

    body('urgency')
        .trim()
        .isBoolean()
        .withMessage('El parametro urgency ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('friendly_pass')
        .optional(),

    body('overbooking')
        .optional()
        .trim()
        .isBoolean()
        .withMessage('El parametro overbooking ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean()
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//