//--------------------------------------------------------------------------------------------------------------------//
// APPOINTMENTS AGREGATE:
// This aggregation is defined in a separate file for ease maintenance.
//--------------------------------------------------------------------------------------------------------------------//
module.exports = [
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

    //------------------------------------------------------------------------------------------------------------//
    // REFERRING:
    //------------------------------------------------------------------------------------------------------------//
    //Organizations lookup:
    { $lookup: {
        from: 'organizations',
        localField: 'referring.organization',
        foreignField: '_id',
        as: 'referring.organization',
    }},

    //Branches lookup:
    { $lookup: {
        from: 'branches',
        localField: 'referring.branch',
        foreignField: '_id',
        as: 'referring.branch',
    }},

    //Services lookup:
    { $lookup: {
        from: 'services',
        localField: 'referring.service',
        foreignField: '_id',
        as: 'referring.service',
    }},

    //Users lookup:
    { $lookup: {
        from: 'users',
        localField: 'referring.fk_referring',
        foreignField: '_id',
        as: 'referring.fk_referring',
    }},

    //Unwind:
    { $unwind: { path: "$referring.organization", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$referring.branch", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$referring.service", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$referring.fk_referring", preserveNullAndEmptyArrays: true } },
    //------------------------------------------------------------------------------------------------------------//

    //------------------------------------------------------------------------------------------------------------//
    // REPORTING:
    //------------------------------------------------------------------------------------------------------------//
    //Organizations lookup:
    { $lookup: {
        from: 'organizations',
        localField: 'reporting.organization',
        foreignField: '_id',
        as: 'reporting.organization',
    }},

    //Branches lookup:
    { $lookup: {
        from: 'branches',
        localField: 'reporting.branch',
        foreignField: '_id',
        as: 'reporting.branch',
    }},

    //Services lookup:
    { $lookup: {
        from: 'services',
        localField: 'reporting.service',
        foreignField: '_id',
        as: 'reporting.service',
    }},

    //Users (Lookup & Unwind):
    { $lookup: {
        from: 'users',
        localField: 'reporting.fk_reporting',
        foreignField: '_id',
        as: 'reporting.fk_reporting',
    }},
    { $unwind: { path: "$reporting.fk_reporting", preserveNullAndEmptyArrays: true } },

    //Added Users -> Person (Lookup & Unwind):
    { $lookup: {
        from: 'people',
        localField: 'reporting.fk_reporting.fk_person',
        foreignField: '_id',
        as: 'reporting.fk_reporting.person',
    }},
    { $unwind: { path: "$reporting.fk_reporting.person", preserveNullAndEmptyArrays: true } },

    //Unwind:
    { $unwind: { path: "$reporting.organization", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$reporting.branch", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$reporting.service", preserveNullAndEmptyArrays: true } },
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

    //Consents (Lookup & Unwind):
    { $lookup: {
        from: 'files',
        localField: 'consents.informed_consent',
        foreignField: '_id',
        as: 'consents.informed_consent',
    }},
    { $unwind: { path: "$consents.informed_consent", preserveNullAndEmptyArrays: true } },

    { $lookup: {
        from: 'files',
        localField: 'consents.clinical_trial',
        foreignField: '_id',
        as: 'consents.clinical_trial',
    }},
    { $unwind: { path: "$consents.clinical_trial", preserveNullAndEmptyArrays: true } },

    //Attached files lookup [Array]:
    { $lookup: {
        from: 'files',
        localField: 'attached_files',
        foreignField: '_id',
        as: 'attached_files'
    }},

    //------------------------------------------------------------------------------------------------------------//
    // REMOVE DUPLICATED VALUES (SET DEFAULT PROJECTION):
    // Important note: Request project replaces the aggregation projection (This prevent mix content proj error).
    //------------------------------------------------------------------------------------------------------------//
    { $project: {
        'fk_slot': 0,
        'fk_patient': 0,
        'patient.permissions': 0,
        'patient.password': 0,
        'reporting.fk_reporting.password': 0,
        'fk_procedure': 0,

        //Base64 Logos:
        'imaging.organization.base64_logo': 0,
        'imaging.branch.base64_logo': 0,

        //Organization cert:
        'imaging.organization.base64_cert': 0,
        'imaging.organization.password_cert': 0,

        //Added projection:
        'attached_files.base64': 0, 'consents.informed_consent.base64': 0, 'consents.clinical_trial.base64': 0
    }}
    //------------------------------------------------------------------------------------------------------------//
];
//--------------------------------------------------------------------------------------------------------------------//