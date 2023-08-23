//--------------------------------------------------------------------------------------------------------------------//
// MODALITIES SCHEMA:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Define Schema:
const Schema = new mongoose.Schema({
    code_meaning:   { type: String, required: true },
    code_value:     { type: String, required: true },
    status:         { type: Boolean, required: true, default: false },
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('modalities', Schema, 'modalities');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_modality',
    Plural      : 'fk_modalities'
};

//Register allowed unset values:
const AllowedUnsetValues = [];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('code_meaning')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('El code meaning ingresado es demasiado corto o demasiado largo (min: 3, max: 50 [caracteres]).'),

    body('code_value')
        .trim()
        .isLength({ min: 2, max: 10 })
        .withMessage('El code value ingresado es demasiado corto o demasiado largo (min: 2, max: 10 [caracteres]).')
        .toUpperCase(),

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