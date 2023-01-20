//--------------------------------------------------------------------------------------------------------------------//
// REPORTS SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Define Findings Sub-Schema:
const subSchemaFindings = new mongoose.Schema({
    fk_procedure:           { type: mongoose.ObjectId, required: true },
    title:                  { type: String, required: true },
    procedure_findings:     { type: String, required: true }
},
{ _id : false });

//Define Schema:
const Schema = new mongoose.Schema({
    fk_performing:          { type: mongoose.ObjectId, required: true },
    flow_state:             { type: String, required: true },
    clinical_info:          { type: String, required: true },
    procedure_description:  { type: String, required: true },
    findings:               { type: [subSchemaFindings] },
    sumary:                 { type: String },
    medical_signatures:     { type: [mongoose.ObjectId] },
    pathologies:            { type: [mongoose.ObjectId] }
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('reports', Schema, 'reports');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_report',
    Plural      : 'fk_reports'
};

//Register allowed unset values:
const AllowedUnsetValues = ['findings', 'medical_signatures', 'pathologies'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('fk_performing')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_performing NO es un ID MongoDB válido.'),

    body('flow_state')
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage('El parametro flow_state ingresado es demasiado corto o demasiado largo (min: 3, max: 3 [caracteres]).'),

    body('clinical_info')
        .trim()
        .isLength({ min: 10, max: 10000 })
        .withMessage('El parametro clinical_info ingresado es demasiado corto o demasiado largo (min: 10, max: 10000 [caracteres]).'),

    body('procedure_description')
        .trim()
        .isLength({ min: 10, max: 10000 })
        .withMessage('El parametro procedure_description ingresado es demasiado corto o demasiado largo (min: 10, max: 10000 [caracteres]).'),

    body('findings').optional().isArray(),

    body('findings.*.fk_procedure')
        .if(body('findings').exists())   // Check if parent exists.
        .trim()
        .isMongoId()
        .withMessage('El parametro findings.*.fk_procedure NO es un ID MongoDB válido.'),

    body('findings.*.procedure_findings')
        .if(body('findings').exists())   // Check if parent exists.
        .trim()
        .isLength({ min: 10, max: 10000 })
        .withMessage('El parametro findings.*.procedure_findings ingresado es demasiado corto o demasiado largo (min: 10, max: 10000 [caracteres]).'),

    body('findings.*.title')
        .if(body('findings').exists())   // Check if parent exists.
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('El parametro findings.*.title ingresado es demasiado corto o demasiado largo (min: 3, max: 50 [caracteres]).'),

    body('sumary')
        .optional()
        .trim()
        .isLength({ min: 10, max: 10000 })
        .withMessage('El parametro sumary ingresado es demasiado corto o demasiado largo (min: 10, max: 10000 [caracteres]).'),

    body('medical_signatures')
        .optional()
        .isArray(),

    body('medical_signatures.*')
        .trim()
        .isMongoId()
        .withMessage('El parametro medical_signatures NO es un ID MongoDB válido.'),

    body('pathologies')
        .optional()
        .isArray(),
    
    body('pathologies.*')
        .trim()
        .isMongoId()
        .withMessage('El parametro pathologies NO es un ID MongoDB válido.'),
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//