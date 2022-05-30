//--------------------------------------------------------------------------------------------------------------------//
// SLOTS SCHEMA:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Define Schema:
const Schema = new mongoose.Schema({
    fk_service:     { type: mongoose.ObjectId, required: true },
    fk_equipment:   { type: mongoose.ObjectId, required: true },
    fk_procedure:   { type: mongoose.ObjectId },
    date:           { type: Date, required: true },
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
    body('fk_service')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_person NO es un ID MongoDB válido.'),
    
    body('fk_equipment')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_equipment NO es un ID MongoDB válido.'),

    body('fk_procedure')
        .optional()
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_procedure NO es un ID MongoDB válido.'),

    body('date').trim(),

    body('start').trim(),

    body('end').trim(),

    body('urgency')
        .trim()
        .isBoolean()
        .withMessage('El parametro urgencia ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean()
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//