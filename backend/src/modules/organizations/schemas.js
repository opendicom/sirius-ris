//--------------------------------------------------------------------------------------------------------------------//
// ORGANIZATIONS SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Define white labeling sub-schema (custom branding per organization):
const subSchemaWhiteLabeling = new mongoose.Schema({
    label:                  { type: String }, // Custom product name shown instead of "Sirius RIS".
    base64_logo_horizontal: { type: String }, // Navbar/toolbar logo (base64).
    base64_logo_vertical:   { type: String }, // Login/Authorize pages logo (base64).
    base64_logo_welcome:    { type: String }, // Welcome/start page logo (base64).
}, { _id: false });
//Define mail options sub-schema (per-organization SMTP configuration):
const subSchemaMailOptions = new mongoose.Schema({
    type:           { type: String },  // Mail type (e.g. "gmail").
    host:           { type: String },  // Mail server host.
    port:           { type: Number },  // Mail server port.
    secure:         { type: Boolean }, // Use secure connection.
    from:           { type: String },  // Default "from" email address.
    user:           { type: String },  // Mail server username.
    pass:           { type: String },  // Mail server password (stored in plain text).
}, { _id: false });

//Define Schema:
const Schema = new mongoose.Schema({
    name:           { type: String, required: true },
    short_name:     { type: String, required: true },
    OID:            { type: String },
    country_code:   { type: String, required: true },
    structure_id:   { type: String },
    suffix:         { type: String },
    status:         { type: Boolean, required: true, default: false },
    base64_logo:    { type: String }, //This parameter is created in backend server (not validate).
    base64_cert:    { type: String }, //This parameter is created in backend server (not validate).
    password_cert:  { type: String },  //This parameter is not validated since it has different characteristics.
    white_labeling: { type: subSchemaWhiteLabeling, required: false },
    mail_options:   { type: subSchemaMailOptions, required: false },
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('organizations', Schema, 'organizations');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_organization',
    Plural      : 'fk_organizations',
    Domain      : 'domain.organization',
    Imaging     : 'imaging.organization',
    Referring   : 'referring.organization',
    Reporting   : 'reporting.organization'
};

//Register allowed unset values:
const AllowedUnsetValues = ['OID', 'structure_id', 'suffix', 'base64_logo', 'base64_cert', 'password_cert', 'white_labeling', 'white_labeling.label', 'white_labeling.base64_logo_horizontal', 'white_labeling.base64_logo_vertical', 'white_labeling.base64_logo_welcome', 'mail_options', 'mail_options.type', 'mail_options.host', 'mail_options.port', 'mail_options.secure', 'mail_options.from', 'mail_options.user', 'mail_options.pass'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('name')
        .trim()
        .isLength({ min: 3, max: 64 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "name" (min: 3, max: 64 [chars]).'),

    body('short_name')
        .trim()
        .isLength({ min: 3, max: 32 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "short_name" (min: 3, max: 32 [chars]).'),

    body('OID')
        .optional()
        .trim()
        .isLength({ min: 1, max: 64 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "OID" (min: 1, max: 64 [chars]).'),

    body('country_code')
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "country_code" (min: 3, max: 3 [chars]).')
        .toLowerCase(),

    body('structure_id')
        .optional()
        .trim()
        .isLength({ min: 1, max: 64 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "structure_id" (min: 1, max: 64 [chars]).'),

    body('suffix')
        .optional()
        .trim()
        .isLength({ min: 1, max: 64 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "suffix" (min: 1, max: 64 [chars]).'),
    
    body('status')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "status" (true or false).')
        .toBoolean(),

    body('base64_logo')
        .optional(),

    body('base64_cert')
        .optional(),

    body('password_cert')
        .optional()
        .trim(),

    body('white_labeling.label')
        .optional()
        .trim()
        .isLength({ min: 1, max: 64 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "white_labeling.label" (min: 1, max: 64 [chars]).'),

    body('white_labeling.base64_logo_horizontal')
        .optional()
        .isString()
        .withMessage(currentLang.ris.schema_validator.isString + ' | "white_labeling.base64_logo_horizontal".'),

    body('white_labeling.base64_logo_vertical')
        .optional()
        .isString()
        .withMessage(currentLang.ris.schema_validator.isString + ' | "white_labeling.base64_logo_vertical".'),

    body('white_labeling.base64_logo_welcome')
        .optional()
        .isString()
        .withMessage(currentLang.ris.schema_validator.isString + ' | "white_labeling.base64_logo_welcome".'),

    body('mail_options.type')
        .optional()
        .trim()
        .isLength({ min: 1, max: 32 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "mail_options.type" (min: 1, max: 32 [chars]).'),

    body('mail_options.host')
        .optional()
        .trim()
        .isLength({ min: 1, max: 128 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "mail_options.host" (min: 1, max: 128 [chars]).'),

    body('mail_options.port')
        .optional()
        .isInt({ min: 1, max: 65535 })
        .withMessage(currentLang.ris.schema_validator.isInt + ' | "mail_options.port" (min: 1, max: 65535).')
        .toInt(),

    body('mail_options.secure')
        .optional()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "mail_options.secure" (true or false).')
        .toBoolean(),

    body('mail_options.from')
        .optional()
        .trim()
        .isLength({ min: 1, max: 128 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "mail_options.from" (min: 1, max: 128 [chars]).'),

    body('mail_options.user')
        .optional()
        .trim()
        .isLength({ min: 1, max: 128 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "mail_options.user" (min: 1, max: 128 [chars]).'),

    body('mail_options.pass')
        .optional()
        .trim(),
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//