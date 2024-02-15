//--------------------------------------------------------------------------------------------------------------------//
// APPOINTMENT REQUESTS FIND HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res, currentSchema) => {
    //Remove base64 for default projection:
    if(!req.query.proj){ req.query['proj'] = {
        'imaging.organization.base64_logo': 0,
        'imaging.organization.base64_cert': 0,
        'imaging.organization.password_cert': 0,
        'imaging.branch.base64_logo': 0,
        'referring.organization.base64_logo': 0,
        'referring.organization.base64_cert': 0,
        'referring.organization.password_cert': 0,
        'referring.branch.base64_logo': 0,
    }; }

    //Get query params:
    let { filter, regex } = req.query;

    //Add aggregate to request:
    req.query['aggregate'] = [];

    //Set group by:
    await moduleServices.setGroup(req);

    //Add schema pipe aggregation:
    req.query.aggregate.push(
        //------------------------------------------------------------------------------------------------------------//
        // IMAGING:
        //------------------------------------------------------------------------------------------------------------//
        //Organizations lookup:
        { $lookup: {
            from: 'organizations',
            localField: 'imaging.organization',
            foreignField: '_id',
            as: 'imaging.organization',
        }},

        //Branches lookup:
        { $lookup: {
            from: 'branches',
            localField: 'imaging.branch',
            foreignField: '_id',
            as: 'imaging.branch',
        }},

        //Unwind:
        { $unwind: { path: "$imaging.organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$imaging.branch", preserveNullAndEmptyArrays: true } },
        //------------------------------------------------------------------------------------------------------------//

        //------------------------------------------------------------------------------------------------------------//
        // REFERRING:
        //------------------------------------------------------------------------------------------------------------//
        //Organizations lookup:
        { $lookup: {
            from: 'organizations',
            localField: 'referring.organization',
            foreignField: '_id',
            as: 'referring.organization',
        }},

        //Branches lookup:
        { $lookup: {
            from: 'branches',
            localField: 'referring.branch',
            foreignField: '_id',
            as: 'referring.branch',
        }},

        //Unwind:
        { $unwind: { path: "$referring.organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$referring.branch", preserveNullAndEmptyArrays: true } },
        //------------------------------------------------------------------------------------------------------------//

        //------------------------------------------------------------------------------------------------------------//
        // STUDY:
        //------------------------------------------------------------------------------------------------------------//
        //Procedure (Lookup & Unwind):
        { $lookup: {
            from: 'procedures',
            localField: 'study.fk_procedure',
            foreignField: '_id',
            as: 'procedure',
        }},
        { $unwind: { path: "$procedure", preserveNullAndEmptyArrays: true } },

        //Modalities (Lookup & Unwind):
        { $lookup: {
            from: 'modalities',
            localField: 'study.fk_modality',
            foreignField: '_id',
            as: 'modality',
        }},
        { $unwind: { path: "$modality", preserveNullAndEmptyArrays: true } },
        //------------------------------------------------------------------------------------------------------------//

        //------------------------------------------------------------------------------------------------------------//
        // REMOVE DUPLICATED VALUES (SET DEFAULT PROJECTION):
        // Important note: Request project replaces the aggregation projection (This prevent mix content proj error).
        //------------------------------------------------------------------------------------------------------------//
        { $project: {
            //Self:
            // In appointment_requests createdAt are required by default.
            //'createdAt': 0,
            'updatedAt': 0,
            '__v': 0,

            //Imaging:
            'imaging.organization.createdAt': 0,
            'imaging.organization.updatedAt': 0,
            'imaging.organization.__v': 0,

            'imaging.branch.createdAt': 0,
            'imaging.branch.updatedAt': 0,
            'imaging.branch.__v': 0,
            
            //Referring:
            'referring.organization.createdAt': 0,
            'referring.organization.updatedAt': 0,
            'referring.organization.__v': 0,

            'referring.branch.createdAt': 0,
            'referring.branch.updatedAt': 0,
            'referring.branch.__v': 0,

            //Procedure:
            'fk_procedure': 0,
            'procedure.createdAt': 0,
            'procedure.updatedAt': 0,
            'procedure.__v': 0,
            
            //Modality:
            'modality.createdAt': 0,
            'modality.updatedAt': 0,
            'modality.__v': 0
        }}
        //------------------------------------------------------------------------------------------------------------//
    );    

    //Correct data types for match operation:
    if(filter != undefined){
        //------------------------------------------------------------------------------------------------------------//
        // Adjust data types for match aggregation (Schema):
        //------------------------------------------------------------------------------------------------------------//
        filter = await moduleServices.adjustDataTypes(filter, 'appointment_requests');
        
        //Imaging:
        filter = await moduleServices.adjustDataTypes(filter, 'organizations', 'imaging.organization');
        filter = await moduleServices.adjustDataTypes(filter, 'branches', 'imaging.branch');

        //Referring:
        filter = await moduleServices.adjustDataTypes(filter, 'organizations', 'referring.organization');
        filter = await moduleServices.adjustDataTypes(filter, 'branches', 'referring.branch');

        //Study:
        filter = await moduleServices.adjustDataTypes(filter, 'procedures', 'procedure');
        filter = await moduleServices.adjustDataTypes(filter, 'modalities', 'modality');
        //------------------------------------------------------------------------------------------------------------//

        //Set condition:
        const condition = await moduleServices.setCondition(filter, regex);

        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: condition });
    }

    //Excecute main query:
    await moduleServices.findAggregation(req, res, currentSchema);
}
//--------------------------------------------------------------------------------------------------------------------//