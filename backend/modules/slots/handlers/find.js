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

        //Services lookup:
        { $lookup: {
            from: 'services',
            localField: 'domain.service',
            foreignField: '_id',
            as: 'service',
        }},

        //Equipments lookup:
        { $lookup: {
            from: 'equipments',
            localField: 'fk_equipment',
            foreignField: '_id',
            as: 'equipment',
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
        { $unwind: { path: "$organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$equipment", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$modality", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$procedure", preserveNullAndEmptyArrays: true } },
    ];    

    //Correct data types for match operation:
    if(filter != undefined){
        //Adjust data types for match aggregation (Schema):
        filter = await moduleServices.adjustDataTypes(filter, 'slots');
        filter = await moduleServices.adjustDataTypes(filter, 'organizations', 'organization');
        filter = await moduleServices.adjustDataTypes(filter, 'branches', 'branch');
        filter = await moduleServices.adjustDataTypes(filter, 'services', 'service');
        filter = await moduleServices.adjustDataTypes(filter, 'equipments', 'equipment');
        filter = await moduleServices.adjustDataTypes(filter, 'modalities', 'modality');
        filter = await moduleServices.adjustDataTypes(filter, 'procedures', 'procedure');

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