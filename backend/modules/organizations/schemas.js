//--------------------------------------------------------------------------------------------------------------------//
// ORGANIZATIONS SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Define Schema:
const Schema = new mongoose.Schema({
    name:           { type: String, required: true },
    short_name:     { type: String, required: true },
    OID:            { type: String, required: true },
    status:         { type: Boolean, default: false },
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('organizations', Schema, 'organizations');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RISjs logic):
const ForeignKeys = {
    Singular    : 'fk_organization',
    Plural      : 'fk_organizations'
};
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('name')
        .trim()
        .isLength({ min: 3, max: 64 })
        .withMessage('El nombre ingresado es demasiado corto o demasiado largo (min: 3, max: 64 [caracteres]).'),

    body('short_name')
        .trim()
        .isLength({ min: 3, max: 32 })
        .withMessage('El nombre corto ingresado es demasiado corto o demasiado largo (min: 3, max: 32 [caracteres]).'),

    body('OID')
        .trim()
        .isLength({ min: 1, max: 64 })
        .withMessage('El OID ingresado es demasiado corto o demasiado largo (min: 3, max: 64 [caracteres]).'),
    
    body('status')
        .trim()
        .isBoolean()
        .withMessage('El estado ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean()
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys };
//--------------------------------------------------------------------------------------------------------------------//