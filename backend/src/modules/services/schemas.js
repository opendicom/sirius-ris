//--------------------------------------------------------------------------------------------------------------------//
// SERVICES SCHEMAS:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const mongoose      = require('mongoose');
const { body }      = require('express-validator');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Define calendar options sub-schema (FullCalendar defaults per service):
const subSchemaCalendarOptions = new mongoose.Schema({
    initialView:    { type: String, required: true }, // FullCalendar initial view (resourceTimeGridDay | resourceTimeGridWeek)
    slotMinTime:    { type: String, required: true }, // First visible time slot (HH:MM:SS)
    slotMaxTime:    { type: String, required: true }, // Last visible time slot (HH:MM:SS)
    slotDuration:   { type: String, required: true }, // Duration of each time slot (HH:MM:SS)
}, { _id: false });

//Define Schema:
const Schema = new mongoose.Schema({
    fk_branch:      { type: mongoose.ObjectId, required: true },
    fk_modality:    { type: mongoose.ObjectId, required: true },
    fk_equipments:  { type: [mongoose.ObjectId], required: true },
    name:           { type: String, required: true },
    status:         { type: Boolean, required: true, default: false },
    calendarOptions:{ type: subSchemaCalendarOptions, required: false },
},
{ timestamps: true },
{ versionKey: false });

//Define model:
const Model = mongoose.model('services', Schema, 'services');  //Specify collection name to prevent Mongoose pluralize.

//Add fk names (Sirius RIS logic):
const ForeignKeys = {
    Singular    : 'fk_service',
    Plural      : 'fk_services',
    Domain      : 'domain.service',
    Imaging     : 'imaging.service',
    Referring   : 'referring.service',
    Reporting   : 'reporting.service'
};

//Register allowed unset values (unset calendarOptions = back to the global FullCalendar defaults):
const AllowedUnsetValues = ['calendarOptions'];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATION RULES (EXPRESS-VALIDATOR):
//--------------------------------------------------------------------------------------------------------------------//
const Validator = [
    body('fk_branch')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_branch" (ObjectId).'),

    body('fk_modality')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_modality" (ObjectId).'),

    body('fk_equipments')
        .isArray()
        .withMessage(currentLang.ris.schema_validator.isRequired + '"fk_equipments".'),

    body('fk_equipments.*')
        .trim()
        .isMongoId()
        .withMessage(currentLang.ris.schema_validator.isMongoId + ' | "fk_equipments" (ObjectId).'),

    body('name')
        .trim()
        .isLength({ min: 3, max: 64 })
        .withMessage(currentLang.ris.schema_validator.isLength + ' | "name" (min: 3, max: 64 [chars]).'),

    body('status')
        .trim()
        .isBoolean()
        .withMessage(currentLang.ris.schema_validator.isBoolean + ' | "status" (true or false).')
        .toBoolean(),

    // Calendar options (FullCalendar defaults per service):
    body('calendarOptions')
        .optional(),

    body('calendarOptions.initialView')
        .if(body('calendarOptions').exists())   // Check if parent exists
        .isIn(['resourceTimeGridDay', 'resourceTimeGridWeek'])
        .withMessage(currentLang.ris.schema_validator.isRequired + '"calendarOptions.initialView" (resourceTimeGridDay | resourceTimeGridWeek).'),

    body('calendarOptions.slotMinTime')
        .if(body('calendarOptions').exists())   // Check if parent exists
        .matches(/^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .withMessage(currentLang.ris.schema_validator.isRequiredTime + ' | "calendarOptions.slotMinTime" [Format: HH:MM:SS | 24 hs].'),

    body('calendarOptions.slotMaxTime')
        .if(body('calendarOptions').exists())   // Check if parent exists
        .matches(/^(([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]|24:00:00)$/)    // FullCalendar allows 24:00:00 as end of day
        .withMessage(currentLang.ris.schema_validator.isRequiredTime + ' | "calendarOptions.slotMaxTime" [Format: HH:MM:SS | 24 hs].')
        .custom((value, { req }) => {
            //Min time must be before max time (compare only if both are valid times, otherwise their own rules report it):
            const minTime = req.body.calendarOptions?.slotMinTime;
            const timeRegex = /^(([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]|24:00:00)$/;

            return !timeRegex.test(minTime) || !timeRegex.test(value) || minTime < value;   // Strict format (HH:MM:SS) makes strings comparable
        })
        .withMessage('"calendarOptions.slotMinTime" must be earlier than "calendarOptions.slotMaxTime".'),

    body('calendarOptions.slotDuration')
        .if(body('calendarOptions').exists())   // Check if parent exists
        .matches(/^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .withMessage(currentLang.ris.schema_validator.isRequiredTime + ' | "calendarOptions.slotDuration" [Format: HH:MM:SS | 24 hs].')
        .not().equals('00:00:00')   // A slot cannot last 0 seconds
        .withMessage('"calendarOptions.slotDuration" must be greater than 00:00:00.')
];
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export Shcema, Model and Validation Rules:
module.exports = { Schema, Model, Validator, ForeignKeys, AllowedUnsetValues };
//--------------------------------------------------------------------------------------------------------------------//