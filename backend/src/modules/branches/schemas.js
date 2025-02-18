//--------------------------------------------------------------------------------------------------------------------//
// BRANCHES SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Define Schema:
const Schema = new mongoose.Schema({
    fk_organization:        { type: mongoose.ObjectId, required: true },
    name:                   { type: String, required: true },
    short_name:             { type: String, required: true },
    OID:                    { type: String },
    country_code:           { type: String, required: true },
    structure_id:           { type: String },
    suffix:                 { type: String },
    status:                 { type: Boolean, required: true, default: false },
    base64_logo:            { type: String }, //This parameter is created in backend server (not validate).
    appointment_footer:     { type: String }
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('branches', Schema, 'branches');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_branch',
    Plural      : 'fk_branches',
    Domain      : 'domain.branch',
    Imaging     : 'imaging.branch',
    Referring   : 'referring.branch',
    Reporting   : 'reporting.branch'
};

//Register allowed unset values:
const AllowedUnsetValues = ['OID', 'structure_id', 'suffix', 'base64_logo', 'appointment_footer'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('fk_organization')
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_organization NO es un ID MongoDB válido.'),

    body('name')
        .trim()
        .isLength({ min: 3, max: 64 })
        .withMessage('El nombre ingresado es demasiado corto o demasiado largo (min: 3, max: 64 [caracteres]).'),

    body('short_name')
        .trim()
        .isLength({ min: 3, max: 32 })
        .withMessage('El primer nombre corto ingresado es demasiado corto o demasiado largo (min: 3, max: 32 [caracteres]).'),

    body('OID')
        .optional()
        .trim()
        .isLength({ min: 1, max: 64 })
        .withMessage('El OID ingresado es demasiado corto o demasiado largo (min: 3, max: 64 [caracteres]).'),

    body('country_code')
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage('El código de país ingresado es demasiado corto o demasiado largo (min: 3, max: 3 [caracteres]).')
        .toLowerCase(),

    body('structure_id')
        .optional()
        .trim()
        .isLength({ min: 1, max: 64 })
        .withMessage('El ID de Estructura ingresado es demasiado corto o demasiado largo (min: 3, max: 64 [caracteres]).'),

    body('suffix')
        .optional()
        .trim()
        .isLength({ min: 1, max: 64 })
        .withMessage('El suffix ingresado es demasiado corto o demasiado largo (min: 3, max: 64 [caracteres]).'),

    body('status')
        .trim()
        .isBoolean()
        .withMessage('El estado ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('base64_logo')
        .optional(),

    body('appointment_footer')
        .optional()
        .trim()
        .isLength({ min: 10, max: 3000 })
        .withMessage('El parametro appointment_footer ingresado es demasiado corto o demasiado largo (min: 10, max: 3000 [caracteres]).'),
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//