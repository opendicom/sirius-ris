//--------------------------------------------------------------------------------------------------------------------//
// APPOINTMENTS SCHEMA:
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
    branch:         { type: mongoose.ObjectId, required: true },
    service:        { type: mongoose.ObjectId, required: true }
},
{ _id : false });

//Define Referring Sub-Schema:
const subSchemaReferring = new mongoose.Schema({
    organization:   { type: mongoose.ObjectId, required: true },
    branch:         { type: mongoose.ObjectId },
    service:        { type: mongoose.ObjectId },
    fk_referring:   { type: mongoose.ObjectId }
},
{ _id : false });

//Define Reporting Sub-Schema:
const subSchemaReporting = new mongoose.Schema({
    organization:   { type: mongoose.ObjectId, required: true },
    branch:         { type: mongoose.ObjectId, required: true },
    service:        { type: mongoose.ObjectId, required: true },
    fk_reporting:   { type: [mongoose.ObjectId] } //Not required | all doctors with domain reporting.
},
{ _id : false });

//Define Media Sub-Schema:
const subSchemaMedia = new mongoose.Schema({
    CD:             { type: Boolean },
    DVD:            { type: Boolean },
    acetate_sheets: { type: Boolean },
},
{ _id : false });

//Define Contrast Sub-Schema:
const subSchemaContrast = new mongoose.Schema({
    use_contrast:   { type: Boolean, required: true },
    description:    { type: String }
},
{ _id : false });

//Define Address Sub-Schema:
const subSchemaAddress = new mongoose.Schema({
    country:        { type: String },
    state:          { type: String },
    city:           { type: String },
    neighborhood:   { type: String },
    address:        { type: String }
},
{ _id : false });

//Define Implants Sub-Schema:
const subSchemaImplants = new mongoose.Schema({
    cochlear_implant:   { type: Boolean, required: true, default: false },
    cardiac_stent:      { type: Boolean, required: true, default: false },
    metal_prostheses:   { type: Boolean, required: true, default: false },
    metal_shards:       { type: Boolean, required: true, default: false },
    pacemaker:          { type: Boolean, required: true, default: false },
    other:              { type: String, default: 'No' },
},
{ _id : false });

//Define COVID-19 Sub-Schema:
const subSchemaCOVID19 = new mongoose.Schema({
    had_covid:          { type: Boolean, required: true, default: false },
    vaccinated:         { type: Boolean, required: true, default: false },
    details:            { type: String },
},
{ _id : false });

//Define PrivateHealth Sub-Schema:
const subSchemaPrivateHealth = new mongoose.Schema({
    height:                 { type: Number, required: true },
    weight:                 { type: Number, required: true },
    diabetes:               { type: Boolean, required: true, default: false },
    hypertension:           { type: Boolean, required: true, default: false },
    epoc:                   { type: Boolean, required: true, default: false },
    smoking:                { type: Boolean, required: true, default: false },
    malnutrition:           { type: Boolean, required: true, default: false },
    obesity:                { type: Boolean, required: true, default: false },
    hiv:                    { type: Boolean, required: true, default: false },
    renal_insufficiency:    { type: Boolean, required: true, default: false },
    heart_failure:          { type: Boolean, required: true, default: false },
    ischemic_heart_disease: { type: Boolean, required: true, default: false },
    valvulopathy:           { type: Boolean, required: true, default: false },
    arrhythmia:             { type: Boolean, required: true, default: false },
    cancer:                 { type: Boolean, required: true, default: false },
    dementia:               { type: Boolean, required: true, default: false },
    claustrophobia:         { type: Boolean, required: true, default: false },
    asthma:                 { type: Boolean, required: true, default: false },
    hyperthyroidism:        { type: Boolean, required: true, default: false },
    hypothyroidism:         { type: Boolean, required: true, default: false },
    pregnancy:              { type: Boolean, required: true, default: false },
    medication:             { type: String, default: 'No' },
    allergies:              { type: String, default: 'No' },
    other:                  { type: String, default: 'No' },
    implants:               { type: subSchemaImplants, required: true },
    covid19:                { type: subSchemaCOVID19, required: true }
},
{ _id : false });

//Define Consents Sub-Schema:
const subSchemaConsents = new mongoose.Schema({
    informed_consent:   { type: mongoose.ObjectId },
    clinical_trial:     { type: mongoose.ObjectId }
},
{ _id : false });

//Define Inpatient Sub-Schema:
const subSchemaInpatient = new mongoose.Schema({
    type:           { type: Number },
    where:          { type: String },
    room:           { type: String },
    contact:        { type: String }
},
{ _id : false });

//Define Schema:
const Schema = new mongoose.Schema({
    fk_appointment_request: { type: mongoose.ObjectId },
    imaging:                { type: subSchemaImaging, required: true },
    referring:              { type: subSchemaReferring, required: true },
    reporting:              { type: subSchemaReporting, required: true },
    fk_patient:             { type: mongoose.ObjectId, required: true },
    contact:                { type: String, required: true },
    start:                  { type: Date, required: true },
    end:                    { type: Date, required: true },
    flow_state:             { type: String, required: true },
    fk_slot:                { type: mongoose.ObjectId, required: true },
    fk_procedure:           { type: mongoose.ObjectId, required: true },
    extra_procedures:       { type: [mongoose.ObjectId] },
    urgency:                { type: Boolean, required: true },
    study_iuid:             { type: String, match: /^([0-9].([0-9]){2}.([0-9]){3}.[0-9].([0-9]){8}.([0-9]){5}.([0-9]){14})/gm },
    accession_number:       { type: String, unique: true },     // Moment of creation of the study_iuid.
    accession_date:         { type: String },                   // Last shipment date to MWL.
    anamnesis:              { type: String },   
    indications:            { type: String },
    report_before:          { type: Date, required: true },
    media:                  { type: subSchemaMedia },
    contrast:               { type: subSchemaContrast, required: true },
    current_address:        { type: subSchemaAddress },
    private_health:         { type: subSchemaPrivateHealth, required: true },
    consents:               { type: subSchemaConsents },
    outpatient:             { type: Boolean, required: true },
    inpatient:              { type: subSchemaInpatient },
    attached_files:         { type: [mongoose.ObjectId] },
    cancellation_reasons:   { type: Number },
    status:                 { type: Boolean, required: true, default: false },
    overbooking:            { type: Boolean }
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('appointments', Schema, 'appointments');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_appointment',
    Plural      : 'fk_appointments'
};

//Register allowed unset values:
const AllowedUnsetValues = ['fk_appointment_request', 'extra_procedures', 'media', 'consents', 'attached_files', 'inpatient', 'cancellation_reasons'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('fk_appointment_request')
        .optional()
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_appointment_request" (ObjectId).'),

    //----------------------------------------------------------------------------------------------------------------//
    // IMAGING:
    //----------------------------------------------------------------------------------------------------------------//
    body('imaging.organization')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "imaging.organization" (ObjectId).'),
    
    body('imaging.branch')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "imaging.branch" (ObjectId).'),

    body('imaging.service')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "imaging.service" (ObjectId).'),
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

    body('referring.service')
        .optional()
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "referring.service" (ObjectId).'),

    body('referring.fk_referring')
        .optional()
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "referring.fk_referring" (ObjectId).'),
    //----------------------------------------------------------------------------------------------------------------//

    //----------------------------------------------------------------------------------------------------------------//
    // REPORTING:
    //----------------------------------------------------------------------------------------------------------------//
    body('reporting.organization')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "reporting.organization" (ObjectId).'),
    
    body('reporting.branch')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "reporting.branch" (ObjectId).'),

    body('reporting.service')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "reporting.service" (ObjectId).'),

    body('reporting.fk_reporting')
        .optional()
        .isArray(),

    body('reporting.fk_reporting.*')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "reporting.fk_reporting.*" (ObjectId).'),
    //----------------------------------------------------------------------------------------------------------------//
    
    body('fk_patient')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_patient" (ObjectId).'),

    body('start').trim(),

    body('end').trim(),

    body('flow_state')
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "flow_state" (min: 3, max: 3 [chars]).'),

    body('fk_slot')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_slot" (ObjectId).'),

    body('fk_procedure')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_procedure" (ObjectId).'),

    body('extra_procedures')
        .optional()
        .isArray()
        .withMessage(currentLang.ris.schema_validator.isArray + ' | "extra_procedures" (Array).'),

    body('extra_procedures.*')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "extra_procedures.*" (ObjectId).'),

    body('urgency')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "urgency" (true or false).')
        .toBoolean(),

    body('study_iuid')
        .optional()
        .trim()
        .isLength({ min: 3, max: 64 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "study_iuid" (min: 3, max: 64 [chars]).'),

    body('accession_number')
        .optional(),

    body('accession_date')
        .optional(),

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

    body('report_before').trim(),

    //----------------------------------------------------------------------------------------------------------------//
    // MEDIA:
    //----------------------------------------------------------------------------------------------------------------//
    body('media').optional(),

    body('media.CD')
        .optional()
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "media.CD" (true or false).')
        .toBoolean(),

    body('media.DVD')
        .optional()
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "media.DVD" (true or false).')
        .toBoolean(),

    body('media.acetate_sheets')
        .optional()
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "media.acetate_sheets" (true or false).')
        .toBoolean(),
    //----------------------------------------------------------------------------------------------------------------//

    body('contrast.use_contrast')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "contrast.use_contrast" (true or false).')
        .toBoolean(),

    //----------------------------------------------------------------------------------------------------------------//
    // CURRENT ADDRESS:
    //----------------------------------------------------------------------------------------------------------------//
    body('current_address.country')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "current_address.country" (min: 3, max: 30 [chars]).')
        .toUpperCase(),

    body('current_address.state')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "current_address.state" (min: 3, max: 30 [chars]).')
        .toUpperCase(),

    body('current_address.city')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "current_address.city" (min: 3, max: 30 [chars]).')
        .toUpperCase(),

    body('current_address.neighborhood')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "current_address.neighborhood" (min: 3, max: 30 [chars]).')
        .toUpperCase(),

    body('current_address.address')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "current_address.address" (min: 3, max: 30 [chars]).')
        .toUpperCase(),
    //----------------------------------------------------------------------------------------------------------------//

    //----------------------------------------------------------------------------------------------------------------//
    // PRIVATE HEALTH:
    //----------------------------------------------------------------------------------------------------------------//
    body('private_health.height')
        .trim()
        .isDecimal()
        .withMessage(currentLang.ris.schema_validator.isRequiredDecimal + ' | "private_health.height".'),

    body('private_health.weight')
        .trim()
        .isDecimal()
        .withMessage(currentLang.ris.schema_validator.isRequiredDecimal + ' | "private_health.weight".'),

    body('private_health.diabetes')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.diabetes" (true or false).')
        .toBoolean(),

    body('private_health.hypertension')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.hypertension" (true or false).')
        .toBoolean(),

    body('private_health.epoc')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.epoc" (true or false).')
        .toBoolean(),

    body('private_health.smoking')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.smoking" (true or false).')
        .toBoolean(),

    body('private_health.malnutrition')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.malnutrition" (true or false).')
        .toBoolean(),

    body('private_health.obesity')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.obesity" (true or false).')
        .toBoolean(),

    body('private_health.hiv')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.hiv" (true or false).')
        .toBoolean(),

    body('private_health.renal_insufficiency')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.renal_insufficiency" (true or false).')
        .toBoolean(),

    body('private_health.heart_failure')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.heart_failure" (true or false).')
        .toBoolean(),

    body('private_health.ischemic_heart_disease')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.ischemic_heart_disease" (true or false).')
        .toBoolean(),

    body('private_health.valvulopathy')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.valvulopathy" (true or false).')
        .toBoolean(),

    body('private_health.arrhythmia')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.arrhythmia" (true or false).')
        .toBoolean(),

    body('private_health.cancer')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.cancer" (true or false).')
        .toBoolean(),

    body('private_health.dementia')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.dementia" (true or false).')
        .toBoolean(),

    body('private_health.claustrophobia')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.claustrophobia" (true or false).')
        .toBoolean(),

    body('private_health.asthma')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.asthma" (true or false).')
        .toBoolean(),

    body('private_health.hyperthyroidism')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.hyperthyroidism" (true or false).')
        .toBoolean(),

    body('private_health.hypothyroidism')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.hypothyroidism" (true or false).')
        .toBoolean(),

    body('private_health.pregnancy')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.pregnancy" (true or false).')
        .toBoolean(),

    body('private_health.medication')
        .optional()
        .trim()
        .isLength({ min: 2, max: 1000 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "private_health.medication" (min: 2, max: 1000 [chars]).'),

    body('private_health.allergies')
        .optional()
        .trim()
        .isLength({ min: 3, max: 60 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "private_health.allergies" (min: 3, max: 60 [chars]).'),
    
    body('private_health.other')
        .optional()
        .trim()
        .isLength({ min: 3, max: 60 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "private_health.other" (min: 3, max: 60 [chars]).'),

    body('private_health.implants.cochlear_implant')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.implants.cochlear_implant" (true or false).')
        .toBoolean(),

    body('private_health.implants.cardiac_stent')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.implants.cardiac_stent" (true or false).')
        .toBoolean(),

    body('private_health.implants.metal_prostheses')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.implants.metal_prostheses" (true or false).')
        .toBoolean(),

    body('private_health.implants.metal_shards')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.implants.metal_shards" (true or false).')
        .toBoolean(),

    body('private_health.implants.pacemaker')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.implants.pacemaker" (true or false).')
        .toBoolean(),

    body('private_health.implants.other')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "private_health.implants.other" (min: 3, max: 30 [chars]).'),

    body('private_health.covid19.had_covid')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.covid19.had_covid" (true or false).')
        .toBoolean(),

    body('private_health.covid19.vaccinated')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "private_health.covid19.vaccinated" (true or false).')
        .toBoolean(),

    body('private_health.covid19.details')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "private_health.covid19.details" (min: 3, max: 100 [chars]).'),
    //----------------------------------------------------------------------------------------------------------------//

    //----------------------------------------------------------------------------------------------------------------//
    // CONSENTS:
    //----------------------------------------------------------------------------------------------------------------//
    body('consents')
        .optional(),

    body('consents.informed_consent')
        .optional()
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "consents.informed_consent" (ObjectId).'),

    body('consents.clinical_trial')
        .optional()
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "consents.clinical_trial" (ObjectId).'),
    //----------------------------------------------------------------------------------------------------------------//

    body('outpatient')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "outpatient" (true or false).')
        .toBoolean(),

    //----------------------------------------------------------------------------------------------------------------//
    // INPATIENT:
    //----------------------------------------------------------------------------------------------------------------//
    body('inpatient.where')
        .optional()
        .trim()
        .isLength({ min: 3, max: 40 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "inpatient.where" (min: 3, max: 40 [chars]).'),

    body('inpatient.room')
        .optional()
        .trim()
        .isLength({ min: 3, max: 40 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "inpatient.room" (min: 3, max: 40 [chars]).'),

    body('inpatient.contact')
        .optional()
        .trim()
        .isLength({ min: 3, max: 40 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "inpatient.contact" (min: 3, max: 40 [chars]).'),
    //----------------------------------------------------------------------------------------------------------------//

    body('attached_files')
        .optional()
        .isArray()
        .withMessage(currentLang.ris.schema_validator.isArray + ' | "attached_files" (Array).'),

    body('attached_files.*')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "attached_files.*" (ObjectId).'),

    body('cancellation_reasons')
        .optional()
        .trim()
        .isInt()
        .withMessage(currentLang.ris.schema_validator.isInt + ' | "cancellation_reasons".'),
    
    body('status')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "outpatient" (true or false).')
        .toBoolean(),

    body('overbooking')
        .optional()
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "overbooking" (true or false).')
        .toBoolean()
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//