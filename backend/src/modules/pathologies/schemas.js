//--------------------------------------------------------------------------------------------------------------------//
// PATHOLOGIES SCHEMA:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Define Schema:
const Schema = new mongoose.Schema({
    fk_organization:    { type: mongoose.ObjectId, required: true },
    name:               { type: String, required: true },
    description:        { type: String },
    status:             { type: Boolean, required: true, default: false },
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('pathologies', Schema, 'pathologies');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_pathology',
    Plural      : 'fk_pathologies'
};

//Register allowed unset values:
const AllowedUnsetValues = ['description'];
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
        .isLength({ min: 3, max: 50 })
        .withMessage('El parametro name ingresado es demasiado corto o demasiado largo (min: 3, max: 50 [caracteres]).')
        .toUpperCase(),

    body('description')
        .optional()
        .trim()
        .isLength({ min: 2, max: 1000 })
        .withMessage('El parametro description ingresado es demasiado corto o demasiado largo (min: 2, max: 1000 [caracteres]).'),
        
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