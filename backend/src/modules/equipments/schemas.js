//--------------------------------------------------------------------------------------------------------------------//
// EQUIPMENTS SCHEMA:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

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
        .withMessage('El parametro fk_modalities es requerido.'),

    body('fk_modalities.*')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_modalities NO es un ID MongoDB válido.'),

    body('fk_branch')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_branch NO es un ID MongoDB válido.'),

    body('name')
        .trim()
        .isLength({ min: 3, max: 64 })
        .withMessage('El nombre ingresado es demasiado corto o demasiado largo (min: 3, max: 64 [caracteres]).'),
    
    body('serial_number')
        .optional()
        .trim()
        .isLength({ min: 3, max: 64 })
        .withMessage('El serial_number ingresado es demasiado corto o demasiado largo (min: 3, max: 64 [caracteres]).'),

    body('AET')
        .optional()
        .trim()
        .isLength({ min: 3, max: 32 })
        .withMessage('El AET ingresado es demasiado corto o demasiado largo (min: 3, max: 32 [caracteres]).'),

    body('status')
        .trim()
        .isBoolean()
        .withMessage('El estado ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean()
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//