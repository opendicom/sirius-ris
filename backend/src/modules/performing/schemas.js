//--------------------------------------------------------------------------------------------------------------------//
// PERFORMING SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Define Anesthesia Sub-Schema:
const subSchemaAnesthesia = new mongoose.Schema({
    procedure:          { type: String, required: true },
    professional_id:    { type: String, required: true },
    document:           { type: String, required: true },
    name:               { type: String, required: true },
    surname:            { type: String, required: true }
},
{ _id : false });

//Define PET-CT Sub-Schema:
const subSchemaPETCT = new mongoose.Schema({
    batch:                  { type: String },
    syringe_activity_full:  { type: Number, required: true },
    syringe_activity_empty: { type: Number, required: true },
    administred_activity:   { type: Number, required: true },
    syringe_full_time:      { type: String, required: true },
    syringe_empty_time:     { type: String, required: true },
    laboratory_user:        { type: mongoose.ObjectId, required: true },
},
{ _id : false });

//Define Injection Sub-Schema:
const subSchemaInjection = new mongoose.Schema({
    administered_volume:    { type: Number, required: true },
    administration_time:    { type: String, required: true },
    injection_user:         { type: mongoose.ObjectId, required: true },
    pet_ct:                 { type: subSchemaPETCT }
},
{ _id : false });

//Define Acquisition Sub-Schema:
const subSchemaAcquisition = new mongoose.Schema({
    time:                   { type: String, required: true },
    console_technician:     { type: mongoose.ObjectId, required: true },
    observations:           { type: String }
},
{ _id : false });

//Define Schema:
const Schema = new mongoose.Schema({
    fk_appointment:         { type: mongoose.ObjectId, required: true },
    flow_state:             { type: String, required: true },
    date:                   { type: Date, required: true },
    fk_equipment:           { type: mongoose.ObjectId, required: true },
    fk_procedure:           { type: mongoose.ObjectId, required: true },
    extra_procedures:       { type: [mongoose.ObjectId] },
    cancellation_reasons:   { type: Number },
    urgency:                { type: Boolean, required: true },
    status:                 { type: Boolean, required: true, default: false },
    anesthesia:             { type: subSchemaAnesthesia },
    injection:              { type: subSchemaInjection },
    acquisition:            { type: subSchemaAcquisition },
    observations:           { type: String }
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('performing', Schema, 'performing');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_performing',
    Plural      : 'fk_performing'
};

//Register allowed unset values:
const AllowedUnsetValues = [
    'extra_procedures',
    'cancellation_reasons',
    'observations',
    'anesthesia',
    'injection',
    'injection.pet_ct',
    'acquisition',
    'acquisition.observations'
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('fk_appointment')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_appointment" (ObjectId).'),

    body('flow_state')
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "flow_state" (min: 3, max: 3 [chars]).'),

    //Validate checkin_time and build performing date preserving the appointment date:
    body('checkin_time')
        .trim()
        .matches(/^([01][0-9]|2[0-3]):([0-5][0-9])$/)
        .withMessage(currentLang.ris.schema_validator.isRequiredTime + ' | "checkin_time" [Format: HH:MM | 24 hs].'),

    body('fk_equipment')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_equipment" (ObjectId).'),

    body('fk_procedure')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_procedure" (ObjectId).'),

    body('extra_procedures')
        .optional()
        .isArray()
        .withMessage(currentLang.ris.schema_validator.isArray + ' | "extra_procedures" (Array).'),

    body('extra_procedures.*')
        .if(body('extra_procedures').exists())   // Check if parent exists.
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "extra_procedures.*" (ObjectId).'),

    body('cancellation_reasons')
        .optional()
        .trim()
        .isInt()
        .withMessage(currentLang.ris.schema_validator.isInt + ' | "cancellation_reasons".'),

    body('urgency')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "urgency" (true or false).')
        .toBoolean(),
    
    body('status')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "status" (true or false).')
        .toBoolean(),

    body('observations')
        .optional()
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "observations" (min: 3, max: 1000 [chars]).'),
        
    //----------------------------------------------------------------------------------------------------------------//
    // ANESTHESIA:
    //----------------------------------------------------------------------------------------------------------------//
    body('anesthesia').optional(),

    body('anesthesia.procedure')
        .if(body('anesthesia').exists())   // Check if parent exists.
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "anesthesia.procedure" (min: 10, max: 1000 [chars]).'),

    body('anesthesia.professional_id')
        .if(body('anesthesia').exists())   // Check if parent exists.
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "anesthesia.professional_id" (min: 3, max: 30 [chars]).'),

    body('anesthesia.document')
        .if(body('anesthesia').exists())   // Check if parent exists.
        .trim()
        .isLength({ min: 3, max: 25 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "anesthesia.document" (min: 3, max: 25 [chars]).'),

    body('anesthesia.name')
        .if(body('anesthesia').exists())   // Check if parent exists.
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "anesthesia.name" (min: 3, max: 30 [chars]).'),
    
    body('anesthesia.surname')
        .if(body('anesthesia').exists())   // Check if parent exists.
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "anesthesia.surname" (min: 3, max: 30 [chars]).'),
    //----------------------------------------------------------------------------------------------------------------//


    //----------------------------------------------------------------------------------------------------------------//
    // INJECTION:
    //----------------------------------------------------------------------------------------------------------------//
    body('injection').optional(),

    body('injection.administered_volume')
        .if(body('injection').exists())   // Check if parent exists.
        .trim()
        .isInt()
        .withMessage(currentLang.ris.schema_validator.isInt + ' | "injection.administered_volume".'),

    body('injection.administration_time')
        .if(body('injection').exists())   // Check if parent exists.
        .trim()
        .matches(/^([01][0-9]|2[0-3]):([0-5][0-9])$/)
        .withMessage(currentLang.ris.schema_validator.isRequiredTime + ' | "injection.administration_time" [Format: HH:MM | 24 hs].'),

    body('injection.injection_user')
        .if(body('injection').exists())   // Check if parent exists.
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "injection.injection_user" (ObjectId).'),

    // PET-CT:
    body('injection.pet_ct').optional(),

    body('injection.pet_ct.laboratory_user')
        .if(body('injection.pet_ct').exists())   // Check if parent exists.
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "injection.pet_ct.laboratory_user" (ObjectId).'),

    body('injection.pet_ct.batch')
        .if(body('injection.pet_ct').exists())   // Check if parent exists.
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "injection.pet_ct.batch" (min: 3, max: 30 [chars]).'),

    body('injection.pet_ct.syringe_activity_full')
        .if(body('injection.pet_ct').exists())   // Check if parent exists.
        .trim()
        .isDecimal()
        .withMessage(currentLang.ris.schema_validator.isDecimal + ' | "injection.pet_ct.syringe_activity_full".'),

    body('injection.pet_ct.syringe_activity_empty')
        .if(body('injection.pet_ct').exists())   // Check if parent exists.
        .trim()
        .isDecimal()
        .withMessage(currentLang.ris.schema_validator.isDecimal + ' | "injection.pet_ct.syringe_activity_empty".'),

    body('injection.pet_ct.administred_activity')
        .if(body('injection.pet_ct').exists())   // Check if parent exists.
        .trim()
        .isDecimal()
        .withMessage(currentLang.ris.schema_validator.isDecimal + ' | "injection.pet_ct.administred_activity".'),

    body('injection.pet_ct.syringe_full_time')
        .if(body('injection.pet_ct').exists())   // Check if parent exists.
        .trim()
        .matches(/^([01][0-9]|2[0-3]):([0-5][0-9])$/)
        .withMessage(currentLang.ris.schema_validator.isRequiredTime + ' | "injection.pet_ct.syringe_full_time" [Format: HH:MM | 24 hs].'),

    body('injection.pet_ct.syringe_empty_time')
        .if(body('injection.pet_ct').exists())   // Check if parent exists.
        .trim()
        .matches(/^([01][0-9]|2[0-3]):([0-5][0-9])$/)
        .withMessage(currentLang.ris.schema_validator.isRequiredTime + ' | "injection.pet_ct.syringe_empty_time" [Format: HH:MM | 24 hs].'),
    //----------------------------------------------------------------------------------------------------------------//


    //----------------------------------------------------------------------------------------------------------------//
    // ACQUISITION:
    //----------------------------------------------------------------------------------------------------------------//
    body('acquisition').optional(),

    body('acquisition.time')
        .if(body('acquisition').exists())   // Check if parent exists.
        .trim()
        .matches(/^([01][0-9]|2[0-3]):([0-5][0-9])$/)
        .withMessage(currentLang.ris.schema_validator.isRequiredTime + ' | "acquisition.time" [Format: HH:MM | 24 hs].'),

    body('acquisition.console_technician')
        .if(body('acquisition').exists())   // Check if parent exists.
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "acquisition.console_technician" (ObjectId).'),

    body('acquisition.observations')
        .optional()
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "acquisition.observations" (min: 10, max: 1000 [chars]).'),
    //----------------------------------------------------------------------------------------------------------------//

];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//