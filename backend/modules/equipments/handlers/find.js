//--------------------------------------------------------------------------------------------------------------------//
// EQUIPMENTS FIND HANDLER:
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
            localField: 'fk_modalities',
            foreignField: '_id',
            as: 'modalities',
        }},
       
        //Unwind:
        { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$organization", preserveNullAndEmptyArrays: true } },
    ];    

    //Correct data types for match operation:
    if(filter != undefined){
        //Adjust data types for match aggregation (Schema):
        filter = moduleServices.adjustDataTypes(filter, 'equipments');
        filter = moduleServices.adjustDataTypes(filter, 'branches', 'branch');
        filter = moduleServices.adjustDataTypes(filter, 'organizations', 'organization');
        filter = moduleServices.adjustDataTypes(filter, 'modalities', 'modalities');

        //Set condition:
        let condition = await moduleServices.setCondition(filter);

        //Set regex:
        condition = await moduleServices.setRegex(regex, condition);

        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: condition });
    }

    //Excecute main query:
    await moduleServices.findAggregation(req, res, currentSchema);
}
//--------------------------------------------------------------------------------------------------------------------//