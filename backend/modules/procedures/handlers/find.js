//--------------------------------------------------------------------------------------------------------------------//
// PROCEDURES FIND HANDLER:
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
        //Organizations lookup:
        { $lookup: {
            from: 'organizations',
            localField: 'domain.organization',
            foreignField: '_id',
            as: 'organization',
        }},

        //Branches lookup:
        { $lookup: {
            from: 'branches',
            localField: 'domain.branch',
            foreignField: '_id',
            as: 'branch',
        }},

        //Modalities lookup:
        { $lookup: {
            from: 'modalities',
            localField: 'fk_modality',
            foreignField: '_id',
            as: 'modality',
        }},

        //Unwind:
        { $unwind: { path: "$organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$modality", preserveNullAndEmptyArrays: true } },

        //Equipments lookup [Array of Objects]:
        { $unwind: "$equipments" },
        { $lookup: {
            from: 'equipments',
            localField: 'equipments.fk_equipment',
            foreignField: '_id',
            as: 'equipments.details',
        }},
        { $unwind: "$equipments.details" },

        //Group array of objects:
        { $group: {
            //Preserve _id:
            _id             : '$_id',
            
            //Preserve root document:            
            first: { "$first": "$$ROOT" },

            //Group $lookup result to existing array:
            equipments: { "$push": "$equipments" },
        }},
        
        //Replace root document (Merge objects):
        { $replaceRoot: {
            newRoot: {
                $mergeObjects: [
                    "$first",
                    { equipments: "$equipments" }
                ]
            }
        }}
    ];    

    //Correct data types for match operation:
    if(filter != undefined){
        //Adjust data types for match aggregation (Schema):
        filter = await moduleServices.adjustDataTypes(filter, 'procedures');
        filter = await moduleServices.adjustDataTypes(filter, 'organizations', 'organization');
        filter = await moduleServices.adjustDataTypes(filter, 'branches', 'branch');
        filter = await moduleServices.adjustDataTypes(filter, 'modalities', 'modality');
        filter = await moduleServices.adjustDataTypes(filter, 'equipments', 'equipments.details');

        //Set condition:
        const condition = await moduleServices.setCondition(filter, regex);

        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: condition });
    }

    //Excecute main query:
    await moduleServices.findAggregation(req, res, currentSchema);
}
//--------------------------------------------------------------------------------------------------------------------//