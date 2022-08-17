//--------------------------------------------------------------------------------------------------------------------//
// SERVICES SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Define Schema:
const Schema = new mongoose.Schema({
    fk_branch:      { type: mongoose.ObjectId, required: true },
    fk_modality:    { type: mongoose.ObjectId, required: true },
    fk_equipments:  { type: [mongoose.ObjectId], required: true },
    name:           { type: String, required: true },
    status:         { type: Boolean, required: true, default: false },
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('services', Schema, 'services');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_service',
    Plural      : 'fk_services',
    Domain      : 'domain.service',
    Imaging     : 'imaging.service',
    Referring   : 'referring.service',
    Reporting   : 'reporting.service'
};

//Register allowed unset values:
const AllowedUnsetValues = [];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('fk_branch')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_branch NO es un ID MongoDB válido.'),

    body('fk_modality')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_modality NO es un ID MongoDB válido.'),

    body('fk_equipments')
        .isArray()
        .withMessage('El parametro fk_equipments es requerido.'),

    body('fk_equipments.*')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_equipments NO es un ID MongoDB válido.'),

    body('name')
        .trim()
        .isLength({ min: 3, max: 64 })
        .withMessage('El nombre ingresado es demasiado corto o demasiado largo (min: 3, max: 64 [caracteres]).'),

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