//--------------------------------------------------------------------------------------------------------------------//
// PERFORMING FIND LOCKER HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const mongoose      = require('mongoose');

//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

//Set ObjectId Regex to validate:
const regexObjectId = /^[0-9a-fA-F]{24}$/;

module.exports = async (req, res, currentSchema) => {
    //Check request fields:
    if(req.query.hasOwnProperty('fk_branch')){
        //Initializate branch check:
        let branchCheck = true;

        //Get query params:
        const { fk_branch } = req.query;

        //Check if exist and validate fk_branch in request:
        if(fk_branch !== undefined && fk_branch !== null && fk_branch !== '' && regexObjectId.test(fk_branch)){
        
            //Check if referenced branch exist in DB:
            branchCheck = await moduleServices.ckeckElement(fk_branch, 'branches', res);
        
            //Check references:
            if(branchCheck == true){
                //Add aggregate to query:
                req.query['aggregate'] = [
                    //Appointment (Lookup & Unwind) [Preserve only report_before]:
                    { $lookup: {
                        from: 'appointments',
                        let: { appointmentId: '$fk_appointment' },
                        pipeline: [
                            { $match: {
                                $expr: { $eq: ['$_id', '$$appointmentId'] }
                            }},
                            { $project: {
                                _id: 0,
                                'imaging.branch': 1,
                                'reporting.fk_reporting': 1,
                                'report_before': 1
                            }}
                        ],
                        as: 'appointment'
                    }},
                    { $unwind: { path: "$appointment", preserveNullAndEmptyArrays: true } },

                    // Procedure (Lookup & Unwind):
                    { $lookup: {
                        from: 'procedures',
                        localField: 'fk_procedure',
                        foreignField: '_id',
                        as: 'procedure'
                    }},
                    { $unwind: { path: "$procedure", preserveNullAndEmptyArrays: true }},

                    //Procedure -> Modality (Lookup & Unwind) [Preserve only modality _id and code_value]:
                    { $lookup: {
                        from: 'modalities',
                        let: { modalityId: '$procedure.fk_modality' },
                        pipeline: [
                            { $match: {
                                $expr: { $eq: ['$_id', '$$modalityId'] }
                            }},
                            { $project: {
                                _id: 1,
                                code_value: 1
                            }}
                        ],
                        as: 'modality'
                    }},
                    { $unwind: { path: "$modality", preserveNullAndEmptyArrays: true }},

                    // Project:
                    { $project: {
                        flow_state: 1,
                        date: 1,
                        urgency: 1,
                        appointment: 1,
                        modality: 1
                    }},

                    // Base Match with flow_state (Only studies that are intended to 'inform' and are not 'authenticated'):
                    { $match: { 
                        "$and":[
                            { 'flow_state': { $in: ['P06', 'P07', 'P08'] } },
                            { 'appointment.imaging.branch': new mongoose.Types.ObjectId(fk_branch) }
                        ]
                    }}
                ];

                //Excecute main query:
                await moduleServices.findAggregation(req, res, currentSchema);
            }
        } else {
            //Send not valid referenced object mensaje:
            res.status(405).send({ success: false, message: currentLang.db.not_valid_fk });
        }
    } else {
        //Bad request:
        res.status(400).send({ success: false, message: currentLang.http.bad_request });
    }
}
//--------------------------------------------------------------------------------------------------------------------//