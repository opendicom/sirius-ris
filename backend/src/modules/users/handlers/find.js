//--------------------------------------------------------------------------------------------------------------------//
// USERS FIND HANDLER:
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
    req.query['aggregate'] = [];

    //Set group by:
    await moduleServices.setGroup(req);

    //Add schema pipe aggregation:
    req.query.aggregate.push(
        //People lookup:
        { $lookup: {
            from: 'people',
            localField: 'fk_person',
            foreignField: '_id',
            as: 'person',
        }},
        
        //Unwind:
        { $unwind: { path: "$person", preserveNullAndEmptyArrays: true } },

        //------------------------------------------------------------------------------------------------------------//
        // REMOVE DUPLICATED VALUES (SET DEFAULT PROJECTION):
        // Important note: Request project replaces the aggregation projection (This prevent mix content proj error).
        //------------------------------------------------------------------------------------------------------------//
        { $project: {
            //Self:
            'createdAt': 0,
            'updatedAt': 0,
            '__v': 0,

            //Person:
            'person.createdAt': 0,
            'person.updatedAt': 0,
            'person.__v': 0,
        }}
        //------------------------------------------------------------------------------------------------------------//
    );

    //Correct data types for match operation:
    if(filter != undefined){
        //Adjust data types for match aggregation (Schema):
        filter = await moduleServices.adjustDataTypes(filter, 'users');
        filter = await moduleServices.adjustDataTypes(filter, 'people', 'person');
        
        //Set condition:
        const condition = await moduleServices.setCondition(filter, regex);
        
        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: condition });
    }

    //Excecute main query:
    await moduleServices.findAggregation(req, res, currentSchema);
}
//--------------------------------------------------------------------------------------------------------------------//