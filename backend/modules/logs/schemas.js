//--------------------------------------------------------------------------------------------------------------------//
// LOGS SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Define Schema:
const Schema = new mongoose.Schema({
    event:      { type: Number, required: true },
    datetime:   { type: Date, required: true },
    fk_user:    { type: mongoose.ObjectId, required: true }, //Author
    element:    { type: mongoose.ObjectId }
},
{ timestamps: false },
{ versionKey: false });

//Define model:
const Model = mongoose.model('logs', Schema, 'logs');  //Specify collection name to prevent Mongoose pluralize.
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('fk_user')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_user NO es un ID MongoDB válido.'),
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator };
//--------------------------------------------------------------------------------------------------------------------//