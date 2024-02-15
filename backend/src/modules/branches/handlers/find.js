//--------------------------------------------------------------------------------------------------------------------//
// BRANCHES FIND HANDLER:
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
        'base64_logo': 0,
        'organization.base64_logo': 0,
        'organization.base64_cert': 0,
        'organization.password_cert': 0
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
            localField: 'fk_organization',
            foreignField: '_id',
            as: 'organization',
        }},
        
        //Unwind:
        { $unwind: { path: "$organization", preserveNullAndEmptyArrays: true } },

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
            'organization.base64_logo': 0,
        }}
        //------------------------------------------------------------------------------------------------------------//
    );

    //Correct data types for match operation:
    if(filter != undefined){
        //Adjust data types for match aggregation (Schema):
        filter = await moduleServices.adjustDataTypes(filter, 'branches');
        filter = await moduleServices.adjustDataTypes(filter, 'organizations', 'organization');

        //Set condition:
        const condition = await moduleServices.setCondition(filter, regex);

        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: condition });
    }

    //Excecute main query:
    await moduleServices.findAggregation(req, res, currentSchema);
}
//--------------------------------------------------------------------------------------------------------------------//