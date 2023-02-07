//--------------------------------------------------------------------------------------------------------------------//
// REPORTS FIND HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res, currentSchema) => {
    //Get query params:
    let { filter, regex } = req.query;

    //Add aggregate to request:
    req.query['aggregate'] = [
        //Performing (Lookup & Unwind):
        { $lookup: {
            from: 'performing',
            localField: 'fk_performing',
            foreignField: '_id',
            as: 'performing',
        }},
        { $unwind: { path: "$performing", preserveNullAndEmptyArrays: true } },

        //Performing -> Appointment (Lookup & Unwind):
        { $lookup: {
            from: 'appointments',
            localField: 'performing.fk_appointment',
            foreignField: '_id',
            as: 'appointment',
        }},
        { $unwind: { path: "$appointment", preserveNullAndEmptyArrays: true } },

        //------------------------------------------------------------------------------------------------------------//
        // PERFORMING -> APPOINTMENT IMAGING:
        //------------------------------------------------------------------------------------------------------------//
        //Organizations lookup:
        { $lookup: {
            from: 'organizations',
            localField: 'appointment.imaging.organization',
            foreignField: '_id',
            as: 'appointment.imaging.organization',
        }},

        //Branches lookup:
        { $lookup: {
            from: 'branches',
            localField: 'appointment.imaging.branch',
            foreignField: '_id',
            as: 'appointment.imaging.branch',
        }},

        //Services lookup:
        { $lookup: {
            from: 'services',
            localField: 'appointment.imaging.service',
            foreignField: '_id',
            as: 'appointment.imaging.service',
        }},

        //Unwind:
        { $unwind: { path: "$appointment.imaging.organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.imaging.branch", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.imaging.service", preserveNullAndEmptyArrays: true } },
        //------------------------------------------------------------------------------------------------------------//

        //------------------------------------------------------------------------------------------------------------//
        // PERFORMING -> APPOINTMENT REFERRING:
        //------------------------------------------------------------------------------------------------------------//
        //Organizations lookup:
        { $lookup: {
            from: 'organizations',
            localField: 'appointment.referring.organization',
            foreignField: '_id',
            as: 'appointment.referring.organization',
        }},

        //Branches lookup:
        { $lookup: {
            from: 'branches',
            localField: 'appointment.referring.branch',
            foreignField: '_id',
            as: 'appointment.referring.branch',
        }},

        //Services lookup:
        { $lookup: {
            from: 'services',
            localField: 'appointment.referring.service',
            foreignField: '_id',
            as: 'appointment.referring.service',
        }},

        //Users lookup:
        { $lookup: {
            from: 'users',
            localField: 'appointment.referring.fk_referring',
            foreignField: '_id',
            as: 'appointment.referring.fk_referring',
        }},

        //Unwind:
        { $unwind: { path: "$appointment.referring.organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.referring.branch", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.referring.service", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.referring.fk_referring", preserveNullAndEmptyArrays: true } },
        //------------------------------------------------------------------------------------------------------------//

        //------------------------------------------------------------------------------------------------------------//
        // PERFORMING -> APPOINTMENT REPORTING:
        //------------------------------------------------------------------------------------------------------------//
        //Organizations lookup:
        { $lookup: {
            from: 'organizations',
            localField: 'appointment.reporting.organization',
            foreignField: '_id',
            as: 'appointment.reporting.organization',
        }},

        //Branches lookup:
        { $lookup: {
            from: 'branches',
            localField: 'appointment.reporting.branch',
            foreignField: '_id',
            as: 'appointment.reporting.branch',
        }},

        //Services lookup:
        { $lookup: {
            from: 'services',
            localField: 'appointment.reporting.service',
            foreignField: '_id',
            as: 'appointment.reporting.service',
        }},

        //Users lookup:
        { $lookup: {
            from: 'users',
            localField: 'appointment.reporting.fk_reporting',
            foreignField: '_id',
            as: 'appointment.reporting.fk_reporting',
        }},

        //Unwind:
        { $unwind: { path: "$appointment.reporting.organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.reporting.branch", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.reporting.service", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.reporting.fk_reporting", preserveNullAndEmptyArrays: true } },
        //------------------------------------------------------------------------------------------------------------//

        //------------------------------------------------------------------------------------------------------------//
        // PERFORMING -> APPOINTMENT PATIENT:
        //------------------------------------------------------------------------------------------------------------//
        //Patient (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'appointment.fk_patient',
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
        //------------------------------------------------------------------------------------------------------------//

        //Performing Equipment (Lookup & Unwind):
        { $lookup: {
            from: 'equipments',
            localField: 'performing.fk_equipment',
            foreignField: '_id',
            as: 'equipment',
        }},
        { $unwind: { path: "$equipment", preserveNullAndEmptyArrays: true } },

        //Performing Procedure (Lookup & Unwind):
        { $lookup: {
            from: 'procedures',
            localField: 'performing.fk_procedure',
            foreignField: '_id',
            as: 'procedure',
        }},
        { $unwind: { path: "$procedure", preserveNullAndEmptyArrays: true } },
        
        //Performing Procedure -> Modality (Lookup & Unwind):
        { $lookup: {
            from: 'modalities',
            localField: 'procedure.fk_modality',
            foreignField: '_id',
            as: 'modality',
        }},
        { $unwind: { path: "$modality", preserveNullAndEmptyArrays: true } },

        //Performing Injection technician Users (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'performing.injection.injection_user',
            foreignField: '_id',
            as: 'performing.injection.injection_user',
        }},
        { $unwind: { path: "$performing.injection.injection_user", preserveNullAndEmptyArrays: true } },

        //Performing Injection technician (User) -> People (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'performing.injection.injection_user.fk_person',
            foreignField: '_id',
            as: 'performing.injection.injection_user.person',
        }},
        { $unwind: { path: "$performing.injection.injection_user.person", preserveNullAndEmptyArrays: true } },

        //Performing Acquisition console technician Users (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'performing.acquisition.console_technician',
            foreignField: '_id',
            as: 'performing.acquisition.console_technician',
        }},
        { $unwind: { path: "$performing.acquisition.console_technician", preserveNullAndEmptyArrays: true } },

        //Performing Acquisition console technician (User) -> People (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'performing.acquisition.console_technician.fk_person',
            foreignField: '_id',
            as: 'performing.acquisition.console_technician.person',
        }},
        { $unwind: { path: "$performing.acquisition.console_technician.person", preserveNullAndEmptyArrays: true } },

        //------------------------------------------------------------------------------------------------------------//
        // REMOVE DUPLICATED VALUES (SET DEFAULT PROJECTION):
        // Important note: Request project replaces the aggregation projection (This prevent mix content proj error).
        //------------------------------------------------------------------------------------------------------------//
        { $project: {
            //Self:
            'createdAt': 0,
            'updatedAt': 0,
            '__v': 0,

            //Performing:
            'performing.createdAt': 0,
            'performing.updatedAt': 0,
            'performing.__v': 0,

            //Appointment:
            'appointment.createdAt': 0,
            'appointment.updatedAt': 0,
            'appointment.__v': 0,

            //Appointment patient:
            'appointment.fk_patient': 0,
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

            //Appointment imaging:
            'appointment.imaging.organization.createdAt': 0,
            'appointment.imaging.organization.updatedAt': 0,
            'appointment.imaging.organization.__v': 0,

            'appointment.imaging.branch.createdAt': 0,
            'appointment.imaging.branch.updatedAt': 0,
            'appointment.imaging.branch.__v': 0,

            'appointment.imaging.service.createdAt': 0,
            'appointment.imaging.service.updatedAt': 0,
            'appointment.imaging.service.__v': 0,

            //Appointment referring:
            'appointment.referring.organization.createdAt': 0,
            'appointment.referring.organization.updatedAt': 0,
            'appointment.referring.organization.__v': 0,

            'appointment.referring.branch.createdAt': 0,
            'appointment.referring.branch.updatedAt': 0,
            'appointment.referring.branch.__v': 0,

            'appointment.referring.service.createdAt': 0,
            'appointment.referring.service.updatedAt': 0,
            'appointment.referring.service.__v': 0,

            'appointment.referring.fk_referring.fk_person': 0,
            'appointment.referring.fk_referring.password': 0,
            'appointment.referring.fk_referring.permissions': 0,
            'appointment.referring.fk_referring.settings': 0,
            'appointment.referring.fk_referring.createdAt': 0,
            'appointment.referring.fk_referring.updatedAt': 0,
            'appointment.referring.fk_referring.__v': 0,

            //Appointment reporting:
            'appointment.reporting.organization.createdAt': 0,
            'appointment.reporting.organization.updatedAt': 0,
            'appointment.reporting.organization.__v': 0,

            'appointment.reporting.branch.createdAt': 0,
            'appointment.reporting.branch.updatedAt': 0,
            'appointment.reporting.branch.__v': 0,

            'appointment.reporting.service.createdAt': 0,
            'appointment.reporting.service.updatedAt': 0,
            'appointment.reporting.service.__v': 0,

            'appointment.reporting.fk_reporting.fk_person': 0,
            'appointment.reporting.fk_reporting.password': 0,
            'appointment.reporting.fk_reporting.permissions': 0,
            'appointment.reporting.fk_reporting.settings': 0,
            'appointment.reporting.fk_reporting.createdAt': 0,
            'appointment.reporting.fk_reporting.updatedAt': 0,
            'appointment.reporting.fk_reporting.__v': 0,

            //Equipment:
            'equipment.createdAt': 0,
            'equipment.updatedAt': 0,
            'equipment.__v': 0,

            //Procedure:
            'procedure.createdAt': 0,
            'procedure.updatedAt': 0,
            'procedure.__v': 0,

            //Procedure Modality:
            'modality.createdAt': 0,
            'modality.updatedAt': 0,
            'modality.__v': 0,

            //Injection:
            'performing.injection.injection_user.fk_person': 0,
            'performing.injection.injection_user.password': 0,
            'performing.injection.injection_user.permissions': 0,
            'performing.injection.injection_user.settings': 0,
            'performing.injection.injection_user.createdAt': 0,
            'performing.injection.injection_user.updatedAt': 0,
            'performing.injection.injection_user.__v': 0,
            'performing.injection.injection_user.person.createdAt': 0,
            'performing.injection.injection_user.person.updatedAt': 0,
            'performing.injection.injection_user.person.__v': 0,

            //Acquisition:
            'performing.acquisition.console_technician.fk_person': 0,
            'performing.acquisition.console_technician.password': 0,
            'performing.acquisition.console_technician.permissions': 0,
            'performing.acquisition.console_technician.settings': 0,
            'performing.acquisition.console_technician.createdAt': 0,
            'performing.acquisition.console_technician.updatedAt': 0,
            'performing.acquisition.console_technician.__v': 0,
            'performing.acquisition.console_technician.person.createdAt': 0,
            'performing.acquisition.console_technician.person.updatedAt': 0,
            'performing.acquisition.console_technician.person.__v': 0
        }}
        //------------------------------------------------------------------------------------------------------------//
    ];    

    //Correct data types for match operation:
    if(filter != undefined){
        //Adjust data types for match aggregation (Schema):
        filter = await moduleServices.adjustDataTypes(filter, 'reports');
        filter = await moduleServices.adjustDataTypes(filter, 'performing', 'performing');
        filter = await moduleServices.adjustDataTypes(filter, 'appointments', 'appointment');
        filter = await moduleServices.adjustDataTypes(filter, 'equipments', 'equipment');
        filter = await moduleServices.adjustDataTypes(filter, 'procedures', 'procedure');
        filter = await moduleServices.adjustDataTypes(filter, 'modalities', 'modality');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'patient');
        filter = await moduleServices.adjustDataTypes(filter, 'people', 'patient.person');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'performing.injection.injection_user');
        filter = await moduleServices.adjustDataTypes(filter, 'people', 'performing.injection.injection_user.person');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'performing.acquisition.console_technician');
        filter = await moduleServices.adjustDataTypes(filter, 'people', 'performing.acquisition.console_technician.person');

        //Set condition:
        const condition = await moduleServices.setCondition(filter, regex);

        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: condition });
    }

    //Excecute main query:
    await moduleServices.findAggregation(req, res, currentSchema);
}
//--------------------------------------------------------------------------------------------------------------------//