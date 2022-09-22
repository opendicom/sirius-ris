//--------------------------------------------------------------------------------------------------------------------//
// APPOINTMENTS FIND HANDLER:
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

        //Users lookup:
        { $lookup: {
            from: 'users',
            localField: 'reporting.fk_reporting',
            foreignField: '_id',
            as: 'reporting.fk_reporting',
        }},

        //Unwind:
        { $unwind: { path: "$reporting.organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$reporting.branch", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$reporting.service", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$reporting.fk_reporting", preserveNullAndEmptyArrays: true } },
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
        { $unwind: "$attached_files" },
        { "$lookup": {
            "from": "files",
            "localField": "attached_files",
            "foreignField": "_id",
            "as": "attached_files"
         }},
         { $unwind: "$attached_files" },

         //Group array:
        { $group: {
            //Preserve _id:
            _id             : '$_id',
            
            //Preserve root document:            
            first: { "$first": "$$ROOT" },

            //Group $lookup result to existing array:
            attached_files: { "$push": "$attached_files" },
        }},
        
        //Replace root document (Merge objects):
        { $replaceRoot: {
            newRoot: {
                $mergeObjects: [
                    "$first",
                    { attached_files: "$attached_files" }
                ]
            }
        }},

        //------------------------------------------------------------------------------------------------------------//
        // REMOVE DUPLICATED VALUES (SET DEFAULT PROJECTION):
        // Important note: Request project replaces the aggregation projection (This prevent mix content proj error).
        //------------------------------------------------------------------------------------------------------------//
        { $project: { 'fk_slot': 0, 'fk_patient': 0, 'patient.permissions': 0, 'patient.password': 0, 'fk_procedure': 0 }}
        //------------------------------------------------------------------------------------------------------------//
    ];    

    //Correct data types for match operation:
    if(filter != undefined){
        //------------------------------------------------------------------------------------------------------------//
        // Adjust data types for match aggregation (Schema):
        //------------------------------------------------------------------------------------------------------------//
        filter = await moduleServices.adjustDataTypes(filter, 'appointments');

        //Imaging:
        filter = await moduleServices.adjustDataTypes(filter, 'organizations', 'imaging.organization');
        filter = await moduleServices.adjustDataTypes(filter, 'branches', 'imaging.branch');
        filter = await moduleServices.adjustDataTypes(filter, 'services', 'imaging.service');

        //Referring:
        filter = await moduleServices.adjustDataTypes(filter, 'organizations', 'referring.organization');
        filter = await moduleServices.adjustDataTypes(filter, 'branches', 'referring.branch');
        filter = await moduleServices.adjustDataTypes(filter, 'services', 'referring.service');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'referring.fk_referring');

        //Reporting:
        filter = await moduleServices.adjustDataTypes(filter, 'organizations', 'reporting.organization');
        filter = await moduleServices.adjustDataTypes(filter, 'branches', 'reporting.branch');
        filter = await moduleServices.adjustDataTypes(filter, 'services', 'reporting.service');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'reporting.fk_reporting');

        //Schema:
        filter = await moduleServices.adjustDataTypes(filter, 'modalities', 'modality');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'patient');
        filter = await moduleServices.adjustDataTypes(filter, 'slots', 'slot');
        filter = await moduleServices.adjustDataTypes(filter, 'equipments', 'slot.equipment');
        filter = await moduleServices.adjustDataTypes(filter, 'procedures', 'procedure');

        //Files:
        filter = await moduleServices.adjustDataTypes(filter, 'files', 'consents.informed_consent');
        filter = await moduleServices.adjustDataTypes(filter, 'files', 'consents.clinical_trial');
        filter = await moduleServices.adjustDataTypes(filter, 'files', 'attached_files');
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