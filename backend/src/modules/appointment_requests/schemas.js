//--------------------------------------------------------------------------------------------------------------------//
// APPOINTMENT REQUESTS SCHEMA:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Define Imaging Sub-Schema:
const subSchemaImaging = new mongoose.Schema({
    organization:   { type: mongoose.ObjectId, required: true },
    branch:         { type: mongoose.ObjectId }
},
{ _id : false });

//Define Referring Sub-Schema:
const subSchemaReferring = new mongoose.Schema({
    organization:   { type: mongoose.ObjectId, required: true },
    branch:         { type: mongoose.ObjectId }
},
{ _id : false });

//Define Patient Sub-Schema:
const subSchemaPatient = new mongoose.Schema({
    doc_country_code:   { type: String },
    doc_type:           { type: Number, required: true },
    document:           { type: String, required: true },
    name_01:            { type: String, required: true },
    name_02:            { type: String },
    surname_01:         { type: String, required: true },
    surname_02:         { type: String },
    birth_date:         { type: Date, required: true },
    gender:             { type: Number, required: true },
    phone_numbers:      { type: [String] },
    email:              { type: String, match: /.+\@.+\..+/ },  // Required only in sirius web module.
},
{ _id : false });

//Define Study Sub-Schema:
const subSchemaStudy = new mongoose.Schema({
    fk_procedure:       { type: mongoose.ObjectId },  // ¯¯¯|
    snomed:             { type: String },             //    |----> Not required by default, at least one of the three must be set.
    fk_modality:        { type: mongoose.ObjectId }   // ___|
},
{ _id : false });

//Define Extra Data Sub-Schema:
//Extra Data is setted to be able to preserve external data, thus helping to interoperate.
const subSchemaExtraData = new mongoose.Schema({
    patient_id:         { type: String },
    study_id:           { type: String },
    physician_id:       { type: String },
    physician_name:     { type: String },
    physician_prof_id:  { type: String },
    physician_contact:  { type: String },
    requesting_id:      { type: String },
    custom_fields:      { type: [String] }
},
{ _id : false });

//Define Schema:
const Schema = new mongoose.Schema({
    imaging:        { type: subSchemaImaging, required: true },
    referring:      { type: subSchemaReferring, required: true },
    flow_state:     { type: String },   // Not required, setted in the save handler.
    urgency:        { type: Boolean, default: false },
    annotations:    { type: String },
    patient:        { type: subSchemaPatient, required: true },
    study:          { type: subSchemaStudy, required: true },
    anamnesis:      { type: String },
    indications:    { type: String },
    extra:          { type: subSchemaExtraData }
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('appointment_requests', Schema, 'appointment_requests');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_appointment_request',
    Plural      : 'fk_appointment_requests'
};

//Register allowed unset values:
const AllowedUnsetValues = ['annotations'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('urgency')
        .optional()
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "urgency" (true or false).')
        .toBoolean(),

    //----------------------------------------------------------------------------------------------------------------//
    // IMAGING:
    //----------------------------------------------------------------------------------------------------------------//
    body('imaging.organization')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "imaging.organization" (ObjectId).'),
    
    body('imaging.branch')
        .optional()
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "imaging.branch" (ObjectId).'),
    //----------------------------------------------------------------------------------------------------------------//

    //----------------------------------------------------------------------------------------------------------------//
    // REFERRING:
    //----------------------------------------------------------------------------------------------------------------//
    body('referring.organization')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "referring.organization" (ObjectId).'),
    
    body('referring.branch')
        .optional()
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "referring.branch" (ObjectId).'),
    //----------------------------------------------------------------------------------------------------------------//

    //----------------------------------------------------------------------------------------------------------------//
    // PATIENT:
    //----------------------------------------------------------------------------------------------------------------//
    body('patient.doc_country_code')
        .optional()
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "patient.doc_country_code" (min: 3, max: 3 [chars]).')
        .toLowerCase(),

    body('patient.doc_type')
        .trim()
        .isInt()
        .withMessage(currentLang.ris.schema_validator.isRequiredInt + ' | "patient.doc_type".'),

    body('patient.document')
        .trim()
        .isLength({ min: 3, max: 25 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "patient.document" (min: 3, max: 25 [chars]).')
        .toUpperCase(),

    body('patient.name_01')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "patient.name_01" (min: 3, max: 30 [chars]).')
        .toUpperCase(),

    body('patient.name_02')
        .trim()
        .optional()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "patient.name_02" (min: 3, max: 30 [chars]).')
        .toUpperCase(),

    body('patient.surname_01')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "patient.surname_01" (min: 3, max: 30 [chars]).')
        .toUpperCase(),

    body('patient.surname_02')
        .trim()
        .optional()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "patient.surname_02" (min: 3, max: 30 [chars]).')
        .toUpperCase(),

    body('patient.birth_date').trim().toDate(),

    body('patient.gender')
        .trim()
        .isInt()
        .withMessage(currentLang.ris.schema_validator.isRequiredInt + ' | "patient.gender".'),

    body('patient.phone_numbers').optional().isArray(),

    body('patient.phone_numbers.*')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "patient.phone_numbers.*" (min: 3, max: 20 [chars]).'),

    body('patient.email')
        .optional()
        .trim()
        .isEmail()
        .withMessage(currentLang.ris.schema_validator.isEmail + ' | "patient.email".')
        .normalizeEmail({ gmail_remove_dots: false })
        .toLowerCase(),
    //----------------------------------------------------------------------------------------------------------------//

    //----------------------------------------------------------------------------------------------------------------//
    // STUDY:
    //----------------------------------------------------------------------------------------------------------------//
    body('study.fk_procedure')
        .optional()
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "study.fk_procedure" (ObjectId).'),

    body('study.snomed')
        .optional()
        .trim()
        .isLength({ min: 3, max: 40 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "study.snomed" (min: 3, max: 40 [chars]).'),

    //Modality (code_value)
    body('study.modality')
        .optional()
        .trim()
        .isLength({ min: 2, max: 10 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "study.modality" (min: 2, max: 10 [chars]).'),
    //----------------------------------------------------------------------------------------------------------------//

    body('annotations')
        .optional()
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "annotations" (min: 10, max: 2000 [chars]).'),

    body('anamnesis')
        .optional()
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "anamnesis" (min: 10, max: 1000 [chars]).'),

    body('indications')
        .optional()
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "indications" (min: 10, max: 1000 [chars]).'),

    //----------------------------------------------------------------------------------------------------------------//
    // EXTRA:
    //----------------------------------------------------------------------------------------------------------------//
    body('extra.patient_id')
        .optional()
        .trim()
        .isLength({ min: 1, max: 60 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "extra.patient_id" (min: 1, max: 60 [chars]).'),
    
    body('extra.study_id')
        .optional()
        .trim()
        .isLength({ min: 1, max: 60 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "extra.study_id" (min: 1, max: 60 [chars]).'),

    body('extra.physician_id')
        .optional()
        .trim()
        .isLength({ min: 1, max: 60 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "extra.physician_id" (min: 1, max: 60 [chars]).'),

    body('extra.physician_name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 60 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "extra.physician_name" (min: 1, max: 60 [chars]).')
        .toUpperCase(),

    body('extra.physician_prof_id')
        .optional()
        .trim()
        .isLength({ min: 1, max: 60 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "extra.physician_prof_id" (min: 1, max: 60 [chars]).'),

    body('extra.physician_contact')
        .optional()
        .trim()
        .isLength({ min: 1, max: 60 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "extra.physician_contact" (min: 1, max: 60 [chars]).'),

    body('extra.requesting_id')
        .optional()
        .trim()
        .isLength({ min: 1, max: 60 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "extra.requesting_id" (min: 1, max: 60 [chars]).'),

    body('extra.custom_fields').optional().isArray(),

    body('extra.custom_fields.*')
        .trim()
        .isLength({ min: 1, max: 60 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "extra.custom_fields.*" (min: 1, max: 60 [chars]).')
    //----------------------------------------------------------------------------------------------------------------//
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//