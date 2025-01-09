//--------------------------------------------------------------------------------------------------------------------//
// APPOINTMENTS SCHEMA:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

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
        .withMessage('El parametro fk_appointment_request NO es un ID MongoDB válido.'),

    //----------------------------------------------------------------------------------------------------------------//
    // IMAGING:
    //----------------------------------------------------------------------------------------------------------------//
    body('imaging.organization')
        .trim()
        .isMongoId()
        .withMessage('El parametro imaging.organization NO es un ID MongoDB válido.'),
    
    body('imaging.branch')
        .trim()
        .isMongoId()
        .withMessage('El parametro imaging.branch NO es un ID MongoDB válido.'),

    body('imaging.service')
        .trim()
        .isMongoId()
        .withMessage('El parametro imaging.service NO es un ID MongoDB válido.'),
    //----------------------------------------------------------------------------------------------------------------//
    
    //----------------------------------------------------------------------------------------------------------------//
    // REFERRING:
    //----------------------------------------------------------------------------------------------------------------//
    body('referring.organization')
        .trim()
        .isMongoId()
        .withMessage('El parametro referring.organization NO es un ID MongoDB válido.'),
    
    body('referring.branch')
        .optional()
        .trim()
        .isMongoId()
        .withMessage('El parametro referring.branch NO es un ID MongoDB válido.'),

    body('referring.service')
        .optional()
        .trim()
        .isMongoId()
        .withMessage('El parametro referring.service NO es un ID MongoDB válido.'),

    body('referring.fk_referring')
        .optional()
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_referring NO es un ID MongoDB válido.'),
    //----------------------------------------------------------------------------------------------------------------//

    //----------------------------------------------------------------------------------------------------------------//
    // REPORTING:
    //----------------------------------------------------------------------------------------------------------------//
    body('reporting.organization')
        .trim()
        .isMongoId()
        .withMessage('El parametro reporting.organization NO es un ID MongoDB válido.'),
    
    body('reporting.branch')
        .trim()
        .isMongoId()
        .withMessage('El parametro reporting.branch NO es un ID MongoDB válido.'),

    body('reporting.service')
        .trim()
        .isMongoId()
        .withMessage('El parametro reporting.service NO es un ID MongoDB válido.'),

    body('reporting.fk_reporting')
        .optional()
        .isArray(),

    body('reporting.fk_reporting.*')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_reporting NO es un ID MongoDB válido.'),
    //----------------------------------------------------------------------------------------------------------------//
    
    body('fk_patient')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_patient NO es un ID MongoDB válido.'),

    body('start').trim(),

    body('end').trim(),

    body('flow_state')
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage('El parametro flow_state ingresado es demasiado corto o demasiado largo (min: 3, max: 3 [caracteres]).'),

    body('fk_slot')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_slot NO es un ID MongoDB válido.'),

    body('fk_procedure')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_procedure NO es un ID MongoDB válido.'),

    body('extra_procedures')
        .optional()
        .isArray()
        .withMessage('El parametro extra_procedures debe ser un array.'),

    body('extra_procedures.*')
        .trim()
        .isMongoId()
        .withMessage('El parametro extra_procedures.* NO es un ID MongoDB válido.'),

    body('urgency')
        .trim()
        .isBoolean()
        .withMessage('El parametro urgency ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('study_iuid')
        .optional()
        .trim()
        .isLength({ min: 3, max: 64 })
        .withMessage('El parametro study_iuid generado es demasiado corto o demasiado largo (min: 3, max: 64 [caracteres]).'),

    body('accession_number')
        .optional(),

    body('accession_date')
        .optional(),

    body('anamnesis')
        .optional()
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('El parametro anamnesis ingresado es demasiado corto o demasiado largo (min: 10, max: 1000 [caracteres]).'),

    body('indications')
        .optional()
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('El parametro indications ingresado es demasiado corto o demasiado largo (min: 10, max: 1000 [caracteres]).'),

    body('report_before').trim(),

    //----------------------------------------------------------------------------------------------------------------//
    // MEDIA:
    //----------------------------------------------------------------------------------------------------------------//
    body('media').optional(),

    body('media.CD')
        .optional()
        .trim()
        .isBoolean()
        .withMessage('El media.CD ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('media.DVD')
        .optional()
        .trim()
        .isBoolean()
        .withMessage('El media.DVD ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('media.acetate_sheets')
        .optional()
        .trim()
        .isBoolean()
        .withMessage('El media.acetate_sheets ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),
    //----------------------------------------------------------------------------------------------------------------//

    body('contrast.use_contrast')
        .trim()
        .isBoolean()
        .withMessage('El media.CD ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    //----------------------------------------------------------------------------------------------------------------//
    // CURRENT ADDRESS:
    //----------------------------------------------------------------------------------------------------------------//
    body('current_address.country')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El parametro current_address.country ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).')
        .toUpperCase(),

    body('current_address.state')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El parametro current_address.state ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).')
        .toUpperCase(),

    body('current_address.city')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El parametro current_address.city ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).')
        .toUpperCase(),

    body('current_address.neighborhood')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El parametro current_address.neighborhood ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).')
        .toUpperCase(),

    body('current_address.address')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El parametro current_address.address ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).')
        .toUpperCase(),
    //----------------------------------------------------------------------------------------------------------------//

    //----------------------------------------------------------------------------------------------------------------//
    // PRIVATE HEALTH:
    //----------------------------------------------------------------------------------------------------------------//
    body('private_health.height')
        .trim()
        .isDecimal()
        .withMessage('El parametro height es requerido y debe ser numérico (decimal).'),

    body('private_health.weight')
        .trim()
        .isDecimal()
        .withMessage('El parametro weight es requerido y debe ser numérico (decimal).'),

    body('private_health.diabetes')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.diabetes ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.hypertension')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.hypertension ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.epoc')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.epoc ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.smoking')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.smoking ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.malnutrition')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.malnutrition ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.obesity')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.obesity ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.hiv')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.hiv ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.renal_insufficiency')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.renal_insufficiency ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.heart_failure')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.heart_failure ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.ischemic_heart_disease')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.ischemic_heart_disease ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.valvulopathy')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.valvulopathy ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.arrhythmia')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.arrhythmia ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.cancer')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.cancer ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.dementia')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.dementia ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.claustrophobia')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.claustrophobia ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.asthma')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.asthma ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.hyperthyroidism')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.hyperthyroidism ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.hypothyroidism')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.hypothyroidism ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.pregnancy')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.pregnancy ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.medication')
        .optional()
        .trim()
        .isLength({ min: 2, max: 1000 })
        .withMessage('El parametro private_health.medication ingresado es demasiado corto o demasiado largo (min: 2, max: 1000 [caracteres]).'),

    body('private_health.allergies')
        .optional()
        .trim()
        .isLength({ min: 3, max: 60 })
        .withMessage('El parametro private_health.allergies ingresado es demasiado corto o demasiado largo (min: 3, max: 60 [caracteres]).'),
    
    body('private_health.other')
        .optional()
        .trim()
        .isLength({ min: 3, max: 60 })
        .withMessage('El parametro private_health.other ingresado es demasiado corto o demasiado largo (min: 3, max: 60 [caracteres]).'),

    body('private_health.implants.cochlear_implant')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.implants.cochlear_implant ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.implants.cardiac_stent')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.implants.cardiac_stent ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.implants.metal_prostheses')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.implants.metal_prostheses ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.implants.metal_shards')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.implants.metal_shards ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.implants.pacemaker')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.implants.pacemaker ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.implants.other')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El parametro private_health.implants.other ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).'),

    body('private_health.covid19.had_covid')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.covid19.had_covid ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.covid19.vaccinated')
        .trim()
        .isBoolean()
        .withMessage('El parametro private_health.covid19.vaccinated ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('private_health.covid19.details')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('El parametro private_health.covid19.details ingresado es demasiado corto o demasiado largo (min: 3, max: 100 [caracteres]).'),
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
        .withMessage('El parametro consents.informed_consent NO es un ID MongoDB válido.'),

    body('consents.clinical_trial')
        .optional()
        .trim()
        .isMongoId()
        .withMessage('El parametro consents.clinical_trial NO es un ID MongoDB válido.'),
    //----------------------------------------------------------------------------------------------------------------//

    body('outpatient')
        .trim()
        .isBoolean()
        .withMessage('El parametro outpatient ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    //----------------------------------------------------------------------------------------------------------------//
    // INPATIENT:
    //----------------------------------------------------------------------------------------------------------------//
    body('inpatient.where')
        .optional()
        .trim()
        .isLength({ min: 3, max: 40 })
        .withMessage('El parametro inpatient.where ingresado es demasiado corto o demasiado largo (min: 3, max: 40 [caracteres]).'),

    body('inpatient.room')
        .optional()
        .trim()
        .isLength({ min: 3, max: 40 })
        .withMessage('El parametro inpatient.room ingresado es demasiado corto o demasiado largo (min: 3, max: 40 [caracteres]).'),

    body('inpatient.contact')
        .optional()
        .trim()
        .isLength({ min: 3, max: 40 })
        .withMessage('El parametro inpatient.contact ingresado es demasiado corto o demasiado largo (min: 3, max: 40 [caracteres]).'),
    //----------------------------------------------------------------------------------------------------------------//

    body('attached_files')
        .optional()
        .isArray()
        .withMessage('El parametro attached_files debe ser un array.'),

    body('attached_files.*')
        .trim()
        .isMongoId()
        .withMessage('El parametro attached_files.* NO es un ID MongoDB válido.'),

    body('cancellation_reasons')
        .optional()
        .trim()
        .isInt()
        .withMessage('El parametro cancellation_reasons debe ser numérico.'),
    
    body('status')
        .trim()
        .isBoolean()
        .withMessage('El estado ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('overbooking')
        .optional()
        .trim()
        .isBoolean()
        .withMessage('El parametro overbooking ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean()
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//