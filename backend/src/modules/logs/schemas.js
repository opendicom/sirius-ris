//--------------------------------------------------------------------------------------------------------------------//
// LOGS SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Define Privileges Sub-Schema:
const subSchemaElement = new mongoose.Schema({
    type:               { type: String, required: true },
    _id:                { type: mongoose.ObjectId, required: true },
    details:            { type: String }
},
{ _id : false });

//Define Schema:
const Schema = new mongoose.Schema({
    fk_organization:    { type: mongoose.ObjectId, required: true },
    event:              { type: Number, required: true },
    datetime:           { type: Date, required: true },
    fk_user:            { type: mongoose.ObjectId, required: true }, //Author
    element:            { type: subSchemaElement },
    ip_client:          { type: String, required: true }
},
{ timestamps: false },
{ versionKey: false });

//Define model:
const Model = mongoose.model('logs', Schema, 'logs');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_log',
    Plural      : 'fk_logs'
};

//Register allowed unset values:
const AllowedUnsetValues = [];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('fk_organization')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_organization NO es un ID MongoDB válido.'),
        
    body('event')
        .trim()
        .isInt()
        .withMessage('El parametro event es requerido y debe ser numérico.'),

    body('datetime').trim(),

    body('fk_user')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_user NO es un ID MongoDB válido.'),

    body('element').optional(),

    body('element.type')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El parametro element.type es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).'),

    body('element._id')
        .trim()
        .isMongoId()
        .withMessage('El parametro element._id NO es un ID MongoDB válido.'),

    body('element.details')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El parametro element.details es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).'),

    body('ip_client')
        .trim()
        .isIP(4)
        .withMessage('El parametro ip_client debe ser una IP válida.'),
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//