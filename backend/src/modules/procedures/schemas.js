//--------------------------------------------------------------------------------------------------------------------//
// PROCEDURES SCHEMA:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

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
    informed_consent:   { type: Boolean, required: true },
    status:             { type: Boolean, required: true, default: false },
    coefficient:        { type: Number }
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
const AllowedUnsetValues = ['code', 'snomed', 'preparation', 'procedure_template'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('domain.organization')
        .trim()
        .isMongoId()
        .withMessage('El parametro domain.organization NO es un ID MongoDB válido.'),
    
    body('domain.branch')
        .trim()
        .isMongoId()
        .withMessage('El parametro domain.branch NO es un ID MongoDB válido.'),

    body('fk_modality')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_modality NO es un ID MongoDB válido.'),

    body('name')
        .trim()
        .isLength({ min: 3, max: 64 })
        .withMessage('El nombre ingresado es demasiado corto o demasiado largo (min: 3, max: 64 [caracteres]).'),

    body('code')
        .optional()
        .trim()
        .isLength({ min: 3, max: 40 })
        .withMessage('El código ingresado es demasiado corto o demasiado largo (min: 3, max: 40 [caracteres]).'),

    body('snomed')
        .optional()
        .trim()
        .isLength({ min: 3, max: 40 })
        .withMessage('El código snomed ingresado es demasiado corto o demasiado largo (min: 3, max: 40 [caracteres]).'),

    body('equipments')
        .isArray()
        .withMessage('El parametro equipments es requerido.'),

    body('equipments.*.fk_equipment')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_equipment NO es un ID MongoDB válido.'),

    body('equipments.*.duration')
        .trim()
        .isInt()
        .withMessage('El parametro duration es requerido y debe ser numérico [minutos].'),

    body('preparation')
        .optional()
        .trim()
        .isLength({ min: 10, max: 1500 })
        .withMessage('El parametro preparation ingresado es demasiado corto o demasiado largo (min: 10, max: 1500 [caracteres]).'),

    body('procedure_template')
        .optional()
        .trim()
        .isLength({ min: 10, max: 1500 })
        .withMessage('El parametro procedure_template ingresado es demasiado corto o demasiado largo (min: 10, max: 1500 [caracteres]).'),

    body('informed_consent')
        .trim()
        .isBoolean()
        .withMessage('El parametro informed_consent ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('status')
        .trim()
        .isBoolean()
        .withMessage('El estado ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),
    
    body('coefficient')
        .optional()
        .trim()
        .isDecimal()
        .withMessage('El parametro coefficient es requerido y debe ser numérico (decimal).'),
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//