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
            'fk_slot': 0,
            'fk_patient': 0,
            'patient.permissions': 0, 
            'patient.password': 0,
            'fk_coordinator': 0, 
            'coordinator.permissions': 0, 
            'coordinator.password': 0, 
            'fk_procedure': 0
        }}
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

        //Schema:
        filter = await moduleServices.adjustDataTypes(filter, 'modalities', 'modality');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'patient');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'coordinator');
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