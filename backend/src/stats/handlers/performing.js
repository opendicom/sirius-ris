//--------------------------------------------------------------------------------------------------------------------//
// PERFORMING STATS HANDLER:
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

                //Initializate domain condition:
                let domainCondition = { 'appointment.imaging.branch._id': mongoose.Types.ObjectId(fk_branch) };

                //Check RABC filter condition:
                if(req.query.rabc_filter !== undefined && req.query.rabc_filter !== null && req.query.rabc_filter !== ''){
                    domainCondition = {
                        "$and":[
                            req.query.rabc_filter, //Add RABC filter condition.
                            { 'appointment.imaging.branch._id': mongoose.Types.ObjectId(fk_branch) }
                        ]
                    };
                }

                //Add aggregate to request:
                req.query['aggregate'] = [{
                    $match: {
                        "$and":[
                            {
                                "date":{
                                    "$gte": new Date(start_date + "T00:00:00.000Z")
                                }
                            },
                            {
                                "date":{
                                    "$lte": new Date(end_date + "T23:59:59.000Z")
                                }
                            }
                        ]
                    }
                }];

                //Add Domain lookups in pipe aggregation (Previously necessary to filter by organization):
                req.query.aggregate.push(
                    //Appointment (Lookup & Unwind):
                    { $lookup: {
                        from: 'appointments',
                        localField: 'fk_appointment',
                        foreignField: '_id',
                        as: 'appointment',
                    }},
                    { $unwind: { path: "$appointment", preserveNullAndEmptyArrays: true } },

                    //------------------------------------------------------------------------------------------------------------//
                    // APPOINTMENT IMAGING:
                    //------------------------------------------------------------------------------------------------------------//
                    //Organizations lookup:
                    { $lookup: {
                        from: 'organizations',
                        localField: 'appointment.imaging.organization',
                        foreignField: '_id',
                        as: 'appointment.imaging.organization',
                    }},

                    //Branches lookup:
                    { $lookup: {
                        from: 'branches',
                        localField: 'appointment.imaging.branch',
                        foreignField: '_id',
                        as: 'appointment.imaging.branch',
                    }},

                    //Services lookup:
                    { $lookup: {
                        from: 'services',
                        localField: 'appointment.imaging.service',
                        foreignField: '_id',
                        as: 'appointment.imaging.service',
                    }},

                    //Unwind:
                    { $unwind: { path: "$appointment.imaging.organization", preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: "$appointment.imaging.branch", preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: "$appointment.imaging.service", preserveNullAndEmptyArrays: true } },
                    //------------------------------------------------------------------------------------------------------------//


                    //------------------------------------------------------------------------------------------------------------//
                    // REFERRING:
                    //------------------------------------------------------------------------------------------------------------//
                    //Organizations lookup:
                    { $lookup: {
                        from: 'organizations',
                        localField: 'appointment.referring.organization',
                        foreignField: '_id',
                        as: 'appointment.referring.organization',
                    }},

                    //Branches lookup:
                    { $lookup: {
                        from: 'branches',
                        localField: 'appointment.referring.branch',
                        foreignField: '_id',
                        as: 'appointment.referring.branch',
                    }},

                    //Services lookup:
                    { $lookup: {
                        from: 'services',
                        localField: 'appointment.referring.service',
                        foreignField: '_id',
                        as: 'appointment.referring.service',
                    }},

                    //Unwind:
                    { $unwind: { path: "$appointment.referring.organization", preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: "$appointment.referring.branch", preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: "$appointment.referring.service", preserveNullAndEmptyArrays: true } },
                    //------------------------------------------------------------------------------------------------------------//
        
        
                    //------------------------------------------------------------------------------------------------------------//
                    // REPORTING:
                    //------------------------------------------------------------------------------------------------------------//
                    //Organizations lookup:
                    { $lookup: {
                        from: 'organizations',
                        localField: 'appointment.reporting.organization',
                        foreignField: '_id',
                        as: 'appointment.reporting.organization',
                    }},

                    //Branches lookup:
                    { $lookup: {
                        from: 'branches',
                        localField: 'appointment.reporting.branch',
                        foreignField: '_id',
                        as: 'appointment.reporting.branch',
                    }},

                    //Services lookup:
                    { $lookup: {
                        from: 'services',
                        localField: 'appointment.reporting.service',
                        foreignField: '_id',
                        as: 'appointment.reporting.service',
                    }},

                    //Unwind:
                    { $unwind: { path: "$appointment.reporting.organization", preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: "$appointment.reporting.branch", preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: "$appointment.reporting.service", preserveNullAndEmptyArrays: true } },
                    //------------------------------------------------------------------------------------------------------------//
                    

                    //------------------------------------------------------------------------------------------------------------//
                    // APPOINTMENT PATIENT:
                    //------------------------------------------------------------------------------------------------------------//
                    //Patient (Lookup & Unwind):
                    { $lookup: {
                        from: 'users',
                        localField: 'appointment.fk_patient',
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
                    //------------------------------------------------------------------------------------------------------------//

                    //Equipment (Lookup & Unwind):
                    { $lookup: {
                        from: 'equipments',
                        localField: 'fk_equipment',
                        foreignField: '_id',
                        as: 'equipment',
                    }},
                    { $unwind: { path: "$equipment", preserveNullAndEmptyArrays: true } },

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
                    { $unwind: { path: "$modality", preserveNullAndEmptyArrays: true } }
                );

                //Add RABC match operation to aggregations:
                req.query.aggregate.push({ $match: domainCondition });

                //Add stats pipe aggregation:
                req.query.aggregate.push({
                    //------------------------------------------------------------------------------------------------------------//
                    // STATS SECTION:
                    //------------------------------------------------------------------------------------------------------------//
                    //$facet: allows multiple aggregations to be performed in parallel.
                    "$facet": {
                        
                        //Flow state:
                        "flow_state": [
                            {
                                "$group": {
                                    "_id": "$flow_state",
                                    "count": { "$sum": 1 }
                                }
                            },
                            {
                                "$group": {
                                    "_id": null,
                                    "flow_state": { "$push": { "k": "$_id", "v": "$count" } }
                                }
                            },
                            { "$replaceRoot": { "newRoot": { "$arrayToObject": "$flow_state" } } }
                        ],
                        
                        //Urgency:
                        "urgency": [
                            {
                                "$group": {
                                    "_id": "$urgency",
                                    "count": { "$sum": 1 }
                                }
                            },
                            {
                                "$group": {
                                    "_id": null,
                                    "urgency": { "$push": { "k": { "$toString": "$_id" }, "v": "$count" } }
                                }
                            },
                            { "$replaceRoot": { "newRoot": { "$arrayToObject": "$urgency" } } }
                        ],

                        //Equipment:
                        "equipment": [
                            {
                                "$group": {
                                    "_id": "$equipment.name",
                                    "count": { "$sum": 1 }
                                }
                            },
                            {
                                "$group": {
                                    "_id": null,
                                    "equipment": { "$push": { "k": "$_id", "v": "$count" } }
                                }
                            },
                            { "$replaceRoot": { "newRoot": { "$arrayToObject": "$equipment" } } }
                        ],

                        //Procedure:
                        "procedure": [
                            {
                                "$group": {
                                    "_id": "$procedure.name",
                                    "count": { "$sum": 1 },
                                }
                            },
                            {
                                "$group": {
                                    "_id": null,
                                    "procedure": { "$push": { "k": "$_id", "v": "$count" } }
                                }
                            },
                            { "$replaceRoot": { "newRoot": { "$arrayToObject": "$procedure" } } }
                        ],

                        //Modality:
                        "modality": [
                            {
                                "$group": {
                                    "_id": "$modality.code_value",
                                    "count": { "$sum": 1 }
                                }
                            },
                            {
                                "$group": {
                                    "_id": null,
                                    "modality": { "$push": { "k": "$_id", "v": "$count" } }
                                }
                            },
                            { "$replaceRoot": { "newRoot": { "$arrayToObject": "$modality" } } }
                        ],

                        //Gender:
                        "gender": [
                            {
                            "$group": {
                                "_id": "$patient.person.gender",
                                "count": { "$sum": 1 }
                            }
                            },
                            {
                            "$group": {
                                "_id": null,
                                "gender": { "$push": { "k": { "$toString": "$_id" }, "v": "$count" } }
                            }
                            },
                            { "$replaceRoot": { "newRoot": { "$arrayToObject": "$gender" } } }
                        ],

                        //Injection user:
                        "injection_user":[
                            {
                                "$group":{
                                    "_id":"$injection.injection_user",
                                    "count":{
                                        "$sum":1
                                    }
                                }
                            },
                            //Filter documents where _id is not null:
                            { "$match": { "_id": { "$ne": null } } },

                            {
                                "$group":{
                                    "_id":null,
                                    "injection_user":{
                                        "$push":{
                                            "k":{
                                                "$toString":"$_id" //Convert _id to string.
                                            },
                                            "v":"$count"
                                        }
                                    }
                                }
                            },
                            { "$replaceRoot":{ "newRoot":{ "$arrayToObject":"$injection_user" } } }
                        ],

                        //Laboratory user:
                        "laboratory_user":[
                            {
                                "$group":{
                                    "_id":"$injection.pet_ct.laboratory_user",
                                    "count":{
                                        "$sum":1
                                    }
                                }
                            },
                            //Filter documents where _id is not null:
                            { "$match": { "_id": { "$ne": null } } },

                            {
                                "$group":{
                                    "_id":null,
                                    "laboratory_user":{
                                        "$push":{
                                            "k":{
                                                "$toString":"$_id" //Convert _id to string.
                                            },
                                            "v":"$count"
                                        }
                                    }
                                }
                            },
                            { "$replaceRoot":{ "newRoot":{ "$arrayToObject":"$laboratory_user" } } }
                        ],

                        //Console technician:
                        "console_technician":[
                            {
                                "$group":{
                                    "_id":"$acquisition.console_technician",
                                    "count":{
                                        "$sum":1
                                    }
                                }
                            },
                            //Filter documents where _id is not null:
                            { "$match": { "_id": { "$ne": null } } },

                            {
                                "$group":{
                                    "_id":null,
                                    "console_technician":{
                                        "$push":{
                                            "k":{
                                                "$toString":"$_id" //Convert _id to string.
                                            },
                                            "v":"$count"
                                        }
                                    }
                                }
                            },
                            { "$replaceRoot":{ "newRoot":{ "$arrayToObject":"$console_technician" } } }
                        ],

                        //Cancellation reasons:
                        "cancellation_reasons":[
                            {
                                "$group":{
                                    "_id":"$cancellation_reasons",
                                    "count":{
                                        "$sum":1
                                    }
                                }
                            },
                            //Filter documents where _id is not null:
                            { "$match": { "_id": { "$ne": null } } },

                            {
                                "$group":{
                                    "_id":null,
                                    "cancellation_reasons":{
                                        "$push":{
                                            "k":{
                                                "$toString":"$_id" //Convert _id (Number) to string.
                                            },
                                            "v":"$count"
                                        }
                                    }
                                }
                            },
                            { "$replaceRoot":{ "newRoot":{ "$arrayToObject":"$cancellation_reasons" } } }
                        ],

                        //Country:
                        "country": [
                            {
                                "$group": {
                                    "_id": "$appointment.current_address.country",
                                    "count": { "$sum": 1 },
                                }
                            },
                            {
                                "$group": {
                                    "_id": null,
                                    "country": { "$push": { "k": "$_id", "v": "$count" } }
                                }
                            },
                            { "$replaceRoot": { "newRoot": { "$arrayToObject": "$country" } } }
                        ],
        
                        //State:
                        "state": [
                            {
                                "$group": {
                                    "_id": { "country" : "$appointment.current_address.country", "state" : "$appointment.current_address.state" },
                                    "count": { "$sum": 1 },
                                }
                            },
                            {
                                "$group": {
                                    "_id": null,
                                    "state": { "$push": { "k": { "$concat": [ "$_id.country", " - " , "$_id.state" ]}, "v": "$count" } }
                                }
                            },
                            { "$replaceRoot": { "newRoot": { "$arrayToObject": "$state" } } }
                        ],

                        //Referring:
                        "referring": [
                            {
                                "$group": {
                                    "_id": "$appointment.referring.organization.short_name",
                                    "count": { "$sum": 1 }
                                }
                            },
                            {
                                "$group": {
                                    "_id": null,
                                    "referring": { "$push": { "k": "$_id", "v": "$count" } }
                                }
                            },
                            { "$replaceRoot": { "newRoot": { "$arrayToObject": "$referring" } } }
                        ],
        
                        //Reporting:
                        "reporting": [
                            {
                                "$group": {
                                    "_id": { "organization" : "$appointment.reporting.organization.short_name", "branch" : "$appointment.reporting.branch.short_name", "service" : "$appointment.reporting.service.name" },
                                    "count": { "$sum": 1 },
                                }
                            },
                            {
                                "$group": {
                                    "_id": null,
                                    "reporting": { "$push": { "k": { "$concat": [ "$_id.organization", " - " , "$_id.branch", " - " , "$_id.service" ]}, "v": "$count" } }
                                }
                            },
                            { "$replaceRoot": { "newRoot": { "$arrayToObject": "$reporting" } } }
                        ],
  

                        //Anesthesia:
                        "anesthesia_count": [
                            {
                                "$match": {
                                    "anesthesia": { "$ne": null } // Filtrar documentos donde 'anesthesia' no sea nulo
                                }
                            },
                            {
                                "$count": "count" // Contar documentos con 'anesthesia' no nulo
                            }
                        ],

                        //Total count:
                        "total": [
                            {
                                "$group": {
                                "_id": null,
                                "count": { "$sum": 1 }
                                }
                            },
                            {
                                "$project": {
                                    "_id": 0,
                                    "count": "$count"
                                }
                            }
                        ]
                    }
                },
                //------------------------------------------------------------------------------------------------------------//

                //Delete the 'anesthesia count' field and add the 'anesthesia' field with the result:
                {
                    "$addFields": {
                        "anesthesia": { "$ifNull": ["$anesthesia_count.count", 0] }
                    }
                },
                {
                    "$project": {
                        "anesthesia_count": 0 //Delete the 'anesthesia_count' field.
                    }
                },

                //Additional $replaceRoot at the end to combine the results:
                {
                    "$replaceRoot": {
                        "newRoot": {
                            "$mergeObjects": [
                                { "flow_state": { "$first": "$flow_state" } },
                                { "urgency": { "$first": "$urgency" } },
                                { "equipment": { "$first": "$equipment" } },
                                { "procedure": { "$first": "$procedure" } },
                                { "modality": { "$first": "$modality" } },
                                { "gender": { "$first": "$gender" } },
                                { "injection_user": { "$first": "$injection_user" } },
                                { "laboratory_user": { "$first": "$laboratory_user" } },
                                { "console_technician": { "$first": "$console_technician" } },
                                { "cancellation_reasons": { "$first": "$cancellation_reasons" } },
                                { "country": { "$first": "$country" } },
                                { "state": { "$first": "$state" } },
                                { "referring": { "$first": "$referring" } },
                                { "reporting": { "$first": "$reporting" } },
                                { "anesthesia": { "$first": "$anesthesia" } },
                                { "total_items": { "$first": "$total.count" } }
                            ]
                        },
                    }
                });

                //Excecute main query:
                await moduleServices.findAggregation(req, res, performing, true);
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