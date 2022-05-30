//--------------------------------------------------------------------------------------------------------------------//
// SLOTS FIND HANDLER:
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
        //Equipments lookup:
        { $lookup: {
            from: 'equipments',
            localField: 'fk_equipment',
            foreignField: '_id',
            as: 'equipment',
        }},

        //Services lookup:
        { $lookup: {
            from: 'services',
            localField: 'fk_service',
            foreignField: '_id',
            as: 'service',
        }},

        //Branches lookup:
        { $lookup: {
            from: 'branches',
            localField: 'service.fk_branch',
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
            localField: 'service.fk_modality',
            foreignField: '_id',
            as: 'modality',
        }},

        //Procedures lookup:
        { $lookup: {
            from: 'procedures',
            localField: 'fk_procedure',
            foreignField: '_id',
            as: 'procedure',
        }},

        //Unwind:
        { $unwind: { path: "$equipment", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$modality", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$procedure", preserveNullAndEmptyArrays: true } },
    ];    

    //Correct data types for match operation:
    if(filter != undefined){
        //Adjust data types for match aggregation (Schema):
        filter = moduleServices.adjustDataTypes(filter, 'slots');
        filter = moduleServices.adjustDataTypes(filter, 'equipments', 'equipment');
        filter = moduleServices.adjustDataTypes(filter, 'services', 'service');
        filter = moduleServices.adjustDataTypes(filter, 'branches', 'branch');
        filter = moduleServices.adjustDataTypes(filter, 'organizations', 'organization');
        filter = moduleServices.adjustDataTypes(filter, 'modalities', 'modality');
        filter = moduleServices.adjustDataTypes(filter, 'procedures', 'procedure');

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