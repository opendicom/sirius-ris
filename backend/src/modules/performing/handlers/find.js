//--------------------------------------------------------------------------------------------------------------------//
// PERFORMING FIND HANDLER:
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
        'appointment.imaging.organization.base64_logo': 0,
        'appointment.imaging.organization.base64_cert': 0,
        'appointment.imaging.organization.password_cert': 0,
        'appointment.imaging.branch.base64_logo': 0,
        'appointment.referring.organization.base64_logo': 0,
        'appointment.referring.organization.base64_cert': 0,
        'appointment.referring.organization.password_cert': 0,
        'appointment.referring.branch.base64_logo': 0,
        'appointment.reporting.organization.base64_logo': 0,
        'appointment.reporting.organization.base64_cert': 0,
        'appointment.reporting.organization.password_cert': 0,
        'appointment.reporting.branch.base64_logo': 0
    }; }
    
    //Get query params:
    let { filter, regex } = req.query;

    //Add aggregate to request:
    req.query['aggregate'] = [];

    //Set group by:
    await moduleServices.setGroup(req);

    //Add schema pipe aggregation:
    req.query.aggregate.push(
        //Appointment (Lookup & Unwind):
        { $lookup: {
            from: 'appointments',
            localField: 'fk_appointment',
            foreignField: '_id',
            as: 'appointment',
        }},
        { $unwind: { path: "$appointment", preserveNullAndEmptyArrays: true } },

        //------------------------------------------------------------------------------------------------------------//
        // APPOINTMENT IMAGING:
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
        // APPOINTMENT REFERRING:
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
        // APPOINTMENT REPORTING:
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
        // APPOINTMENT PATIENT:
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

        //------------------------------------------------------------------------------------------------------------//
        // APPOINTMENT ATTACHED FILES:
        //------------------------------------------------------------------------------------------------------------//
        //Attached files lookup [Array]:
        { $lookup: {
            from: 'files',
            localField: 'appointment.attached_files',
            foreignField: '_id',
            as: 'appointment.attached_files'
        }},
        //------------------------------------------------------------------------------------------------------------//

        //Equipment (Lookup & Unwind):
        { $lookup: {
            from: 'equipments',
            localField: 'fk_equipment',
            foreignField: '_id',
            as: 'equipment',
        }},
        { $unwind: { path: "$equipment", preserveNullAndEmptyArrays: true } },

        //Procedure (Lookup & Unwind):
        { $lookup: {
            from: 'procedures',
            localField: 'fk_procedure',
            foreignField: '_id',
            as: 'procedure',
        }},
        { $unwind: { path: "$procedure", preserveNullAndEmptyArrays: true } },
        
        //Procedure -> Modality (Lookup & Unwind):
        { $lookup: {
            from: 'modalities',
            localField: 'procedure.fk_modality',
            foreignField: '_id',
            as: 'modality',
        }},
        { $unwind: { path: "$modality", preserveNullAndEmptyArrays: true } },

        //Injection user (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'injection.injection_user',
            foreignField: '_id',
            as: 'injection.injection_user',
        }},
        { $unwind: { path: "$injection.injection_user", preserveNullAndEmptyArrays: true } },

        //Injection user (User) -> People (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'injection.injection_user.fk_person',
            foreignField: '_id',
            as: 'injection.injection_user.person',
        }},
        { $unwind: { path: "$injection.injection_user.person", preserveNullAndEmptyArrays: true } },

        //PET-CT Laboratory user (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'injection.pet_ct.laboratory_user',
            foreignField: '_id',
            as: 'injection.pet_ct.laboratory_user',
        }},
        { $unwind: { path: "$injection.pet_ct.laboratory_user", preserveNullAndEmptyArrays: true } },

        //PET-CT Laboratory user (User) -> People (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'injection.pet_ct.laboratory_user.fk_person',
            foreignField: '_id',
            as: 'injection.pet_ct.laboratory_user.person',
        }},
        { $unwind: { path: "$injection.pet_ct.laboratory_user.person", preserveNullAndEmptyArrays: true } },

        //Acquisition console technician Users (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'acquisition.console_technician',
            foreignField: '_id',
            as: 'acquisition.console_technician',
        }},
        { $unwind: { path: "$acquisition.console_technician", preserveNullAndEmptyArrays: true } },

        //Acquisition console technician (User) -> People (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'acquisition.console_technician.fk_person',
            foreignField: '_id',
            as: 'acquisition.console_technician.person',
        }},
        { $unwind: { path: "$acquisition.console_technician.person", preserveNullAndEmptyArrays: true } },

        //------------------------------------------------------------------------------------------------------------//
        // REMOVE DUPLICATED VALUES (SET DEFAULT PROJECTION):
        // Important note: Request project replaces the aggregation projection (This prevent mix content proj error).
        //------------------------------------------------------------------------------------------------------------//
        { $project: {
            //Self:
            'createdAt': 0,
            'updatedAt': 0,
            '__v': 0,

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
            'injection.injection_user.fk_person': 0,
            'injection.injection_user.password': 0,
            'injection.injection_user.permissions': 0,
            'injection.injection_user.settings': 0,
            'injection.injection_user.createdAt': 0,
            'injection.injection_user.updatedAt': 0,
            'injection.injection_user.__v': 0,
            'injection.injection_user.person.createdAt': 0,
            'injection.injection_user.person.updatedAt': 0,
            'injection.injection_user.person.__v': 0,

            //PET-CT Laboratory user:
            'injection.pet_ct.laboratory_user.fk_person': 0,
            'injection.pet_ct.laboratory_user.password': 0,
            'injection.pet_ct.laboratory_user.permissions': 0,
            'injection.pet_ct.laboratory_user.settings': 0,
            'injection.pet_ct.laboratory_user.createdAt': 0,
            'injection.pet_ct.laboratory_user.updatedAt': 0,
            'injection.pet_ct.laboratory_user.__v': 0,
            'injection.pet_ct.laboratory_user.person.createdAt': 0,
            'injection.pet_ct.laboratory_user.person.updatedAt': 0,
            'injection.pet_ct.laboratory_user.person.__v': 0,

            //Acquisition:
            'acquisition.console_technician.fk_person': 0,
            'acquisition.console_technician.password': 0,
            'acquisition.console_technician.permissions': 0,
            'acquisition.console_technician.settings': 0,
            'acquisition.console_technician.createdAt': 0,
            'acquisition.console_technician.updatedAt': 0,
            'acquisition.console_technician.__v': 0,
            'acquisition.console_technician.person.createdAt': 0,
            'acquisition.console_technician.person.updatedAt': 0,
            'acquisition.console_technician.person.__v': 0
        }}
        //------------------------------------------------------------------------------------------------------------//
    );

    //Correct data types for match operation:
    if(filter != undefined){
        //Adjust data types for match aggregation (Schema):
        filter = await moduleServices.adjustDataTypes(filter, 'performing');
        filter = await moduleServices.adjustDataTypes(filter, 'appointments', 'appointment');
        filter = await moduleServices.adjustDataTypes(filter, 'equipments', 'equipment');
        filter = await moduleServices.adjustDataTypes(filter, 'procedures', 'procedure');
        filter = await moduleServices.adjustDataTypes(filter, 'modalities', 'modality');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'patient');
        filter = await moduleServices.adjustDataTypes(filter, 'people', 'patient.person');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'injection.injection_user');
        filter = await moduleServices.adjustDataTypes(filter, 'people', 'injection.injection_user.person');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'injection.pet_ct.laboratory_user');
        filter = await moduleServices.adjustDataTypes(filter, 'people', 'injection.pet_ct.laboratory_user.person');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'acquisition.console_technician');
        filter = await moduleServices.adjustDataTypes(filter, 'people', 'acquisition.console_technician.person');

        //Set condition:
        const condition = await moduleServices.setCondition(filter, regex);

        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: condition });
    }

    //Excecute main query:
    await moduleServices.findAggregation(req, res, currentSchema);
}
//--------------------------------------------------------------------------------------------------------------------//