//--------------------------------------------------------------------------------------------------------------------//
// PROCEDURES SCHEMA:
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

//Define Allowed Equipments Sub-Schema:
const subSchemaAllowedEquipments = new mongoose.Schema({
    fk_equipment:   { type: mongoose.ObjectId, required: true },
    duration:       { type: Number, required: true },
},
{ _id : false });

//Define Schema:
const Schema = new mongoose.Schema({
    domain:             { type: subSchemaDomain, required: true },
    fk_modality:        { type: mongoose.ObjectId, required: true },
    name:               { type: String, required: true },
    code:               { type: String },
    snomed:             { type: String },
    equipments:         { type: [subSchemaAllowedEquipments], required: true },
    preparation:        { type: String },
    procedure_template: { type: String },
    report_template:    { type: String },
    has_interview:      { type: Boolean, required: true },
    informed_consent:   { type: Boolean, required: true },
    status:             { type: Boolean, required: true, default: false },
    coefficient:        { type: Number },
    reporting_delay:    { type: Number },
    wait_time:          { type: Number }
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('procedures', Schema, 'procedures');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_procedure',
    Plural      : 'fk_procedures',
    Extra       : 'extra_procedures'
};

//Register allowed unset values:
const AllowedUnsetValues = [
    'code',
    'snomed',
    'preparation',
    'procedure_template',
    'report_template',
    'coefficient',
    'reporting_delay',
    'wait_time'
];
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

    body('fk_modality')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_modality" (ObjectId).'),

    body('name')
        .trim()
        .isLength({ min: 3, max: 70 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "name" (min: 3, max: 70 [chars]).'),

    body('code')
        .optional()
        .trim()
        .isLength({ min: 3, max: 40 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "code" (min: 3, max: 40 [chars]).'),

    body('snomed')
        .optional()
        .trim()
        .isLength({ min: 3, max: 40 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "snomed" (min: 3, max: 40 [chars]).'),

    body('equipments')
        .isArray()
        .withMessage(currentLang.ris.schema_validator.isRequired + ' | "equipments" (Array).'),

    body('equipments.*.fk_equipment')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "equipments.*.fk_equipment" (ObjectId).'),

    body('equipments.*.duration')
        .trim()
        .isInt()
        .withMessage(currentLang.ris.schema_validator.isRequiredInt + ' | "equipments.*.duration" (minutes).'),

    body('preparation')
        .optional()
        .trim()
        .isLength({ min: 10, max: 3000 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "preparation" (min: 10, max: 3000 [chars]).'),

    body('procedure_template')
        .optional()
        .trim()
        .isLength({ min: 10, max: 3000 })
        .withMessage('El parametro procedure_template ingresado es demasiado corto o demasiado largo (min: 10, max: 3000 [caracteres]).'),

    body('report_template')
        .optional()
        .trim()
        .isLength({ min: 10, max: 3000 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "report_template" (min: 10, max: 3000 [chars]).'),

    body('informed_consent')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "informed_consent" (true or false).')
        .toBoolean(),

    body('has_interview')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "has_interview" (true or false).')
        .toBoolean(),

    body('status')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "status" (true or false).')
        .toBoolean(),
    
    body('coefficient')
        .optional()
        .trim()
        .isDecimal()
        .withMessage(currentLang.ris.schema_validator.isDecimal + ' | "coefficient".'),

    body('reporting_delay')
        .optional()
        .trim()
        .isInt()
        .withMessage(currentLang.ris.schema_validator.isInt + ' | "reporting_delay" (days).'),

    body('wait_time')
        .optional()
        .trim()
        .isInt()
        .withMessage(currentLang.ris.schema_validator.isInt + ' | "wait_time" (minutes).'),
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//