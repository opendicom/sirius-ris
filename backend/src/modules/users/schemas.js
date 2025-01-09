//--------------------------------------------------------------------------------------------------------------------//
// USERS SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');
const middlewares   = require('../../main.middlewares');

//Define Privileges Sub-Schema:
const subSchemaPermissions = new mongoose.Schema({
    organization:   { type: mongoose.ObjectId },
    branch:         { type: mongoose.ObjectId },
    service:        { type: mongoose.ObjectId },
    role:           { type: Number, required: true },
    concession:     { type: [Number] }
},
{ _id : false });

//Define Professional Sub-Schema:
const subSchemaProfessional = new mongoose.Schema({
    id:             { type: String },
    description:    { type: String },
    workload:       { type: Number }, //In weekly hours.
    vacation:       { type: Boolean }
},
{ _id : false });

//Define Settings Sub-Schema:
const subSchemaSettings = new mongoose.Schema({
    max_row:        { type: String },
    viewer:         { type: Number },
    language:       { type: String },
    theme:          { type: Number }
},
{ _id : false });

//Define Pre-Schema:
const preSchema = new mongoose.Schema({
    fk_person:          { type: mongoose.ObjectId },    // Human user
    username:           { type: String },               // Machine user
    password:           { type: String, required: true },
    email:              { type: String, match: /.+\@.+\..+/ },  // Required only in frontend (Human user).
    permissions:        { type: [subSchemaPermissions], required: true },
    professional:       { type: subSchemaProfessional },
    settings:           { type: [subSchemaSettings] },
    status:             { type: Boolean, required: true, default: false },
},
{ timestamps: true },
{ versionKey: false });

//Indicate that the schema has a password (to be encrypted):
Schema = middlewares.isPassword(preSchema, 'password');

//Define model:
const Model = mongoose.model('users', Schema, 'users');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_user',
    Plural      : 'fk_users',
    Patient     : 'fk_patient',
    Referring   : 'fk_referring',
    Reporting   : 'fk_reporting',
    Injection   : 'injection_user',
    Laboratory  : 'laboratory_user',
    Console     : 'console_technician'
};

//Register allowed unset values:
const AllowedUnsetValues = ['email', 'professional.id', 'professional.description', 'professional.workload', 'professional.vacation'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('fk_person')
        .optional()
        .trim()
        .isMongoId()
        .withMessage('El parametro fk_person NO es un ID MongoDB válido.'),

    body('username')
        .optional()
        .trim(),
    
    body('password')
        .trim()
        .isLength(8)
        .withMessage('La contraseña ingresada es demasiado corta (largo mínimo: 8 caracteres).'),

    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('El valor ingresado NO es una dirección de correo válida.')
        .normalizeEmail({ gmail_remove_dots: false })
        .toLowerCase(),
        
    body('permissions')
        .isArray()
        .withMessage('El parametro permissions es requerido.'),

    body('permissions.*.organization')
        .optional()
        .trim()
        .isMongoId()
        .withMessage('El parametro organization NO es un ID MongoDB válido.'),

    body('permissions.*.service')
        .optional()
        .trim()
        .isMongoId()
        .withMessage('El parametro service NO es un ID MongoDB válido.'),

    body('permissions.*.branch')
        .optional()
        .trim()
        .isMongoId()
        .withMessage('El parametro branch NO es un ID MongoDB válido.'),

    body('permissions.*.role')
        .trim()
        .isInt()
        .withMessage('El parametro rol es requerido y debe ser numérico.'),

    body('permissions.*.concession').optional().isArray(),

    body('professional').optional(),

    body('professional.id')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El parametro ID es demasiado corto o demasiado largo (min: 3, max: 30 [caracteres]).'),

    body('professional.description')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('El parametro description es demasiado corto o demasiado largo (min: 3, max: 50 [caracteres]).'),

    body('professional.workload')
        .optional()
        .trim()
        .isInt()
        .withMessage('El parametro workload debe ser numérico.'),

    body('professional.vacation')
        .optional()
        .trim()
        .isBoolean()
        .withMessage('El parametro vacation ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean(),

    body('settings').optional().isArray(),

    body('settings.*.max_row')
        .optional()
        .trim()
        .isInt()
        .withMessage('El parametro max_row es requerido y debe ser numérico.'),

    body('settings.*.viewer')
        .optional()
        .trim()
        .isInt()
        .withMessage('El parametro viewer debe ser numérico.'),

    body('settings.*.language')
        .optional()
        .trim()
        .isInt()
        .withMessage('El parametro language es requerido y debe ser numérico.'),

    body('settings.*.theme')
        .optional()
        .trim()
        .isInt()
        .withMessage('El parametro theme es requerido y debe ser numérico.'),

    body('status')
        .trim()
        .isBoolean()
        .withMessage('El estado ingresado no es de tipo booleano (verdadero o falso).')
        .toBoolean()
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//