//--------------------------------------------------------------------------------------------------------------------//
// PEOPLE SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Define Documents Sub-Schema:
const subSchemaDocuments = new mongoose.Schema({
    doc_country_code:   { type: String, required: true }, // ¯¯¯|
    doc_type:           { type: Number, required: true }, //    |--> user_id
    document:           { type: String, required: true }, // ___|
},
{ _id : false });

//Define Schema:
const Schema = new mongoose.Schema({
    documents:          { type: [subSchemaDocuments] },
    name_01:            { type: String, required: true },
    name_02:            { type: String },
    surname_01:         { type: String, required: true },
    surname_02:         { type: String },
    birth_date:         { type: Date, required: true },
    gender:             { type: Number, required: true },
    phone_numbers:      { type: [String] },
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('people', Schema, 'people'); //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_person',
    Plural      : 'fk_people'
};

//Register allowed unset values:
const AllowedUnsetValues = ['name_02', 'surname_02', 'phone_numbers'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    //Validate subSchema:
    body('documents').isArray(),

    body('documents.*.doc_country_code')
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "documents.*.doc_country_code" (min: 3, max: 3 [chars]).')
        .toLowerCase(),

    body('documents.*.doc_type')
        .trim()
        .isInt()
        .withMessage(currentLang.ris.schema_validator.isRequiredInt + ' | "documents.*.doc_type".'),

    body('documents.*.document')
        .trim()
        .isLength({ min: 3, max: 25 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "documents.*.document" (min: 3, max: 25 [chars]).')
        .toUpperCase(),

    //Validate Schema:
    body('name_01')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "name_01" (min: 3, max: 30 [chars]).')
        .toUpperCase(),

    body('name_02')
        .trim()
        .optional()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "name_02" (min: 3, max: 30 [chars]).')
        .toUpperCase(),

    body('surname_01')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "surname_01" (min: 3, max: 30 [chars]).')
        .toUpperCase(),

    body('surname_02')
        .trim()
        .optional()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "surname_02" (min: 3, max: 30 [chars]).')
        .toUpperCase(),

    body('birth_date').trim(),

    body('gender')
        .trim()
        .isInt()
        .withMessage(currentLang.ris.schema_validator.isRequiredInt + ' | "gender".'),

    body('phone_numbers').optional().isArray(),

    body('phone_numbers.*')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "phone_numbers.*" (min: 3, max: 20 [chars]).')
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//