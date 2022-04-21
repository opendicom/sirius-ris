//--------------------------------------------------------------------------------------------------------------------//
// SERVICES FIND HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

//Import schemas:
const services = require('../schemas');

module.exports = async (req, res) => {
    //Get query params:
    let filter = req.query.filter;

    //Add aggregate to request:
    req.query['aggregate'] = [
        //Branches lookup:
        { $lookup: {
            from: 'branches',
            localField: 'fk_branch',
            foreignField: '_id',
            as: 'branch_data',
        }},

        //Organizations lookup:
        { $lookup: {
            from: 'organizations',
            localField: 'branch_data.fk_organization',
            foreignField: '_id',
            as: 'organization_data',
        }},

        //Modalities lookup:
        { $lookup: {
            from: 'modalities',
            localField: 'fk_modality',
            foreignField: '_id',
            as: 'modality_data',
        }},

        //Unwind:
        { $unwind: { path: "$branch_data", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$organization_data", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$modality_data", preserveNullAndEmptyArrays: true } },
    ];    

    //Correct data types for match operation:
    if(filter != undefined){
        //Adjust data types for match aggregation (Schema):
        filter = moduleServices.adjustDataTypes(filter, 'services');
        filter = moduleServices.adjustDataTypes(filter, 'branches', 'branch_data');
        filter = moduleServices.adjustDataTypes(filter, 'organizations', 'organization_data');
        filter = moduleServices.adjustDataTypes(filter, 'modalities', 'modality_data');

        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: filter });
    }

    //Excecute main query:
    await moduleServices.findAggregation(req, res, services);
}
//--------------------------------------------------------------------------------------------------------------------//