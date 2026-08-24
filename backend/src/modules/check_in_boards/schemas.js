//--------------------------------------------------------------------------------------------------------------------//
// CHECK_IN_BOARDS SCHEMA:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Define Schema:
const Schema = new mongoose.Schema({
    date:           { type: Date, required: true },
    fk_patient:     { type: mongoose.ObjectId, required: true },
    fk_board:       { type: mongoose.ObjectId, required: true },
    room_place:     { type: String },
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('check_in_boards', Schema, 'check_in_boards');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_check_in_board',
    Plural      : 'fk_check_in_boards'
};

//Register allowed unset values:
const AllowedUnsetValues = ['room_place'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('date').trim(),

    body('fk_patient')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_patient" (ObjectId).'),

    body('fk_board')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_board" (ObjectId).'),

    body('room_place')
        .optional()
        .trim()
        .isLength({ min: 1, max: 64 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "room_place" (min: 1, max: 64 [chars]).'),
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//
