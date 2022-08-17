//--------------------------------------------------------------------------------------------------------------------//
// BRANCHES SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Define Schema:
const Schema = new mongoose.Schema({
    fk_organization:    { type: mongoose.ObjectId, required: true },
    name:               { type: String, required: true },
    short_name:         { type: String, required: true },
    OID:                { type: String },
    status:             { type: Boolean, required: true, default: false },
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('branches', Schema, 'branches');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_branch',
    Plural      : 'fk_branches',
    Domain      : 'domain.branch',
    Imaging     : 'imaging.branch',
    Referring   : 'referring.branch',
    Reporting   : 'reporting.branch'
};

//Register allowed unset values:
const AllowedUnsetValues = ['OID'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('fk_organization')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_organization NO es un ID MongoDB válido.'),

    body('name')
        .trim()
        .isLength({ min: 3, max: 64 })
        .withMessage('El nombre ingresado es demasiado corto o demasiado largo (min: 3, max: 64 [caracteres]).'),

    body('short_name')
        .trim()
        .isLength({ min: 3, max: 32 })
        .withMessage('El primer nombre corto ingresado es demasiado corto o demasiado largo (min: 3, max: 32 [caracteres]).'),

    body('OID')
        .optional()
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
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//