//--------------------------------------------------------------------------------------------------------------------//
// PERFORMING SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

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
        .withMessage('El parametro fk_appointment NO es un ID MongoDB válido.'),

    body('flow_state')
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage('El parametro flow_state ingresado es demasiado corto o demasiado largo (min: 3, max: 3 [caracteres]).'),

    //Validate checkin_time and build performing date preserving the appointment date:
    body('checkin_time')
        .trim()
        .matches(/^([01][0-9]|2[0-3]):([0-5][0-9])$/)
        .withMessage('El parametro checkin_time no puede ser vacío [Formato: HH:MM | 24 hs].'),

    body('fk_equipment')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_equipment NO es un ID MongoDB válido.'),

    body('fk_procedure')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_procedure NO es un ID MongoDB válido.'),

    body('extra_procedures')
        .optional()
        .isArray()
        .withMessage('El parametro extra_procedures debe ser un array.'),

    body('extra_procedures.*')
        .if(body('extra_procedures').exists())   // Check if parent exists.
        .trim()
        .isMongoId()
        .withMessage('El parametro extra_procedures.* NO es un ID MongoDB válido.'),

    body('cancellation_reasons')
        .optional()
        .trim()
        .isInt()
        .withMessage('El parametro cancellation_reasons debe ser numérico.'),

    body('urgency')
        .trim()
        .isBoolean()
        .withMessage('El parametro urgency ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),
    
    body('status')
        .trim()
        .isBoolean()
        .withMessage('El estado ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('observations')
        .optional()
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('El parametro observations ingresado es demasiado corto o demasiado largo (min: 10, max: 1000 [caracteres]).'),
        
    //----------------------------------------------------------------------------------------------------------------//
    // ANESTHESIA:
    //----------------------------------------------------------------------------------------------------------------//
    body('anesthesia').optional(),

    body('anesthesia.procedure')
        .if(body('anesthesia').exists())   // Check if parent exists.
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('El parametro anesthesia.procedure ingresado es demasiado corto o demasiado largo (min: 10, max: 1000 [caracteres]).'),

    body('anesthesia.professional_id')
        .if(body('anesthesia').exists())   // Check if parent exists.
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El parametro anesthesia.professional_id ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).'),

    body('anesthesia.document')
        .if(body('anesthesia').exists())   // Check if parent exists.
        .trim()
        .isLength({ min: 3, max: 25 })
        .withMessage('El parametro anesthesia.document ingresado es demasiado corto o demasiado largo (min: 3, max: 25 [caracteres]).'),

    body('anesthesia.name')
        .if(body('anesthesia').exists())   // Check if parent exists.
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El parametro anesthesia.name ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).'),
    
    body('anesthesia.surname')
        .if(body('anesthesia').exists())   // Check if parent exists.
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El parametro anesthesia.surname ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).'),
    //----------------------------------------------------------------------------------------------------------------//


    //----------------------------------------------------------------------------------------------------------------//
    // INJECTION:
    //----------------------------------------------------------------------------------------------------------------//
    body('injection').optional(),

    body('injection.administered_volume')
        .if(body('injection').exists())   // Check if parent exists.
        .trim()
        .isInt()
        .withMessage('El parametro injection.administered_volume debe ser numérico.'),

    body('injection.administration_time')
        .if(body('injection').exists())   // Check if parent exists.
        .trim()
        .matches(/^([01][0-9]|2[0-3]):([0-5][0-9])$/)
        .withMessage('El parametro injection.administration_time no puede ser vacío [Formato: HH:MM | 24 hs].'),

    body('injection.injection_user')
        .if(body('injection').exists())   // Check if parent exists.
        .trim()
        .isMongoId()
        .withMessage('El parametro injection.injection_user NO es un ID MongoDB válido.'),

    // PET-CT:
    body('injection.pet_ct').optional(),

    body('injection.pet_ct.laboratory_user')
        .if(body('injection.pet_ct').exists())   // Check if parent exists.
        .trim()
        .isMongoId()
        .withMessage('El parametro injection.pet_ct.laboratory_user NO es un ID MongoDB válido.'),

    body('injection.pet_ct.batch')
        .if(body('injection.pet_ct').exists())   // Check if parent exists.
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El parametro injection.pet_ct.batch ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).'),

    body('injection.pet_ct.syringe_activity_full')
        .if(body('injection.pet_ct').exists())   // Check if parent exists.
        .trim()
        .isDecimal()
        .withMessage('El parametro injection.pet_ct.syringe_activity_full debe ser numérico (decimal).'),

    body('injection.pet_ct.syringe_activity_empty')
        .if(body('injection.pet_ct').exists())   // Check if parent exists.
        .trim()
        .isDecimal()
        .withMessage('El parametro injection.pet_ct.syringe_activity_empty debe ser numérico (decimal).'),

    body('injection.pet_ct.administred_activity')
        .if(body('injection.pet_ct').exists())   // Check if parent exists.
        .trim()
        .isDecimal()
        .withMessage('El parametro injection.pet_ct.administred_activity debe ser numérico (decimal).'),

    body('injection.pet_ct.syringe_full_time')
        .if(body('injection.pet_ct').exists())   // Check if parent exists.
        .trim()
        .matches(/^([01][0-9]|2[0-3]):([0-5][0-9])$/)
        .withMessage('El parametro injection.pet_ct.syringe_full_time no puede ser vacío [Formato: HH:MM | 24 hs].'),

    body('injection.pet_ct.syringe_empty_time')
        .if(body('injection.pet_ct').exists())   // Check if parent exists.
        .trim()
        .matches(/^([01][0-9]|2[0-3]):([0-5][0-9])$/)
        .withMessage('El parametro injection.pet_ct.syringe_empty_time no puede ser vacío [Formato: HH:MM | 24 hs].'),
    //----------------------------------------------------------------------------------------------------------------//


    //----------------------------------------------------------------------------------------------------------------//
    // ACQUISITION:
    //----------------------------------------------------------------------------------------------------------------//
    body('acquisition').optional(),

    body('acquisition.time')
        .if(body('acquisition').exists())   // Check if parent exists.
        .trim()
        .matches(/^([01][0-9]|2[0-3]):([0-5][0-9])$/)
        .withMessage('El parametro acquisition.time no puede ser vacío [Formato: HH:MM | 24 hs].'),

    body('acquisition.console_technician')
        .if(body('acquisition').exists())   // Check if parent exists.
        .trim()
        .isMongoId()
        .withMessage('El parametro acquisition.console_technician NO es un ID MongoDB válido.'),

    body('acquisition.observations')
        .optional()
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('El parametro acquisition.observations ingresado es demasiado corto o demasiado largo (min: 10, max: 1000 [caracteres]).'),
    //----------------------------------------------------------------------------------------------------------------//

];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//