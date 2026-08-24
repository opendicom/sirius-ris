//--------------------------------------------------------------------------------------------------------------------//
// CHECK_IN_BOARDS FIND HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res, currentSchema) => {
    //Remove base64 and sensitive data for default projection:
    if(!req.query.proj){ req.query['proj'] = {
        'patient.fk_person': 0,
        'patient.password': 0,
        'patient.permissions': 0,
        'patient.settings': 0,
        'board.branch.base64_logo': 0,
        'board.organization.base64_logo': 0,
        'board.organization.base64_cert': 0,
        'board.organization.password_cert': 0
    }; }

    //Get query params:
    let { filter, regex } = req.query;

    //Add aggregate to request:
    req.query['aggregate'] = [];

    //Set group by:
    await moduleServices.setGroup(req);

    //Add schema pipe aggregation:
    req.query.aggregate.push(
        //Patient (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'fk_patient',
            foreignField: '_id',
            as: 'patient',
        }},
        { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },

        //Patient -> Person (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'patient.fk_person',
            foreignField: '_id',
            as: 'patient.person',
        }},
        { $unwind: { path: "$patient.person", preserveNullAndEmptyArrays: true } },

        //Board (Lookup & Unwind):
        { $lookup: {
            from: 'boards',
            localField: 'fk_board',
            foreignField: '_id',
            as: 'board',
        }},
        { $unwind: { path: "$board", preserveNullAndEmptyArrays: true } },

        //Board -> Branch (Lookup & Unwind):
        { $lookup: {
            from: 'branches',
            localField: 'board.fk_branch',
            foreignField: '_id',
            as: 'board.branch',
        }},
        { $unwind: { path: "$board.branch", preserveNullAndEmptyArrays: true } },

        //Board -> Branch -> Organization (Lookup & Unwind):
        { $lookup: {
            from: 'organizations',
            localField: 'board.branch.fk_organization',
            foreignField: '_id',
            as: 'board.organization',
        }},
        { $unwind: { path: "$board.organization", preserveNullAndEmptyArrays: true } },

        //------------------------------------------------------------------------------------------------------------//
        // REMOVE DUPLICATED VALUES (SET DEFAULT PROJECTION):
        // Important note: Request project replaces the aggregation projection (This prevent mix content proj error).
        //------------------------------------------------------------------------------------------------------------//
        { $project: {
            //Self:
            'createdAt': 0,
            'updatedAt': 0,
            '__v': 0,

            //Patient:
            'patient.createdAt': 0,
            'patient.updatedAt': 0,
            'patient.__v': 0,
            'patient.person.createdAt': 0,
            'patient.person.updatedAt': 0,
            'patient.person.__v': 0,

            //Board:
            'board.createdAt': 0,
            'board.updatedAt': 0,
            'board.__v': 0,

            //Board -> Branch:
            'board.branch.createdAt': 0,
            'board.branch.updatedAt': 0,
            'board.branch.__v': 0,

            //Board -> Organization:
            'board.organization.createdAt': 0,
            'board.organization.updatedAt': 0,
            'board.organization.__v': 0
        }}
        //------------------------------------------------------------------------------------------------------------//
    );

    //Correct data types for match operation:
    if(filter != undefined){
        //Adjust data types for match aggregation (Schema):
        filter = await moduleServices.adjustDataTypes(filter, 'check_in_boards');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'patient');
        filter = await moduleServices.adjustDataTypes(filter, 'boards', 'board');
        filter = await moduleServices.adjustDataTypes(filter, 'branches', 'board.branch');
        filter = await moduleServices.adjustDataTypes(filter, 'organizations', 'board.organization');

        //Set condition:
        const condition = await moduleServices.setCondition(filter, regex);

        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: condition });
    }

    //Excecute main query:
    await moduleServices.findAggregation(req, res, currentSchema);
}
//--------------------------------------------------------------------------------------------------------------------//
