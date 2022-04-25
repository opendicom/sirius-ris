//--------------------------------------------------------------------------------------------------------------------//
// USERS FIND HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

//Import schemas:
const users = require('../schemas');

module.exports = async (req, res) => {
    //Get query params:
    let filter = req.query.filter;

    //Add aggregate to request:
    req.query['aggregate'] = [
        //People lookup:
        { $lookup: {
            from: 'people',
            localField: 'fk_person',
            foreignField: '_id',
            as: 'person',
        }},
        
        //Unwind:
        { $unwind: { path: "$person", preserveNullAndEmptyArrays: true } },
    ];    

    //Correct data types for match operation:
    if(filter != undefined){
        //Adjust data types for match aggregation (Schema):
        filter = moduleServices.adjustDataTypes(filter, 'users');
        filter = moduleServices.adjustDataTypes(filter, 'people', 'person');

        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: filter });
    }

    //Excecute main query:
    await moduleServices.findAggregation(req, res, users);
}
//--------------------------------------------------------------------------------------------------------------------//