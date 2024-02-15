//--------------------------------------------------------------------------------------------------------------------//
// SIGNATURES FIND HANDLER:
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
        //User (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'fk_user',
            foreignField: '_id',
            as: 'user',
        }},
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

        //User -> Person (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'user.fk_person',
            foreignField: '_id',
            as: 'user.person',
        }},
        { $unwind: { path: "$user.person", preserveNullAndEmptyArrays: true } },

        //------------------------------------------------------------------------------------------------------------//
        // REMOVE DUPLICATED VALUES (SET DEFAULT PROJECTION):
        // Important note: Request project replaces the aggregation projection (This prevent mix content proj error).
        //------------------------------------------------------------------------------------------------------------//
        { $project: {
            //Self:
            'createdAt': 0,
            'updatedAt': 0,
            '__v': 0,

            //Remove fk organization from the response:
            //FK Organization is a field for the RABC.
            'fk_organization': 0,

            //User:
            'user.fk_person': 0,
            'user.password': 0,
            'user.permissions': 0,
            'user.settings': 0,
            'user.createdAt': 0,
            'user.updatedAt': 0,
            'user.__v': 0,
            'user.person.createdAt': 0,
            'user.person.updatedAt': 0,
            'user.person.__v': 0
        }}
        //------------------------------------------------------------------------------------------------------------//
    );

    //Correct data types for match operation:
    if(filter != undefined){
        //Adjust data types for match aggregation (Schema):
        filter = await moduleServices.adjustDataTypes(filter, 'signatures');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'user');
        filter = await moduleServices.adjustDataTypes(filter, 'people', 'user.person');

        //Set condition:
        const condition = await moduleServices.setCondition(filter, regex);

        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: condition });
    }

    //Excecute main query:
    await moduleServices.findAggregation(req, res, currentSchema);
}
//--------------------------------------------------------------------------------------------------------------------//