//--------------------------------------------------------------------------------------------------------------------//
// APPOINTMENT REQUESTS SCHEMA:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

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
        .withMessage('El parametro urgency ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    //----------------------------------------------------------------------------------------------------------------//
    // IMAGING:
    //----------------------------------------------------------------------------------------------------------------//
    body('imaging.organization')
        .trim()
        .isMongoId()
        .withMessage('El parametro imaging.organization NO es un ID MongoDB válido.'),
    
    body('imaging.branch')
        .optional()
        .trim()
        .isMongoId()
        .withMessage('El parametro imaging.branch NO es un ID MongoDB válido.'),
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
    //----------------------------------------------------------------------------------------------------------------//

    //----------------------------------------------------------------------------------------------------------------//
    // PATIENT:
    //----------------------------------------------------------------------------------------------------------------//
    body('patient.doc_country_code')
        .optional()
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage('El código de país del documento de paciente ingresado es demasiado corto o demasiado largo (min: 3, max: 3 [caracteres]).')
        .toLowerCase(),

    body('patient.doc_type')
        .trim()
        .isInt()
        .withMessage('El parametro tipo de documento de paciente es requerido y debe ser numérico.'),

    body('patient.document')
        .trim()
        .isLength({ min: 3, max: 25 })
        .withMessage('El documento ingresado de paciente es demasiado corto o demasiado largo (min: 3, max: 25 [caracteres]).')
        .toUpperCase(),

    body('patient.name_01')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El primer nombre ingresado de paciente es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).')
        .toUpperCase(),

    body('patient.name_02')
        .trim()
        .optional()
        .isLength({ min: 3, max: 30 })
        .withMessage('El segundo nombre ingresado de paciente es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).')
        .toUpperCase(),

    body('patient.surname_01')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El primer apellido ingresado de paciente es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).')
        .toUpperCase(),

    body('patient.surname_02')
        .trim()
        .optional()
        .isLength({ min: 3, max: 30 })
        .withMessage('El segundo apellido ingresado de paciente es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).')
        .toUpperCase(),

    body('patient.birth_date').trim().toDate(),

    body('patient.gender')
        .trim()
        .isInt()
        .withMessage('El parametro género de paciente es requerido y debe ser numérico.'),

    body('patient.phone_numbers').optional().isArray(),

    body('patient.phone_numbers.*')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('El número de teléfono ingresado de paciente es demasiado corto o demasiado largo (min: 3, max: 20 [caracteres]).'),

    body('patient.email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('El valor ingresado NO es una dirección de correo válida.')
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
        .withMessage('El parametro fk_procedure NO es un ID MongoDB válido.'),

    body('study.snomed')
        .optional()
        .trim()
        .isLength({ min: 3, max: 40 })
        .withMessage('El código snomed ingresado es demasiado corto o demasiado largo (min: 3, max: 40 [caracteres]).'),

    //Modality (code_value)
    body('study.modality')
        .optional()
        .trim()
        .isLength({ min: 2, max: 10 })
        .withMessage('El code value de modality ingresado es demasiado corto o demasiado largo (min: 2, max: 10 [caracteres]).'),
    //----------------------------------------------------------------------------------------------------------------//

    body('annotations')
        .optional()
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('El parametro annotations ingresado es demasiado corto o demasiado largo (min: 10, max: 2000 [caracteres]).'),

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

    //----------------------------------------------------------------------------------------------------------------//
    // EXTRA:
    //----------------------------------------------------------------------------------------------------------------//
    body('extra.patient_id')
        .optional()
        .trim()
        .isLength({ min: 1, max: 60 })
        .withMessage('El parametro extra.patient_id ingresado es demasiado corto o demasiado largo (min: 1, max: 60 [caracteres]).'),
    
    body('extra.study_id')
        .optional()
        .trim()
        .isLength({ min: 1, max: 60 })
        .withMessage('El parametro extra.study_id ingresado es demasiado corto o demasiado largo (min: 1, max: 60 [caracteres]).'),

    body('extra.physician_id')
        .optional()
        .trim()
        .isLength({ min: 1, max: 60 })
        .withMessage('El parametro extra.physician_id ingresado es demasiado corto o demasiado largo (min: 1, max: 60 [caracteres]).'),

    body('extra.physician_name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 60 })
        .withMessage('El parametro extra.physician_name ingresado es demasiado corto o demasiado largo (min: 1, max: 60 [caracteres]).')
        .toUpperCase(),

    body('extra.physician_prof_id')
        .optional()
        .trim()
        .isLength({ min: 1, max: 60 })
        .withMessage('El parametro extra.physician_prof_id ingresado es demasiado corto o demasiado largo (min: 1, max: 60 [caracteres]).'),

    body('extra.physician_contact')
        .optional()
        .trim()
        .isLength({ min: 1, max: 60 })
        .withMessage('El parametro extra.physician_contact ingresado es demasiado corto o demasiado largo (min: 1, max: 60 [caracteres]).'),

    body('extra.requesting_id')
        .optional()
        .trim()
        .isLength({ min: 1, max: 60 })
        .withMessage('El parametro extra.requesting_id ingresado es demasiado corto o demasiado largo (min: 1, max: 60 [caracteres]).'),

    body('extra.custom_fields').optional().isArray(),

    body('extra.custom_fields.*')
        .trim()
        .isLength({ min: 1, max: 60 })
        .withMessage('El parametro extra.custom_fields ingresado es demasiado corto o demasiado largo (min: 1, max: 60 [caracteres]).')
    //----------------------------------------------------------------------------------------------------------------//
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//