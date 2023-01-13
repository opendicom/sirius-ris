//--------------------------------------------------------------------------------------------------------------------//
// PERFORMING SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Define Anesthetic Sub-Schema:
const subSchemaAnesthetic = new mongoose.Schema({
    procedure:          { type: String, required: true },
    professional_id:    { type: String, required: true },
    document:           { type: String, required: true },
    name:               { type: String, required: true },
    surname:            { type: String, required: true }
},
{ _id : false });

//Define PET-CT Sub-Schema:
const subSchemaPETCT = new mongoose.Schema({
    syringe_activity_full:  { type: Number, required: true },
    syringe_activity_empty: { type: Number, required: true },
    administred_activity:   { type: Number, required: true },
    syringe_full_time:      { type: Date, required: true },
    syringe_empty_time:     { type: Date, required: true },
},
{ _id : false });

//Define Injection Sub-Schema:
const subSchemaInjection = new mongoose.Schema({
    batch:                  { type: String },
    administered_volume:    { type: Number, required: true },
    administration_time:    { type: Date, required: true },
    injection_technician:   { type: mongoose.ObjectId, required: true },
    observations:           { type: String },
    pet_ct:                 { type: subSchemaPETCT }
},
{ _id : false });

//Define Acquisition Sub-Schema:
const subSchemaAcquisition = new mongoose.Schema({
    time:                   { type: Date, required: true },
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
    status:                 { type: Boolean, required: true, default: false },
    anesthetic:             { type: subSchemaAnesthetic },
    injection:              { type: subSchemaInjection },
    acquisition:            { type: subSchemaAcquisition }
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
const AllowedUnsetValues = [];
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

    body('date').trim(),

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
        .trim()
        .isMongoId()
        .withMessage('El parametro extra_procedures.* NO es un ID MongoDB válido.'),

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

    //----------------------------------------------------------------------------------------------------------------//
    // ANESTHETIC:
    //----------------------------------------------------------------------------------------------------------------//
    body('anesthetic').optional(),

    body('anesthetic.procedure')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('El parametro anesthetic.procedure ingresado es demasiado corto o demasiado largo (min: 10, max: 1000 [caracteres]).'),

    body('anesthetic.professional_id')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El parametro anesthetic.professional_id ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).'),

    body('anesthetic.document')
        .trim()
        .isLength({ min: 3, max: 25 })
        .withMessage('El parametro anesthetic.document ingresado es demasiado corto o demasiado largo (min: 3, max: 25 [caracteres]).'),

    body('anesthetic.name')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El parametro anesthetic.name ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).'),
    
    body('anesthetic.surname')
        .trim()
        .isLength({ min: 10, max: 30 })
        .withMessage('El parametro anesthetic.surname ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).'),
    //----------------------------------------------------------------------------------------------------------------//


    //----------------------------------------------------------------------------------------------------------------//
    // INJECTION:
    //----------------------------------------------------------------------------------------------------------------//
    body('injection').optional(),

    body('injection.batch')
        .optional()
        .trim()
        .isLength({ min: 10, max: 30 })
        .withMessage('El parametro injection.batch ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).'),

    body('injection.administered_volume')
        .trim()
        .isInt()
        .withMessage('El parametro injection.administered_volume debe ser numérico.'),

    body('injection.administration_time').trim(),

    body('injection.injection_technician')
        .trim()
        .isMongoId()
        .withMessage('El parametro injection.injection_technician NO es un ID MongoDB válido.'),

    body('injection.observations')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('El parametro injection.observations ingresado es demasiado corto o demasiado largo (min: 10, max: 1000 [caracteres]).'),

    // PET-CT:
    body('injection.pet_ct').optional(),

    body('injection.pet_ct.syringe_activity_full')
        .trim()
        .isInt()
        .withMessage('El parametro injection.pet_ct.syringe_activity_full debe ser numérico.'),

    body('injection.pet_ct.syringe_activity_empty')
        .trim()
        .isInt()
        .withMessage('El parametro injection.pet_ct.syringe_activity_empty debe ser numérico.'),

    body('injection.pet_ct.administred_activity')
        .trim()
        .isInt()
        .withMessage('El parametro injection.pet_ct.administred_activity debe ser numérico.'),

    body('injection.pet_ct.syringe_full_time').trim(),

    body('injection.pet_ct.syringe_empty_time').trim(),
    //----------------------------------------------------------------------------------------------------------------//


    //----------------------------------------------------------------------------------------------------------------//
    // ACQUISITION:
    //----------------------------------------------------------------------------------------------------------------//
    body('acquisition').optional(),

    body('acquisition.time').trim(),

    body('acquisition.console_technician')
        .trim()
        .isMongoId()
        .withMessage('El parametro acquisition.console_technician NO es un ID MongoDB válido.'),

    body('acquisition.observations')
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