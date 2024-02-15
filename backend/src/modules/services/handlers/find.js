//--------------------------------------------------------------------------------------------------------------------//
// SERVICES FIND HANDLER:
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
        'organization.base64_cert': 0,
        'organization.password_cert': 0,
        'organization.base64_logo': 0,
        'branch.base64_logo': 0
    }; }

    //Get query params:
    let { filter, regex } = req.query;

    //Add aggregate to request:
    req.query['aggregate'] = [];

    //Set group by:
    await moduleServices.setGroup(req);

    //Add schema pipe aggregation:
    req.query.aggregate.push(
        //Branches lookup:
        { $lookup: {
            from: 'branches',
            localField: 'fk_branch',
            foreignField: '_id',
            as: 'branch',
        }},

        //Organizations lookup:
        { $lookup: {
            from: 'organizations',
            localField: 'branch.fk_organization',
            foreignField: '_id',
            as: 'organization',
        }},

        //Modalities lookup:
        { $lookup: {
            from: 'modalities',
            localField: 'fk_modality',
            foreignField: '_id',
            as: 'modality',
        }},

        //Equipments lookup [Array]:
        { $lookup: {
            from: 'equipments',
            localField: 'fk_equipments',
            foreignField: '_id',
            as: 'equipments',
        }},

        //Unwind:
        { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$modality", preserveNullAndEmptyArrays: true } },

        //------------------------------------------------------------------------------------------------------------//
        // REMOVE DUPLICATED VALUES (SET DEFAULT PROJECTION):
        // Important note: Request project replaces the aggregation projection (This prevent mix content proj error).
        //------------------------------------------------------------------------------------------------------------//
        { $project: {
            //Self:
            'createdAt': 0,
            'updatedAt': 0,
            '__v': 0,

            //Organization:
            'organization.createdAt': 0,
            'organization.updatedAt': 0,
            'organization.__v': 0,

            //Branch:
            'branch.createdAt': 0,
            'branch.updatedAt': 0,
            'branch.__v': 0,

            //Modality:
            'modality.createdAt': 0,
            'modality.updatedAt': 0,
            'modality.__v': 0,

            //Equipments:
            'equipments.createdAt': 0,
            'equipments.updatedAt': 0,
            'equipments.__v': 0
        }}
        //------------------------------------------------------------------------------------------------------------//
    );

    //Correct data types for match operation:
    if(filter != undefined){
        //Adjust data types for match aggregation (Schema):
        filter = await moduleServices.adjustDataTypes(filter, 'services');
        filter = await moduleServices.adjustDataTypes(filter, 'branches', 'branch');
        filter = await moduleServices.adjustDataTypes(filter, 'organizations', 'organization');
        filter = await moduleServices.adjustDataTypes(filter, 'modalities', 'modality');
        filter = await moduleServices.adjustDataTypes(filter, 'equipments', 'equipments');

        //Set condition:
        const condition = await moduleServices.setCondition(filter, regex);

        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: condition });
    }

    //Excecute main query:
    await moduleServices.findAggregation(req, res, currentSchema);
}
//--------------------------------------------------------------------------------------------------------------------//