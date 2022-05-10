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
    let { condition, filter } = req.query;

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

        //Set condition type:
        condition = await moduleServices.setConditionType(condition, filter);

        //Set condition regex:
        condition = await moduleServices.setConditionRegex(condition);

        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: condition.filter });
    }

    //Excecute main query:
    await moduleServices.findAggregation(req, res, currentSchema);
}
//--------------------------------------------------------------------------------------------------------------------//