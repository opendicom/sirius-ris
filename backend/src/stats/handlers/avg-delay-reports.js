//--------------------------------------------------------------------------------------------------------------------//
// AVG DELAY REPORTS STATS HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const mongoose      = require('mongoose');

//Import app modules:
const mainServices  = require('../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                            // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules/modules.services');

//Import schema:
const performing    = require('../../modules/performing/schemas');

//Set ObjectId Regex to validate:
const regexObjectId = /^[0-9a-fA-F]{24}$/;

module.exports = async (req, res) => {
    //Check request fields:
    if(req.query.hasOwnProperty('start_date') && req.query.hasOwnProperty('end_date') && req.query.hasOwnProperty('fk_branch')){

        //Get query params:
        const { start_date, end_date, fk_branch } = req.query;

        //Initializate branch check:
        let branchCheck = true;

        //Disable filter, proj, skip, limit, sort and pager request fields:
        delete req.query.filter;
        delete req.query.proj;
        delete req.query.skip;
        delete req.query.limit;
        delete req.query.sort;
        delete req.query.pager;

        //Check if exist and validate fk_branch in request:
        if(fk_branch !== undefined && fk_branch !== null && fk_branch !== '' && regexObjectId.test(fk_branch)){

            //Check if referenced branch exist in DB:
            branchCheck = await moduleServices.ckeckElement(fk_branch, 'branches', res);

            //Check references:
            if(branchCheck == true){

                //Initializate domain condition (Stats are only allowed by branch, not by organization):
                let domainCondition = { 'appointment.imaging.branch': new mongoose.Types.ObjectId(fk_branch) };

                //Check RABC filter condition:
                if(req.query.rabc_filter !== undefined && req.query.rabc_filter !== null && req.query.rabc_filter !== ''){
                    domainCondition = {
                        "$and":[
                            req.query.rabc_filter, //Add RABC filter condition.
                            { 'appointment.imaging.branch': new mongoose.Types.ObjectId(fk_branch) }
                        ]
                    };
                }

                //Build aggregation pipeline:
                const aggregate = [
                    { $match: {
                        "$and":[
                            //Only performing with authenticated report (Terminado con informe):
                            { "flow_state": "P09" },
                            { "status": true },

                            //Date range condition (Performing creation date):
                            { "createdAt": { "$gte": new Date(start_date + "T00:00:00.000Z") } },
                            { "createdAt": { "$lte": new Date(end_date + "T23:59:59.000Z") } }
                        ]
                    }},

                    //Appointment (Lookup & Unwind):
                    { $lookup: {
                        from: 'appointments',
                        localField: 'fk_appointment',
                        foreignField: '_id',
                        as: 'appointment',
                    }},
                    { $unwind: { path: "$appointment", preserveNullAndEmptyArrays: false } },

                    //Domain condition (Branch and RABC filter):
                    { $match: domainCondition },

                    //Procedure (Lookup & Unwind):
                    { $lookup: {
                        from: 'procedures',
                        localField: 'fk_procedure',
                        foreignField: '_id',
                        as: 'procedure',
                    }},
                    { $unwind: { path: "$procedure", preserveNullAndEmptyArrays: true } },

                    //Procedure -> Modality (Lookup & Unwind):
                    { $lookup: {
                        from: 'modalities',
                        localField: 'procedure.fk_modality',
                        foreignField: '_id',
                        as: 'modality',
                    }},
                    { $unwind: { path: "$modality", preserveNullAndEmptyArrays: true } },

                    //Reports (Lookup first authenticated report created for this performing, sorted by createdAt ascending):
                    { $lookup: {
                        from: 'reports',
                        let: { performing_id: "$_id" },
                        pipeline: [
                            { $match: { $expr: { "$eq": ["$fk_performing", "$$performing_id"] } } },
                            { $sort: { createdAt: 1 } },
                            { $limit: 1 }
                        ],
                        as: 'report',
                    }},
                    { $unwind: { path: "$report", preserveNullAndEmptyArrays: false } }, //Only performing with at least one report.

                    //Project only the fields needed to calculate the delay per modality:
                    { $project: {
                        _id: 0,
                        performing_created: "$createdAt",
                        report_created: "$report.createdAt",
                        modality_code_value: "$modality.code_value"
                    }}
                ];

                //Execute aggregation:
                await performing.Model.aggregate(aggregate)
                .exec()
                .then((data) => {
                    //Sum days passed per modality:
                    const modalityTotals = {};
                    data.forEach((element) => {
                        const daysPassed = mainServices.getDaysPassed(element.performing_created, element.report_created);
                        const modalityKey = element.modality_code_value;

                        if(!modalityTotals.hasOwnProperty(modalityKey)){
                            modalityTotals[modalityKey] = { totalDaysPassed: 0, count: 0 };
                        }

                        modalityTotals[modalityKey].totalDaysPassed += daysPassed;
                        modalityTotals[modalityKey].count += 1;
                    });

                    //Calculate average delay per modality:
                    const modalities = {};
                    Object.keys(modalityTotals).forEach((modalityKey) => {
                        const { totalDaysPassed, count } = modalityTotals[modalityKey];
                        modalities[modalityKey] = Math.round((totalDaysPassed / count) * 100) / 100;
                    });

                    //Calculate total average as the average of the per-modality averages:
                    const modalityAverages = Object.values(modalities);
                    const total_avg_days_passed = modalityAverages.length > 0 ? Math.round((modalityAverages.reduce((acc, avg) => acc + avg, 0) / modalityAverages.length) * 100) / 100 : 0;

                    //Send successfully response:
                    res.status(200).send({
                        success: true,
                        data: { modalities, 'total-avg-days-passed': total_avg_days_passed }
                    });
                })
                .catch((err) => {
                    //Send error:
                    mainServices.sendError(res, currentLang.db.query_error, err);
                });
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
