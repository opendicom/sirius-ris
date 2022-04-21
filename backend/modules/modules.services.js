//--------------------------------------------------------------------------------------------------------------------//
// MODULES SERVICES:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const mongoose              = require('mongoose');
const { validationResult }  = require('express-validator');                 //Express-validator Middleware.

//Import app modules:
const mainServices  = require('../main.services');                          // Main services
const mainSettings  = mainServices.getFileSettings();                       // File settings (YAML)
const currentLang   = require('../main.languages')(mainSettings.language);  // Language Module
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// FIND:
// Finds all the records in the collection that match the filters, the projection and the requested sort.
//--------------------------------------------------------------------------------------------------------------------//
async function find(req, res, currentSchema){
    //Get query params:
    let { filter, proj, sort, pager } = req.query;

    //Parse skip and limit value (string) to integer (base 10):
    req.query.skip = parseInt(req.query.skip, 10);
    req.query.limit = parseInt(req.query.limit, 10);

    //Validate and format data projection:
    const formatted_proj = mainServices.mongoDBObjFormat(proj);

    //Check if Pager was requested:
    if(pager){ pager = setPager(req, pager); }

    //Count using query params:
    await currentSchema.Model.countDocuments(filter)
    .exec()
    .then(async (count) => {
        //Check result count:
        if(count > 0){
            //Excecute main query:
            await currentSchema.Model.find(filter, formatted_proj).skip(req.query.skip).limit(req.query.limit).sort(sort)
            .exec()
            .then((data) => {
                //Check if have results:
                if(data){ 
                    //Validate and set paginator:
                    let pager_data;
                    if(pager){
                        pager_data = {
                            total_items: count,
                            items_per_page: req.query.limit,
                            viewed_items: data.length,
                            number_of_pages: Math.ceil(count / req.query.limit),
                            actual_page: pager.page_number
                        };
                    } else {
                        pager_data = currentLang.http.pager_disabled;
                    }

                    //Send successfully response:
                    res.status(200).send({
                        success: true,
                        data: data,
                        pager: pager_data,
                    });
                } else {
                    //No data (empty result):
                    res.status(200).send({ success: true, data: [], message: currentLang.db.query_no_data });
                }
            })
            .catch((err) => {
                //Send error:
                mainServices.sendError(res, currentLang.db.query_error, err);
            });
        } else {
            //No data (empty result):
            res.status(200).send({ success: true, data: [], message: currentLang.db.query_no_data });
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// FIND BY ID:
// Find an element based on an ID.
//--------------------------------------------------------------------------------------------------------------------//
async function findById(req, res, currentSchema){
    //Get query params:
    let { filter, proj } = req.query;

    //Validate ID request:
    if(!mainServices.validateRequestID(filter._id, res)) return;

    //Validate and format data projection:
    const formatted_proj = mainServices.mongoDBObjFormat(proj);

    //Execute main query:
    await currentSchema.Model.findById(filter._id, formatted_proj)
    .exec()
    .then((data) => {
        //Check if have results:
        if(data){
            //Send successfully response:
            res.status(200).send({ success: true, data: data });
        } else {
            //No data (empty result):
            res.status(200).send({ success: true, data: [], message: currentLang.db.query_no_data });
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// FIND ONE:
// Find for a single item (first occurrence), in the collection that match the filters, the projection and the
// requested sort.
//--------------------------------------------------------------------------------------------------------------------//
async function findOne(req, res, currentSchema){
    //Get query params:
    let { filter, proj, sort } = req.query;

    //Validate and format data projection:
    const formatted_proj = mainServices.mongoDBObjFormat(proj);
    
    await currentSchema.Model.findOne(filter, formatted_proj).sort(sort)
    .exec()
    .then((data) => {
        //Check if have results:
        if(data){
            //Send successfully response:
            res.status(200).send({ success: true, data: data });
        } else {
            //No data (empty result):
            res.status(200).send({ success: true, data: [], message: currentLang.db.query_no_data });
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// INSERT:
// Creates a new record in the database.
//--------------------------------------------------------------------------------------------------------------------//
async function insert(req, res, currentSchema){
    //Get validation result:
    const errors = validationResult(req);

    //Check validation result (express-validator):
    if(!errors.isEmpty()){
        //Initialize container array of validation messages:
        let validate_messages = [];

        //Walk through validation errors and load them into the message array:
        errors.array().forEach(element => {
            validate_messages.push(element.msg);
        });
    
        //Return the result (HTML Response):
        res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: validate_messages });
    } else {
        //Create Mongoose object to insert validated data:
        const objData = new currentSchema.Model(req.body);
        
        //Save data into DB:
        await objData.save(objData)
        .then(async (data) => {
            //Send successfully response:
            res.status(200).send({ success: true, message: currentLang.db.insert_success, data: data });
        })
        .catch((err) => {
            //Send error:
            mainServices.sendError(res, currentLang.db.insert_error, err);
        });
    }
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// UPDATE:
// Validate against the current model and if positive, updates an existing record in the database according to the
// ID and specified parameters.
//--------------------------------------------------------------------------------------------------------------------//
async function update(req, res, currentSchema){
    //Validate ID request:
    if(!mainServices.validateRequestID(req.body._id, res)) return;

    //Get validation result (global: all elements):
    const errors = validationResult(req);

    //Initialize container array of validation messages:
    let validate_messages = [];

    //Check validation result (express-validator):
    if(!errors.isEmpty()){
        //Get keys of the elements allowed to set:
        const setKeys = Object.keys(req.validatedResult.set)

        //Check if the elements to be set contain errors:
        errors.array().forEach(element => {
            if(setKeys.includes(element.param)){
                validate_messages.push(element.msg);
            }
        });
    }

    //Check only the validation of the fields allowed to set:
    if(Object.keys(validate_messages).length === 0){
        //Save data into DB:
        await currentSchema.Model.findOneAndUpdate({_id: req.body._id },{$set: req.validatedResult.set }, {new:true})
        .then(async (data) => {
            //Check if have results:
            if(data) {
                //Delete _id of blocked items for message:
                delete req.validatedResult.blocked._id;

                //Send successfully response:
                res.status(200).send({ success: true, data: data, blocked_attributes: req.validatedResult.blocked });
            } else {
                //Dont match (empty result):
                res.status(200).send({ success: true, message: currentLang.db.id_no_results });
            }
        })
        .catch((err) => {
            //Send error:
            mainServices.sendError(res, currentLang.db.update_error, err);
        });
    } else {
        //Return the result (HTML Response):
        res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: validate_messages });
    }
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// DELETE:
// Delete an item from the database based on an ID (This method is reserved for developers).
//--------------------------------------------------------------------------------------------------------------------//
async function _delete(req, res, currentSchema){
    //Validate ID request:
    if(!mainServices.validateRequestID(req.body._id, res)) return;

    //Delete element:
    await currentSchema.Model.findOneAndDelete({ _id: req.body._id })
    .exec()
    .then((data) => {
        if(data) {
            //Send successfully response:
            res.status(200).send({ success: true, message: currentLang.db.delete_success, data: data });
        } else {
            //Dont match (empty result):
            res.status(404).send({ success: false, message: currentLang.db.delete_id_no_results, _id: req.body._id });
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.delete_error, err);
    });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// FIND AGGREGATION:
//--------------------------------------------------------------------------------------------------------------------//
async function findAggregation(req, res, currentSchema){
    //Get query params:
    let { aggregate, proj, skip, limit, sort, pager } = req.query;

    //Parse skip and limit value (string) to integer (base 10):
    req.query.skip = parseInt(req.query.skip, 10);
    req.query.limit = parseInt(req.query.limit, 10);

    //Validate and format sort and data projection:
    let formatted_proj = mainServices.mongoDBObjFormat(proj);
    let formatted_sort = mainServices.mongoDBObjFormat(sort);

    //Check if Pager was requested:
    if(pager){ pager = setPager(req, pager); }

    //Duplicate aggregate array object to count query:
    let aggregateCount = Object.assign([], aggregate);

    //Add count operation:
    aggregateCount.push({ $count: "total_count" });

    //Add operations to the main aggregation (skip and limit bad count):
    if(formatted_proj != ''){ aggregate.push({ $project: formatted_proj }); }
    if(!isNaN(req.query.skip)){ aggregate.push({ $skip: req.query.skip }); }
    if(!isNaN(req.query.limit)){ aggregate.push({ $limit: req.query.limit }); }
    if(formatted_sort != ''){ aggregate.push({ $sort: formatted_sort }); }

    //Count using query params:
    await currentSchema.Model.aggregate(aggregateCount)
    .exec()
    .then(async (count) => {
        //Check result count:
        if(count.length !== 0){
            //In aggregate count is an array:
            count = count[0].total_count;

            //Excecute main query:
            await currentSchema.Model.aggregate(aggregate)
            .exec()
            .then((data) => {
                //Check if have results:
                if(data){
                    //Validate and set paginator:
                    let pager_data;
                    if(pager){
                        pager_data = {
                            total_items: count,
                            items_per_page: req.query.limit,
                            viewed_items: data.length,
                            number_of_pages: Math.ceil(count / req.query.limit),
                            actual_page: pager.page_number
                        };
                    } else {
                        pager_data = currentLang.http.pager_disabled;
                    }

                    //Send successfully response:
                    res.status(200).send({
                        success: true,
                        data: data,
                        pager: pager_data,
                    });
                } else {
                    //No data (empty result):
                    res.status(200).send({ success: true, data: [], message: currentLang.db.query_no_data });
                }
            })
            .catch((err) => {
                //Send error:
                mainServices.sendError(res, currentLang.db.query_error, err);
            });
        } else {
            //No data (empty result):
            res.status(200).send({ success: true, data: [], message: currentLang.db.query_no_data });
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET PAGER:
//--------------------------------------------------------------------------------------------------------------------//
function setPager(req, pager){
    //Parse page_number and page_limit value (string) to integer (base 10):
    pager.page_number = parseInt(pager.page_number, 10);
    pager.page_limit = parseInt(pager.page_limit, 10);

    //If dosn't exist, set page number:
    if(!pager.page_number){
        pager.page_number = 1;
    }

    //Set page limit and and replace limit param:
    if(pager.page_limit){
        req.query.limit = pager.page_limit;
    } else {
        //Set default page limit value:
        req.query.limit = 10;
    }

    //Calculate and replace skip value (Paginate):
    req.query.skip = (pager.page_number-1)*req.query.limit;

    //Return edited pager:
    return pager;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// ADJUST DATA TYPES:
//--------------------------------------------------------------------------------------------------------------------//
function adjustDataTypes(filter, schemaName, asPrefix = ''){
    //Check asPrefix and add dot:
    if(asPrefix != ''){
        asPrefix = asPrefix + '.';
    }

    //Correct data types:
    switch(schemaName){
        case 'users':
            if(filter[asPrefix + 'fk_people'] != undefined){ filter[asPrefix + 'fk_people'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_people']); };
            if(filter[asPrefix + 'permissions.organization'] != undefined){ filter[asPrefix + 'permissions.organization'] = mongoose.Types.ObjectId(filter[asPrefix + 'permissions.organization']); }
            if(filter[asPrefix + 'permissions.branch'] != undefined){ filter[asPrefix + 'permissions.branch'] = mongoose.Types.ObjectId(filter[asPrefix + 'permissions.branch']); }
            if(filter[asPrefix + 'permissions.service'] != undefined){ filter[asPrefix + 'permissions.service'] = mongoose.Types.ObjectId(filter[asPrefix + 'permissions.service']); }
            if(filter[asPrefix + 'permissions.role'] != undefined){ filter[asPrefix + 'permissions.role'] = parseInt(filter['permissions.role']); }
            if(filter[asPrefix + 'permissions.concession'] != undefined){ filter[asPrefix + 'permissions.concession'] = filter[asPrefix + 'permissions.concession'][0] = parseInt(filter[asPrefix + 'permissions.concession']); }
            if(filter[asPrefix + 'settings.viewer'] != undefined){ filter[asPrefix + 'settings.viewer'] = parseInt(filter[asPrefix + 'settings.viewer']); }
            if(filter[asPrefix + 'settings.theme'] != undefined){ filter[asPrefix + 'settings.theme'] = parseInt(filter[asPrefix + 'settings.theme']); }
            if(filter[asPrefix + 'status'] != undefined){ filter[asPrefix + 'status'] = mainServices.stringToBoolean(filter[asPrefix + 'status']); };
            break;

        case 'people':
            if(filter[asPrefix + 'documents.doc_type'] != undefined){ filter[asPrefix + 'documents.doc_type'] = parseInt(filter[asPrefix + 'documents.doc_type']); }
            if(filter[asPrefix + 'gender'] != undefined){ filter[asPrefix + 'gender'] = parseInt(filter[asPrefix + 'gender']); }
            if(filter[asPrefix + 'birth_date'] != undefined){ filter[asPrefix + 'birth_date'] = new Date(filter[asPrefix + 'birth_date']); }
            if(filter[asPrefix + 'phone_numbers'] != undefined){ filter[asPrefix + 'phone_numbers'] = filter[asPrefix + 'phone_numbers'][0] = parseInt(filter[asPrefix + 'phone_numbers']); }
            break;

        case 'organitations':
            if(filter[asPrefix + 'status'] != undefined){ filter[asPrefix + 'status'] = mainServices.stringToBoolean(filter[asPrefix + 'status']); };
            break;

        case 'branches':
            if(filter[asPrefix + 'fk_organization'] != undefined){ filter[asPrefix + 'fk_organization'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_organization']); };
            if(filter[asPrefix + 'status'] != undefined){ filter[asPrefix + 'status'] = mainServices.stringToBoolean(filter[asPrefix + 'status']); };
            break;

        case 'services':
            if(filter[asPrefix + 'fk_branch'] != undefined){ filter[asPrefix + 'fk_branch'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_branch']); };
            if(filter[asPrefix + 'fk_modality'] != undefined){ filter[asPrefix + 'fk_modality'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_modality']); };
            if(filter[asPrefix + 'status'] != undefined){ filter[asPrefix + 'status'] = mainServices.stringToBoolean(filter[asPrefix + 'status']); };
            break;

        case 'modalities':
            if(filter[asPrefix + 'status'] != undefined){ filter[asPrefix + 'status'] = mainServices.stringToBoolean(filter[asPrefix + 'status']); };
            break;
    }

    //Return adjusted filter:
    return filter;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export Module services:
//--------------------------------------------------------------------------------------------------------------------//
module.exports = {
    find,
    findById,
    findOne,
    insert,
    update,
    _delete,
    findAggregation,
    adjustDataTypes
};
//--------------------------------------------------------------------------------------------------------------------//