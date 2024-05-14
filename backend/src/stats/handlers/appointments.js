//--------------------------------------------------------------------------------------------------------------------//
// APPOINTMENTS STATS HANDLER:
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

          //Initializate domain condition:
          let domainCondition = { 'imaging.branch': mongoose.Types.ObjectId(fk_branch) };

          //Check RABC filter condition:
          if(req.query.rabc_filter !== undefined && req.query.rabc_filter !== null && req.query.rabc_filter !== ''){
            domainCondition = {
              "$and":[
                req.query.rabc_filter, //Add RABC filter condition.
                { 'imaging.branch': mongoose.Types.ObjectId(fk_branch) }
              ]
            };
          }
          
          //Add aggregate to request:
          req.query['aggregate'] = [
            { $match: {
              "$and":[
                //Date range condition:
                {
                    "start":{
                      "$gte": new Date(start_date + "T00:00:00.000Z")
                    }
                },
                {
                    "end":{
                      "$lte": new Date(end_date + "T23:59:59.000Z")
                    }
                },

                //Domain condition:
                domainCondition
              ]
            }
          }];

          //Add stats pipe aggregation:
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

            //Services lookup:
            { $lookup: {
                from: 'services',
                localField: 'imaging.service',
                foreignField: '_id',
                as: 'imaging.service',
            }},

            //Unwind:
            { $unwind: { path: "$imaging.organization", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$imaging.branch", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$imaging.service", preserveNullAndEmptyArrays: true } },
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

            //Services lookup:
            { $lookup: {
                from: 'services',
                localField: 'referring.service',
                foreignField: '_id',
                as: 'referring.service',
            }},

            //Unwind:
            { $unwind: { path: "$referring.organization", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$referring.branch", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$referring.service", preserveNullAndEmptyArrays: true } },
            //------------------------------------------------------------------------------------------------------------//


            //------------------------------------------------------------------------------------------------------------//
            // REPORTING:
            //------------------------------------------------------------------------------------------------------------//
            //Organizations lookup:
            { $lookup: {
              from: 'organizations',
              localField: 'reporting.organization',
              foreignField: '_id',
              as: 'reporting.organization',
            }},

            //Branches lookup:
            { $lookup: {
                from: 'branches',
                localField: 'reporting.branch',
                foreignField: '_id',
                as: 'reporting.branch',
            }},

            //Services lookup:
            { $lookup: {
                from: 'services',
                localField: 'reporting.service',
                foreignField: '_id',
                as: 'reporting.service',
            }},

            //Unwind:
            { $unwind: { path: "$reporting.organization", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$reporting.branch", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$reporting.service", preserveNullAndEmptyArrays: true } },
            //------------------------------------------------------------------------------------------------------------//

            //Imaging -> Service -> Modality (Lookup & Unwind):
            { $lookup: {
              from: 'modalities',
              localField: 'imaging.service.fk_modality',
              foreignField: '_id',
              as: 'modality',
            }},
            { $unwind: { path: "$modality", preserveNullAndEmptyArrays: true } },

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

            //Slot (Lookup & Unwind):
            { $lookup: {
              from: 'slots',
              localField: 'fk_slot',
              foreignField: '_id',
              as: 'slot',
            }},
            { $unwind: { path: "$slot", preserveNullAndEmptyArrays: true } },

            //Equipment -> Slot (Lookup & Unwind):
            { $lookup: {
                from: 'equipments',
                localField: 'slot.fk_equipment',
                foreignField: '_id',
                as: 'slot.equipment',
            }},
            { $unwind: { path: "$slot.equipment", preserveNullAndEmptyArrays: true } },

            //Procedure (Lookup & Unwind):
            { $lookup: {
                from: 'procedures',
                localField: 'fk_procedure',
                foreignField: '_id',
                as: 'procedure',
            }},
            { $unwind: { path: "$procedure", preserveNullAndEmptyArrays: true } },

            //------------------------------------------------------------------------------------------------------------//
            // STATS SECTION:
            //------------------------------------------------------------------------------------------------------------//
            {
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

                //Outpatient:
                "outpatient": [
                  {
                    "$group": {
                      "_id": "$outpatient",
                      "count": { "$sum": 1 }
                    }
                  },
                  {
                    "$group": {
                      "_id": null,
                      "outpatient": { "$push": { "k": { "$toString": "$_id" }, "v": "$count" } }
                    }
                  },
                  { "$replaceRoot": { "newRoot": { "$arrayToObject": "$outpatient" } } }
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

                //Equipment:
                "equipment": [
                  {
                    "$group": {
                      "_id": "$slot.equipment.name",
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
                      "_id": "$current_address.country",
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
                          "_id": { "country" : "$current_address.country", "state" : "$current_address.state" },
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
                      "_id": "$referring.organization.short_name",
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
                          "_id": { "organization" : "$reporting.organization.short_name", "branch" : "$reporting.branch.short_name", "service" : "$reporting.service.name" },
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

            //Additional $replaceRoot at the end to combine the results:
            {
              "$replaceRoot": {
                "newRoot": {
                  "$mergeObjects": [
                    { "flow_state": { "$first": "$flow_state" } },
                    { "urgency": { "$first": "$urgency" } },
                    { "outpatient": { "$first": "$outpatient" } },
                    { "modality": { "$first": "$modality" } },
                    { "gender": { "$first": "$gender" } },
                    { "equipment": { "$first": "$equipment" } },
                    { "procedure": { "$first": "$procedure" } },
                    { "cancellation_reasons": { "$first": "$cancellation_reasons" } },
                    { "country": { "$first": "$country" } },
                    { "state": { "$first": "$state" } },
                    { "referring": { "$first": "$referring" } },
                    { "reporting": { "$first": "$reporting" } },
                    { "total_items": { "$first": "$total.count" } }
                  ]
                },
              }
            }
          );

          //Excecute main query:
          await moduleServices.findAggregation(req, res, appointments, true);
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