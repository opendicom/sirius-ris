//--------------------------------------------------------------------------------------------------------------------//
// LOGS SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Define Privileges Sub-Schema:
const subSchemaElement = new mongoose.Schema({
    type:      { type: Number, required: true },                // 1 user, 2 appointment, 3 study
    element:   { type: mongoose.ObjectId, required: true },
    state:     { type: Number }                                 // Only for 2 appointment and 3 study
},
{ _id : false });

//Define Schema:
const Schema = new mongoose.Schema({
    event:      { type: Number, required: true },
    datetime:   { type: Date, required: true },
    fk_user:    { type: mongoose.ObjectId, required: true }, //Author
    element:    { type: subSchemaElement }
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
module.exports = { Schema, Model, Validator, ForeignKeys };
//--------------------------------------------------------------------------------------------------------------------//