//--------------------------------------------------------------------------------------------------------------------//
// PROCEDURES CATEGORIES SCHEMA:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Define Domain Sub-Schema:
const subSchemaDomain = new mongoose.Schema({
    organization:   { type: mongoose.ObjectId, required: true },
    branch:         { type: mongoose.ObjectId, required: true },
},
{ _id : false });

//Define Schema:
const Schema = new mongoose.Schema({
    domain:             { type: subSchemaDomain, required: true },    
    name:               { type: String, required: true },
    fk_procedures:      { type: [mongoose.ObjectId], required: true }
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('procedure_categories', Schema, 'procedure_categories');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_procedure_categories',
    Plural      : 'fk_procedure_categories'
};

//Register allowed unset values:
const AllowedUnsetValues = [];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('domain.organization')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "domain.organization" (ObjectId).'),
    
    body('domain.branch')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "domain.branch" (ObjectId).'),

    body('name')
        .trim()
        .isLength({ min: 3, max: 64 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "name" (min: 3, max: 64 [chars]).'),

    body('fk_procedures')
        .isArray()
        .withMessage(currentLang.ris.schema_validator.isRequired + ' | "fk_procedures" (Array).'),

    body('fk_procedures.*')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_procedures.*" (ObjectId).'),
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//