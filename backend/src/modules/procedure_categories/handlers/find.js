//--------------------------------------------------------------------------------------------------------------------//
// PROCEDURES CATEGORIES FIND HANDLER:
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
        'organization.base64_logo': 0,
        'organization.base64_cert': 0,
        'organization.password_cert': 0,
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

        //Procedures lookup [Array]:
        { $lookup: {
            from: 'procedures',
            localField: 'fk_procedures',
            foreignField: '_id',
            as: 'procedures',
        }},

        //Unwind:
        { $unwind: { path: "$organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },

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

            //Procedures:
            'procedures.createdAt': 0,
            'procedures.updatedAt': 0,
            'procedures.__v': 0
        }}
        //------------------------------------------------------------------------------------------------------------//
    );

    //Correct data types for match operation:
    if(filter != undefined){
        //Adjust data types for match aggregation (Schema):
        filter = await moduleServices.adjustDataTypes(filter, 'procedure_categories');
        filter = await moduleServices.adjustDataTypes(filter, 'organizations', 'organization');
        filter = await moduleServices.adjustDataTypes(filter, 'branches', 'branch');
        filter = await moduleServices.adjustDataTypes(filter, 'procedures', 'procedures');

        //Set condition:
        const condition = await moduleServices.setCondition(filter, regex);

        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: condition });
    }

    //Excecute main query:
    await moduleServices.findAggregation(req, res, currentSchema);
}
//--------------------------------------------------------------------------------------------------------------------//