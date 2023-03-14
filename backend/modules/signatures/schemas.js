//--------------------------------------------------------------------------------------------------------------------//
// SIGNATURES SCHEMA:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Define Schema:
const Schema = new mongoose.Schema({
    fk_reporting:   { type: mongoose.ObjectId, required: true },
    datetime:       { type: Date, required: true },
    md5:            { type: String },   // Generated in the backend, not requested.
    backup:         { /*...*/ }
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('signatures', Schema, 'signatures');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_signature',
    Plural      : 'fk_signatures'
};

//Register allowed unset values:
const AllowedUnsetValues = [];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('fk_reporting')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_reporting NO es un ID MongoDB válido.'),

    body('datetime')
        .not()
        .isEmpty()
        .trim()
        .toDate()
        .withMessage('El parametro datetime es una fecha y no puede ser vacío [AAAA-MM-DD:HH:MM.000Z].'),
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//