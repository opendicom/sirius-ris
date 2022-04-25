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
    status:         { type: Boolean, default: false },
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('equipments', Schema, 'equipments');  //Specify collection name to prevent Mongoose pluralize.
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('status')
        .trim()
        .isBoolean()
        .withMessage('El estado ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean()
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator };
//--------------------------------------------------------------------------------------------------------------------//