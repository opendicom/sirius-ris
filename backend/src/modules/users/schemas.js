//--------------------------------------------------------------------------------------------------------------------//
// USERS SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');
const middlewares   = require('../../main.middlewares');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Define Privileges Sub-Schema:
const subSchemaPermissions = new mongoose.Schema({
    organization:   { type: mongoose.ObjectId },
    branch:         { type: mongoose.ObjectId },
    service:        { type: mongoose.ObjectId },
    role:           { type: Number, required: true },
    concession:     { type: [Number] }
},
{ _id : false });

//Define Professional Sub-Schema:
const subSchemaProfessional = new mongoose.Schema({
    id:             { type: String },
    description:    { type: String },
    workload:       { type: Number }, //In weekly hours.
    vacation:       { type: Boolean }
},
{ _id : false });

//Define Settings Sub-Schema:
const subSchemaSettings = new mongoose.Schema({
    max_row:        { type: Number },
    viewer:         { type: String },
    language:       { type: String },
    theme:          { type: String }
},
{ _id : false });

//Define Pre-Schema:
const preSchema = new mongoose.Schema({
    fk_person:          { type: mongoose.ObjectId },    // Human user
    username:           { type: String },               // Machine user
    password:           { type: String, required: true },
    email:              { type: String, match: /.+\@.+\..+/ },  // Required only in frontend (Human user).
    permissions:        { type: [subSchemaPermissions], required: true },
    professional:       { type: subSchemaProfessional },
    settings:           { type: subSchemaSettings },
    status:             { type: Boolean, required: true, default: false },
},
{ timestamps: true },
{ versionKey: false });

//Indicate that the schema has a password (to be encrypted):
Schema = middlewares.isPassword(preSchema, 'password');

//Define model:
const Model = mongoose.model('users', Schema, 'users');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_user',
    Plural      : 'fk_users',
    Patient     : 'fk_patient',
    Referring   : 'fk_referring',
    Reporting   : 'fk_reporting',
    Injection   : 'injection_user',
    Laboratory  : 'laboratory_user',
    Console     : 'console_technician'
};

//Register allowed unset values:
const AllowedUnsetValues = ['email', 'professional.id', 'professional.description', 'professional.workload', 'professional.vacation'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('fk_person')
        .optional()
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_person" (ObjectId).'),

    body('username')
        .optional()
        .trim(),
    
    body('password')
        .trim()
        .isLength(8)
        .withMessage(currentLang.ris.schema_validator.isPassword),

    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage(currentLang.ris.schema_validator.isEmail + ' | "email".')
        .normalizeEmail({ gmail_remove_dots: false })
        .toLowerCase(),
        
    body('permissions')
        .isArray()
        .withMessage(currentLang.ris.schema_validator.isRequired + ' | "permissions" (Array).'),

    body('permissions.*.organization')
        .optional()
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "permissions.*.organization" (ObjectId).'),

    body('permissions.*.service')
        .optional()
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "permissions.*.service" (ObjectId).'),

    body('permissions.*.branch')
        .optional()
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "permissions.*.branch" (ObjectId).'),

    body('permissions.*.role')
        .trim()
        .isInt()
        .withMessage(currentLang.ris.schema_validator.isRequiredInt + ' | "permissions.*.role".'),

    body('permissions.*.concession').optional().isArray(),

    body('professional').optional(),

    body('professional.id')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "professional.id" (min: 3, max: 30 [chars]).'),

    body('professional.description')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "professional.description" (min: 3, max: 50 [chars]).'),

    body('professional.workload')
        .optional()
        .trim()
        .isInt()
        .withMessage(currentLang.ris.schema_validator.isInt + ' | "professional.workload".'),

    body('professional.vacation')
        .optional()
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "professional.vacation" (true or false).')
        .toBoolean(),

    body('settings').optional().isArray(),

    body('settings.max_row')
        .optional()
        .trim()
        .isInt()
        .withMessage(currentLang.ris.schema_validator.isInt + ' | "settings.max_row".'),

    body('settings.viewer')
        .optional()
        .trim()
        .isLength({ min: 3, max: 10 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "settings.viewer" (min: 3, max: 10 [chars]).'),

    body('settings.language')
        .optional()
        .trim()
        .isLength({ min: 3, max: 5 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "settings.language" (min: 3, max: 5 [chars]).'),

    body('settings.theme')
        .optional()
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "settings.theme" (min: 3, max: 20 [chars]).'),

    body('status')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "status" (true or false).')
        .toBoolean()
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//