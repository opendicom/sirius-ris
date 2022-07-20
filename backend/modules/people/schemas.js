//--------------------------------------------------------------------------------------------------------------------//
// PEOPLE SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Define Documents Sub-Schema:
const subSchemaDocuments = new mongoose.Schema({
    doc_country_code:   { type: String, required: true }, // ¯¯¯|
    doc_type:           { type: Number, required: true }, //    |--> user_id
    document:           { type: String, required: true }, // ___|
},
{ _id : false });

//Define Schema:
const Schema = new mongoose.Schema({
    documents:          { type: [subSchemaDocuments] },
    name_01:            { type: String, required: true },
    name_02:            { type: String },
    surname_01:         { type: String, required: true },
    surname_02:         { type: String },
    birth_date:         { type: Date, required: true },
    gender:             { type: Number, required: true },
    phone_numbers:      { type: [String] },
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('people', Schema, 'people'); //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_person',
    Plural      : 'fk_people'
};

//Register allowed unset values:
const AllowedUnsetValues = ['name_02', 'surname_02', 'phone_numbers'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    //Validate subSchema:
    body('documents').isArray(),

    body('documents.*.doc_country_code')
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage('El código de país del documento ingresado es demasiado corto o demasiado largo (min: 3, max: 3 [caracteres]).')
        .toLowerCase(),

    body('documents.*.doc_type')
        .trim()
        .isInt()
        .withMessage('El parametro tipo de documento es requerido y debe ser numérico.'),

    body('documents.*.document')
        .trim()
        .isLength({ min: 3, max: 25 })
        .withMessage('El documento ingresado es demasiado corto o demasiado largo (min: 3, max: 25 [caracteres]).')
        .toUpperCase(),

    //Validate Schema:
    body('name_01')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El primer nombre ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).')
        .toUpperCase(),

    body('name_02')
        .trim()
        .optional()
        .isLength({ min: 3, max: 30 })
        .withMessage('El segundo nombre ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).')
        .toUpperCase(),

    body('surname_01')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El primer apellido ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).')
        .toUpperCase(),

    body('surname_02')
        .trim()
        .optional()
        .isLength({ min: 3, max: 30 })
        .withMessage('El segundo apellido ingresado es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).')
        .toUpperCase(),

    body('birth_date').trim(),

    body('gender')
        .trim()
        .isInt()
        .withMessage('El parametro género es requerido y debe ser numérico.'),

    body('phone_numbers').optional().isArray(),

    body('phone_numbers.*')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('El número de teléfono ingresado es demasiado corto o demasiado largo (min: 3, max: 20 [caracteres]).'),
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//