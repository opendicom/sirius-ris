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
        filter = await moduleServices.adjustDataTypes(filter, 'users');
        filter = await moduleServices.adjustDataTypes(filter, 'people', 'person');
        
        //Set condition:
        let condition = await moduleServices.setCondition(filter);

        //Set regex:
        condition = await moduleServices.setRegex(regex, condition);

        //Set in:
        condition = await moduleServices.setIn(filter, condition);
        
        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: condition });
    }

    //Excecute main query:
    await moduleServices.findAggregation(req, res, currentSchema);
}
//--------------------------------------------------------------------------------------------------------------------//