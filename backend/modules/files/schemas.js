//--------------------------------------------------------------------------------------------------------------------//
// FILES SCHEMA:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Define Domain Sub-Schema:
const subSchemaDomain = new mongoose.Schema({
    organization:   { type: mongoose.ObjectId, required: true },
    branch:         { type: mongoose.ObjectId, required: true },
},
{ _id : false });

//Define Schema:
const Schema = new mongoose.Schema({
    domain:         { type: subSchemaDomain, required: true },
    name:           { type: String, required: true },
    description:    { type: String },
    base64:         { type: String, required: true }
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('files', Schema, 'files');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_file',
    Plural      : 'fk_files'
};

//Register allowed unset values:
const AllowedUnsetValues = ['description'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('domain.organization')
        .trim()
        .isMongoId()
        .withMessage('El parametro domain.organization NO es un ID MongoDB válido.'),
    
    body('domain.branch')
        .trim()
        .isMongoId()
        .withMessage('El parametro domain.branch NO es un ID MongoDB válido.'),

    body('name')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('El nombre ingresado es demasiado corto o demasiado largo (min: 3, max: 50 [caracteres]).'),

    body('description')
        .optional()
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('El parametro description ingresado es demasiado corto o demasiado largo (min: 10, max: 500 [caracteres]).'),

    body('base64')
        .trim()
        .isLength({ min: 4 })
        .isBase64()
        .withMessage('El el atributo base64 ingresado NO es una cadena base64 válida.'),
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//