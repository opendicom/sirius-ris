//--------------------------------------------------------------------------------------------------------------------//
// APPOINTMENTS DRAFTS FIND HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res, currentSchema) => {
    //Remove base64 for default projection:
    if(!req.query.proj){ req.query['proj'] = {
        'imaging.organization.base64_logo': 0,
        'imaging.organization.base64_cert': 0,
        'imaging.organization.password_cert': 0,
        'imaging.branch.base64_logo': 0,
        'referring.organization.base64_logo': 0,
        'referring.organization.base64_cert': 0,
        'referring.organization.password_cert': 0,
        'referring.branch.base64_logo': 0,
        'reporting.organization.base64_logo': 0,
        'reporting.organization.base64_cert': 0,
        'reporting.organization.password_cert': 0,
        'reporting.branch.base64_logo': 0,
    }; }
    
    //Get query params:
    let { filter, regex } = req.query;

    //Add aggregate to request:
    req.query['aggregate'] = [];

    //Set group by:
    await moduleServices.setGroup(req);

    //Add schema pipe aggregation:
    req.query.aggregate.push(
        //Appointment request (Lookup & Unwind):
        { $lookup: {
            from: 'appointment_requests',
            localField: 'fk_appointment_request',
            foreignField: '_id',
            as: 'appointment_request',
        }},
        { $unwind: { path: "$appointment_request", preserveNullAndEmptyArrays: true } },

        //------------------------------------------------------------------------------------------------------------//
        // IMAGING:
        //------------------------------------------------------------------------------------------------------------//
        //Organizations lookup:
        { $lookup: {
            from: 'organizations',
            localField: 'imaging.organization',
            foreignField: '_id',
            as: 'imaging.organization',
        }},

        //Branches lookup:
        { $lookup: {
            from: 'branches',
            localField: 'imaging.branch',
            foreignField: '_id',
            as: 'imaging.branch',
        }},

        //Services lookup:
        { $lookup: {
            from: 'services',
            localField: 'imaging.service',
            foreignField: '_id',
            as: 'imaging.service',
        }},

        //Unwind:
        { $unwind: { path: "$imaging.organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$imaging.branch", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$imaging.service", preserveNullAndEmptyArrays: true } },
        //------------------------------------------------------------------------------------------------------------//

        //Imaging -> Service -> Modality (Lookup & Unwind):
        { $lookup: {
            from: 'modalities',
            localField: 'imaging.service.fk_modality',
            foreignField: '_id',
            as: 'modality',
        }},
        { $unwind: { path: "$modality", preserveNullAndEmptyArrays: true } },

        //Patient (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'fk_patient',
            foreignField: '_id',
            as: 'patient',
        }},
        { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },

        //Patient -> Person (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'patient.fk_person',
            foreignField: '_id',
            as: 'patient.person',
        }},
        { $unwind: { path: "$patient.person", preserveNullAndEmptyArrays: true } },

        //Coordinator (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'fk_coordinator',
            foreignField: '_id',
            as: 'coordinator',
        }},
        { $unwind: { path: "$coordinator", preserveNullAndEmptyArrays: true } },

        //Patient -> Person (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'coordinator.fk_person',
            foreignField: '_id',
            as: 'coordinator.person',
        }},
        { $unwind: { path: "$coordinator.person", preserveNullAndEmptyArrays: true } },

        //Slot (Lookup & Unwind)::
        { $lookup: {
            from: 'slots',
            localField: 'fk_slot',
            foreignField: '_id',
            as: 'slot',
        }},
        { $unwind: { path: "$slot", preserveNullAndEmptyArrays: true } },

        //Equipment -> Slot (Lookup & Unwind)::
        { $lookup: {
            from: 'equipments',
            localField: 'slot.fk_equipment',
            foreignField: '_id',
            as: 'slot.equipment',
        }},
        { $unwind: { path: "$slot.equipment", preserveNullAndEmptyArrays: true } },

        //Procedure (Lookup & Unwind)::
        { $lookup: {
            from: 'procedures',
            localField: 'fk_procedure',
            foreignField: '_id',
            as: 'procedure',
        }},
        { $unwind: { path: "$procedure", preserveNullAndEmptyArrays: true } },

        //------------------------------------------------------------------------------------------------------------//
        // REMOVE DUPLICATED VALUES (SET DEFAULT PROJECTION):
        // Important note: Request project replaces the aggregation projection (This prevent mix content proj error).
        //------------------------------------------------------------------------------------------------------------//
        { $project: {
            //Self:
            'createdAt': 0,
            'updatedAt': 0,
            '__v': 0,

            // Appointment request:
            // In appointment_request createdAt are required by default.
            //'appointment_request.createdAt': 0,
            'appointment_request.updatedAt': 0,
            'appointment_request.__v': 0,

            //Imaging:
            'imaging.organization.createdAt': 0,
            'imaging.organization.updatedAt': 0,
            'imaging.organization.__v': 0,

            'imaging.branch.createdAt': 0,
            'imaging.branch.updatedAt': 0,
            'imaging.branch.__v': 0,

            'imaging.service.createdAt': 0,
            'imaging.service.updatedAt': 0,
            'imaging.service.__v': 0,

            //Referring:
            'referring.organization.createdAt': 0,
            'referring.organization.updatedAt': 0,
            'referring.organization.__v': 0,

            'referring.branch.createdAt': 0,
            'referring.branch.updatedAt': 0,
            'referring.branch.__v': 0,

            'referring.service.createdAt': 0,
            'referring.service.updatedAt': 0,
            'referring.service.__v': 0,

            'referring.fk_referring.fk_person': 0,
            'referring.fk_referring.password': 0,
            'referring.fk_referring.permissions': 0,
            'referring.fk_referring.settings': 0,
            'referring.fk_referring.createdAt': 0,
            'referring.fk_referring.updatedAt': 0,
            'referring.fk_referring.__v': 0,

            //Reporting:
            'reporting.organization.createdAt': 0,
            'reporting.organization.updatedAt': 0,
            'reporting.organization.__v': 0,

            'reporting.branch.createdAt': 0,
            'reporting.branch.updatedAt': 0,
            'reporting.branch.__v': 0,

            'reporting.service.createdAt': 0,
            'reporting.service.updatedAt': 0,
            'reporting.service.__v': 0,

            'reporting.fk_reporting.fk_person': 0,
            'reporting.fk_reporting.password': 0,
            'reporting.fk_reporting.permissions': 0,
            'reporting.fk_reporting.settings': 0,
            'reporting.fk_reporting.createdAt': 0,
            'reporting.fk_reporting.updatedAt': 0,
            'reporting.fk_reporting.__v': 0,

            //Imaging -> Service -> Modality:
            'modality.createdAt': 0,
            'modality.updatedAt': 0,
            'modality.__v': 0,

            //Patient:
            'fk_patient': 0,
            'patient.fk_person': 0,
            'patient.password': 0,
            'patient.permissions': 0,
            'patient.settings': 0,
            'patient.createdAt': 0,
            'patient.updatedAt': 0,
            'patient.__v': 0,
            'patient.person.createdAt': 0,
            'patient.person.updatedAt': 0,
            'patient.person.__v': 0,

            //Coordinator:
            'coordinator.fk_person': 0,
            'coordinator.password': 0,
            'coordinator.permissions': 0,
            'coordinator.settings': 0,
            'coordinator.createdAt': 0,
            'coordinator.updatedAt': 0,
            'coordinator.__v': 0,
            'coordinator.person.createdAt': 0,
            'coordinator.person.updatedAt': 0,
            'coordinator.person.__v': 0,

            //Slot:
            'fk_slot': 0,
            'slot.createdAt': 0,
            'slot.updatedAt': 0,
            'slot.__v': 0,

            //Slot -> Equipment:
            'slot.equipment.createdAt': 0,
            'slot.equipment.updatedAt': 0,
            'slot.equipment.__v': 0,

            //Procedure:
            'fk_procedure': 0,
            'procedure.createdAt': 0,
            'procedure.updatedAt': 0,
            'procedure.__v': 0,
            
            //Attached files:
            'attached_files.createdAt': 0,
            'attached_files.updatedAt': 0,
            'attached_files.__v': 0,

            //Consents:
            'consents.informed_consent.createdAt': 0,
            'consents.informed_consent.updatedAt': 0,
            'consents.informed_consent.__v': 0,
            'consents.clinical_trial.createdAt': 0,
            'consents.clinical_trial.updatedAt': 0,
            'consents.clinical_trial.__v': 0
        }}
        //------------------------------------------------------------------------------------------------------------//
    ); 

    //Correct data types for match operation:
    if(filter != undefined){
        //------------------------------------------------------------------------------------------------------------//
        // Adjust data types for match aggregation (Schema):
        //------------------------------------------------------------------------------------------------------------//
        filter = await moduleServices.adjustDataTypes(filter, 'appointments');

        //Appointment request:
        filter = await moduleServices.adjustDataTypes(filter, 'appointment_requests', 'appointment_request');

        //Imaging:
        filter = await moduleServices.adjustDataTypes(filter, 'organizations', 'imaging.organization');
        filter = await moduleServices.adjustDataTypes(filter, 'branches', 'imaging.branch');
        filter = await moduleServices.adjustDataTypes(filter, 'services', 'imaging.service');

        //Schema:
        filter = await moduleServices.adjustDataTypes(filter, 'modalities', 'modality');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'patient');
        filter = await moduleServices.adjustDataTypes(filter, 'people', 'patient.person');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'coordinator');
        filter = await moduleServices.adjustDataTypes(filter, 'people', 'coordinator.person');
        filter = await moduleServices.adjustDataTypes(filter, 'slots', 'slot');
        filter = await moduleServices.adjustDataTypes(filter, 'equipments', 'slot.equipment');
        filter = await moduleServices.adjustDataTypes(filter, 'procedures', 'procedure');
        //------------------------------------------------------------------------------------------------------------//

        //Set condition:
        const condition = await moduleServices.setCondition(filter, regex);

        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: condition });
    }

    //Excecute main query:
    await moduleServices.findAggregation(req, res, currentSchema);
}
//--------------------------------------------------------------------------------------------------------------------//