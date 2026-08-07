//--------------------------------------------------------------------------------------------------------------------//
// AVG DELAY APPOINTMENT STATS HANDLER:
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
const appointments  = require('../../modules/appointments/schemas');

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
                let domainCondition = { 'imaging.branch': new mongoose.Types.ObjectId(fk_branch) };

                //Check RABC filter condition:
                if(req.query.rabc_filter !== undefined && req.query.rabc_filter !== null && req.query.rabc_filter !== ''){
                    domainCondition = {
                        "$and":[
                            req.query.rabc_filter, //Add RABC filter condition.
                            { 'imaging.branch': new mongoose.Types.ObjectId(fk_branch) }
                        ]
                    };
                }

                //Build aggregation pipeline:
                const aggregate = [
                    { $match: {
                        "$and":[
                            //Date range condition (Appointment coordination date):
                            { "createdAt": { "$gte": new Date(start_date + "T00:00:00.000Z") } },
                            { "createdAt": { "$lte": new Date(end_date + "T23:59:59.000Z") } },

                            //Only appointments coordinated from an appointment_request:
                            { "fk_appointment_request": { "$exists": true, "$ne": null } },

                            //Domain condition:
                            domainCondition
                        ]
                    }},

                    //Appointment request (Lookup & Unwind):
                    { $lookup: {
                        from: 'appointment_requests',
                        localField: 'fk_appointment_request',
                        foreignField: '_id',
                        as: 'appointment_request',
                    }},
                    { $unwind: { path: "$appointment_request", preserveNullAndEmptyArrays: false } },

                    //Project only the dates needed to calculate the delay:
                    { $project: {
                        _id: 0,
                        request_created: "$appointment_request.createdAt",
                        appointment_created: "$createdAt"
                    }}
                ];

                //Execute aggregation:
                await appointments.Model.aggregate(aggregate)
                .exec()
                .then((data) => {
                    //Sum days passed between the request and the appointment coordination (per document):
                    let totalDaysPassed = 0;
                    data.forEach((element) => {
                        totalDaysPassed += mainServices.getDaysPassed(element.request_created, element.appointment_created);
                    });

                    //Calculate average (Prevent division by zero):
                    const total_avg_days_passed = data.length > 0 ? Math.round((totalDaysPassed / data.length) * 100) / 100 : 0;

                    //Send successfully response:
                    res.status(200).send({
                        success: true,
                        data: { total_avg_days_passed }
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
