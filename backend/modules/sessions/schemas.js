//--------------------------------------------------------------------------------------------------------------------//
// SESSIONS SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Define Current Access Sub-Schema:
const subSchemaCurrentAccess = new mongoose.Schema({
    domain:         { type: mongoose.ObjectId, required: true },
    role:           { type: Number, required: true },
    concession:     { type: [Number] }
},
{ _id : false });

//Define Schema:
const Schema = new mongoose.Schema({
    start:              { type: Date, required: true },
    fk_user:            { type: mongoose.ObjectId, required: true },
    current_access:     { type: subSchemaCurrentAccess, required: true }
},
{ timestamps: false },
{ versionKey: false });

//Define model:
const Model = mongoose.model('sessions', Schema, 'sessions');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_session',
    Plural      : 'fk_sessions'
};

//Register allowed unset values:
const AllowedUnsetValues = [];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('start').trim(),

    body('fk_user')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_user NO es un ID MongoDB válido.'),

    body('current_access.domain')
        .trim()
        .isMongoId()
        .withMessage('El parametro domain NO es un ID MongoDB válido.'),

    body('current_access.role')
        .trim()
        .isInt()
        .withMessage('El parametro role es requerido y debe ser numérico.'),

    body('current_access.concession').optional().isArray(),
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//