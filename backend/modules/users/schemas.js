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
    permissions:        { type: [subSchemaPermissions] },
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
    Plural      : 'fk_users'
};

//Register allowed unset values:
const AllowedUnsetValues = [];
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

    body('permissions').optional().isArray(),

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