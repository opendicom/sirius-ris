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
    //Get query params:
    let { condition, filter } = req.query;

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
            localField: 'fk_modality',
            foreignField: '_id',
            as: 'modality',
        }},

        //Unwind:
        { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$modality", preserveNullAndEmptyArrays: true } },
    ];    

    //Correct data types for match operation:
    if(filter != undefined){
        //Adjust data types for match aggregation (Schema):
        filter = moduleServices.adjustDataTypes(filter, 'services');
        filter = moduleServices.adjustDataTypes(filter, 'branches', 'branch');
        filter = moduleServices.adjustDataTypes(filter, 'organizations', 'organization');
        filter = moduleServices.adjustDataTypes(filter, 'modalities', 'modality');

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