//--------------------------------------------------------------------------------------------------------------------//
// MODULES SERVICES:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const mongoose              = require('mongoose');                          // Mongoose
const moment                = require('moment');                            // Moment
const ObjectId              = require('mongoose').Types.ObjectId;           // To check ObjectId Type
const { validationResult }  = require('express-validator');                 // Express-validator Middleware
const SHA256                = require("crypto-js/sha256");                  // CryptoJS
const fs                    = require('fs').promises;                       // File System (Promises)

//Import app modules:
const mainServices  = require('../main.services');                          // Main services
const mainSettings  = mainServices.getFileSettings();                       // File settings (YAML)
const currentLang   = require('../main.languages')(mainSettings.language);  // Language Module

//Set ObjectId Regex to validate:
const regexObjectId = /^[0-9a-fA-F]{24}$/;
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// FIND:
// Finds all the records in the collection that match the filters, the projection and the requested sort.
//--------------------------------------------------------------------------------------------------------------------//
async function find(req, res, currentSchema){
    //Get query params:
    let { filter, proj, sort, pager, regex } = req.query;

    //Set condition:
    const condition = await setCondition(filter, regex);

    //Parse skip and limit value (string) to integer (base 10):
    req.query.skip = parseInt(req.query.skip, 10);
    req.query.limit = parseInt(req.query.limit, 10);

    //Validate and format data projection:
    const formatted_proj = mainServices.mongoDBObjFormat(proj);

    //Check if Pager was requested:
    if(pager){ pager = setPager(req, pager); }

    //Send DEBUG Message:
    mainServices.sendConsoleMessage('DEBUG', '\nfind [processed condition]: ' + JSON.stringify(condition));

    //Count using query params:
    await currentSchema.Model.countDocuments(condition)
    .exec()
    .then(async (count) => {
        //Check result count:
        if(count > 0){
            //Excecute main query:
            await currentSchema.Model.find(condition, formatted_proj)
            .sort({ '_id': -1 })    //Add default first sort (last records first).
            .skip(req.query.skip)
            .limit(req.query.limit)
            .sort(sort)
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

    //Send DEBUG Message:
    mainServices.sendConsoleMessage('DEBUG', '\nfind by id [processed condition]: ' + JSON.stringify({ _id: filter._id }));

    //Execute main query:
    await currentSchema.Model.findById(filter._id, formatted_proj)
    .exec()
    .then((data) => {
        //Check if have results:
        if(data){
            //Send successfully response:
            res.status(200).send({ success: true, data: [data] });
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
    let { filter, proj, sort, regex } = req.query;

    //Set condition:
    const condition = await setCondition(filter, regex);

    //Validate and format data projection:
    const formatted_proj = mainServices.mongoDBObjFormat(proj);

    //Send DEBUG Message:
    mainServices.sendConsoleMessage('DEBUG', '\nfind one [processed condition]: ' + JSON.stringify(condition));

    //Execute main query:
    await currentSchema.Model.findOne(condition, formatted_proj).sort(sort)
    .exec()
    .then((data) => {
        //Check if have results:
        if(data){
            //Send successfully response:
            res.status(200).send({ success: true, data: [data] });
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
async function insert(req, res, currentSchema, referencedElements = false, successResponse = true, callback = () => {}){
    //Get validation result:
    const errors = validationResult(req);

    //Initializate insertController:
    let insertController = false;

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

        //Set header sent property to check if header have already been sent:
        res.headerSent = true;
    } else {
        //Initialize secure insert variable:
        let secureInsert = true;

        //Check that the parents are valid:
        if(referencedElements){
            await Promise.all(referencedElements.map(async (value, key) => {
                //Check referenced elements:
                result = await ckeckElement(value[0], value[1], res);
                
                //Set secure insert:
                if(result === false) { secureInsert = false; }
            }));
        } else {
            //Set secure insert:
            secureInsert = true;
        }

        //Send DEBUG Message:
        mainServices.sendConsoleMessage('DEBUG', '\ninsert [processed data]: ' + JSON.stringify(req.body));
        
        //Check if secure insert:
        if(secureInsert){
            //Create Mongoose object to insert validated data:
            const objData = new currentSchema.Model(req.body);

            //Save data into DB:
            await objData.save(objData)
            .then(async (data) => {
                //Set log element:
                const element = {
                    type    : currentSchema.Model.modelName,
                    _id     : data._id
                };

                //Check specific RIS case - Report insert (Amend):
                if(currentSchema.Model.modelName == 'reports' && req.body.amend !== undefined && req.body.amend !== null && mainServices.stringToBoolean(req.body.amend) === true){
                    //Add details in element log entry:
                    element['details'] = 'amend';
                }

                //Save registry in Log DB:
                const logResult = await insertLog(req, res, 2, element);

                //Check log registry result:
                if(logResult){
                    //Check if you want successful http response (false to batch inserts):
                    if(successResponse){
                        //Send successfully response:
                        res.status(200).send({ success: true, message: currentLang.db.insert_success, data: data });

                        //Set insertController:
                        insertController = true;

                        //Set header sent property to check if header have already been sent:
                        res.headerSent = true;

                        //Excecute callback with result:
                        await callback(data);
                    }
                } else {
                    //Send log error response:
                    res.status(500).send({ success: false, message: currentLang.db.insert_error_log });
                }
            })
            .catch((err) => {
                //Send error:
                mainServices.sendError(res, currentLang.db.insert_error, err);

                //Set header sent property to check if header have already been sent:
                res.headerSent = true;
            });
        } else {
            //Set header sent property to check if header have already been sent:
            res.headerSent = true;
        }
    }

    //Return insertController:
    return insertController;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// UPDATE:
// Validate against the current model and if positive, updates an existing record in the database according to the
// ID and specified parameters.
//--------------------------------------------------------------------------------------------------------------------//
async function update(req, res, currentSchema, referencedElements = false, callback = () => {}){
    //Validate ID request:
    if(!mainServices.validateRequestID(req.body._id, res)) return;

    //Get validation result (global: all elements):
    const errors = validationResult(req);

    //Initialize container array of validation messages:
    let validate_messages = [];

    //Check validation result (express-validator):
    if(!errors.isEmpty()){
        //Get keys of the elements allowed to set:
        const setKeys = Object.keys(req.validatedResult.set);

        //Check if the elements to be set contain errors:
        errors.array().forEach(element => {
            if(setKeys.includes(element.param)){
                validate_messages.push(element.msg);
            }
        });
    }

    //Check only the validation of the fields allowed to set:
    if(Object.keys(validate_messages).length === 0){
        //Initialize secure update variable:
        let secureUpdate = true;

        //Check that the parents are valid:
        if(referencedElements){
            await Promise.all(referencedElements.map(async (value, key) => {
                //Check referenced elements:
                result = await ckeckElement(value[0], value[1], res);
                
                //Set secure update:
                if(result === false) { secureUpdate = false; }
            }));
        } else {
            //Set secure update:
            secureUpdate = true;
        }

        //Check if secure update:
        if(secureUpdate){
            //Initialize update Object:
            let updateObj = {};

            //Set update object:
            if(req.validatedResult.unset){
                updateObj = {
                    $set: req.validatedResult.set,
                    $unset: req.validatedResult.unset
                };
            } else {
                updateObj = { $set: req.validatedResult.set };
            }

            //Send DEBUG Message:
            mainServices.sendConsoleMessage('DEBUG', '\nupdate [processed data]: ' + JSON.stringify({ _id: req.body }, updateObj));

            //Save data into DB:
            await currentSchema.Model.findOneAndUpdate({ _id: req.body._id }, updateObj, { new: true })
            .then(async (data) => {
                //Check if have results:
                if(data) {
                    //Delete _id of blocked items for message:
                    delete req.validatedResult.blocked._id;

                    //Set empty blocked format:
                    if(Object.keys(req.validatedResult.blocked).length === 0) { req.validatedResult.blocked = false; }

                    //Set log element:
                    const element = {
                        type    : currentSchema.Model.modelName,
                        _id     : data._id
                    };

                    //Save registry in Log DB:
                    const logResult = await insertLog(req, res, 3, element);

                    //Check log registry result:
                    if(logResult){
                        //Send successfully response:
                        res.status(200).send({
                            success: true,
                            data: data,
                            blocked_attributes: req.validatedResult.blocked,
                            blocked_unset: req.validatedResult.blocked_unset
                        });
                    } else {
                        //Send log error response:
                        res.status(500).send({ success: false, message: currentLang.db.insert_error_log });
                    }

                    //Excecute callback with result:
                    await callback(data);
                } else {
                    //Dont match (empty result):
                    res.status(200).send({ success: true, message: currentLang.db.id_no_results });
                }
            })
            .catch((err) => {
                //Send error:
                mainServices.sendError(res, currentLang.db.update_error, err);
            });
        }
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
async function _delete(req, res, currentSchema, successResponse = true, callback = (data) => {}){
    //Validate ID request:
    if(!mainServices.validateRequestID(req.body._id, res)) return;

    //Check references of the element you want to delete:
    const result = await checkReferences(req.body._id, currentSchema.Model.modelName, currentSchema.ForeignKeys, res);

    //Check References Result:
    if(result){
        //Deletion rejected for dependencies:
        res.status(405).send({ success: false, message: currentLang.db.delete_rejected_dep, dependencies: result });

        //Set header sent property to check if header have already been sent:
        res.headerSent = true;
    } else {
        //Delete element:
        await currentSchema.Model.findOneAndDelete({ _id: req.body._id })
        .exec()
        .then(async (data) => {
            if(data) {
                //Send DEBUG Message:
                mainServices.sendConsoleMessage('DEBUG', '\ndelete [deleted document]: ' + JSON.stringify({ _id: req.body._id }));

                //Check if you want successful http response (false to batch delete):
                if(successResponse){
                    //Set log element:
                    const element = {
                        type    : currentSchema.Model.modelName,
                        _id     : data._id
                    };

                    //Save registry in Log DB:
                    const logResult = await insertLog(req, res, 4, element);

                    //Check log registry result:
                    if(logResult){
                        //Send successfully response:
                        res.status(200).send({ success: true, message: currentLang.db.delete_success, data: data });
                    } else {
                        //Send log error response:
                        res.status(500).send({ success: false, message: currentLang.db.insert_error_log });
                    }

                    //Execute callback:
                    callback(data);

                    //Set header sent property to check if header have already been sent:
                    res.headerSent = true;
                }
            } else {
                //Dont match (empty result):
                res.status(404).send({ success: false, message: currentLang.db.delete_id_no_results, _id: req.body._id });

                //Set header sent property to check if header have already been sent:
                res.headerSent = true;
            }
        })
        .catch((err) => {
            //Send error:
            mainServices.sendError(res, currentLang.db.delete_error, err);

            //Set header sent property to check if header have already been sent:
            res.headerSent = true;
        });
    }
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// BATCH DELETE:
//--------------------------------------------------------------------------------------------------------------------//
async function batchDelete(req, res, currentSchema){
    //Remove duplicates from an array:
    const toDelete = [...new Set(req.body._id)];

    //Check that there is at least one _id in the request:
    if(toDelete.length > 0){
        //Set header sent (First time):
        res.headerSent = false;

        //Loop through an id:
        for(let key in toDelete){
            //Set current _id into the request (prepare delete):
            req.body._id = toDelete[key];

            //Check if header have already been sent (Posibly validation errors):
            if(res.headerSent == false){
                //Set log element:
                const element = {
                    type    : currentSchema.Model.modelName,
                    _id     : req.body._id
                };

                //Save registry in Log DB (Without ckeck to prevent break the process):
                await insertLog(req, res, 4, element);
                
                //Send to module service:
                await _delete(req, res, currentSchema, false);
            }
        }
        
        //Check if header have already been sent (Posibly validation errors):
        if(res.headerSent == false){
            //Send successfully response:
            res.status(200).send({ success: true, message: currentLang.db.delete_success });
        }
    } else {
        //Return the result (HTML Response):
        res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.db.delete_empty_id });
    }
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// FIND AGGREGATION:
//--------------------------------------------------------------------------------------------------------------------//
async function findAggregation(req, res, currentSchema, stats = false){
    //Get query params:
    let { aggregate, proj, sort, pager } = req.query;

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
    aggregate.push({ $sort: { '_id': -1 } }); //Add default first sort (last records first).
    if(!isNaN(req.query.skip)){ aggregate.push({ $skip: req.query.skip }); }
    if(!isNaN(req.query.limit)){ aggregate.push({ $limit: req.query.limit }); }
    if(formatted_sort != ''){ aggregate.push({ $sort: formatted_sort }); }

    //Send DEBUG Message:
    mainServices.sendConsoleMessage('DEBUG', '\nfind aggregation [processed condition]: ' + JSON.stringify(aggregate));

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
                //Check if it is a stats query:
                if(stats === true){
                    //Send successfully stats response:
                    res.status(200).send({
                        success: true,
                        data: data[0]
                    });
                } else {
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
// SET ELEM MATCH:
//--------------------------------------------------------------------------------------------------------------------//
async function setElemMatch(filter){
    //Check filter:
    if(filter){
        //Check elemMatch with AND operator:
        if(filter.and){
            if(filter.and.elemMatch){
                //Set elemMatch into AND operator:
                await Promise.all(Object.keys(filter.and.elemMatch).map((current) => {
                    filter.and[current] = { '$elemMatch': filter.and.elemMatch[current] };
                }));

                //Delete original element match:
                delete filter.and.elemMatch;
            }
        }

        //Check elemMatch with OR operator:
        if(filter.or){
            if(filter.or.elemMatch){
                //Set elemMatch into OR operator:
                await Promise.all(Object.keys(filter.or.elemMatch).map((current) => {
                    filter.or[current] = { '$elemMatch': filter.or.elemMatch[current] };
                }));

                //Delete original element match:
                delete filter.or.elemMatch;
            }
        }

        //Check elemMatch without operator:
        if(filter.elemMatch){
            //Create AND operator if not exist (Prevent: Cannot set properties of undefined):
            if(!filter.and){ filter.and = {}; }

            //Set elemMatch into AND operator:
            await Promise.all(Object.keys(filter.elemMatch).map((current) => {
                filter.and[current] = { '$elemMatch': filter.elemMatch[current] };
            }));

            //Delete original element match:
            delete filter.elemMatch;
        }
    }

    //Return filter:
    return filter;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET AND OR:
//--------------------------------------------------------------------------------------------------------------------//
async function setAndOr(filter){
    //Initialize main condition:
    let condition = {};

    //Check filter:
    if(filter){

        //Capture previous filters without operator to preserve:
        let preservedFilters = {};
        if(Object.keys(filter).length > 0){
            //Copy filters without operators (Await foreach):
            await Promise.all(Object.keys(filter).map((key) => {
                if(key !== 'and' && key !== '$and' && key !== 'or' && key !== '$or' && key !== 'in' && key !== '$in' && key !== 'all' && key !== '$all'){
                    preservedFilters[key] = filter[key];

                    //Delete filter without operator from request:
                    delete filter[key];
                }
            }));
            
            //Create and operator if NOT exist (Prevent: Cannot set properties of undefined):
            if(!filter.and && Object.keys(preservedFilters).length > 0){ filter['and'] = {}; }

            //Check if there are filters without operator to preserve:
            if(Object.keys(preservedFilters).length > 0){
                //Add filters without operator to preserve into AND operator (Await foreach):                            
                await Promise.all(Object.keys(preservedFilters).map((key) => {
                    filter.and[key] = preservedFilters[key];
                }));
            }
        }

        //Initialize conditions:
        let and_condition = false;
        let or_condition = false;

        //Set AND Condition:
        if(filter.and || filter.$and){
            //Create condition filter or preserve the original in the filter:
            if(!filter.$and){
                and_condition = { $and: [] };
            } else {
                and_condition = { $and: filter.$and };
            }
            
            //Check AND condition without '$' char:
            if(filter.and){
                //Build filter with contition type (await foreach):
                await Promise.all(Object.keys(filter.and).map((key) => {
                    and_condition.$and.push({ [key]: filter.and[key] });
                }));
            }
        }

        //Set OR Condition:
        if(filter.or || filter.$or){
            //Create condition filter or preserve the original in the filter:
            if(!filter.$or){
                or_condition = { $or: [] };
            } else {
                or_condition = { $or: filter.$or };
            }

            //Check OR condition without '$' char:
            if(filter.or){
                //Build filter with contition type (await foreach):
                await Promise.all(Object.keys(filter.or).map((key) => {
                    or_condition.$or.push({ [key]: filter.or[key] });
                }));
            }
        }

        //Set final condition:
        if(and_condition && or_condition){
            condition = { $and: [and_condition, or_condition] };
        } else if(and_condition){
            condition = and_condition;
        } else if(or_condition){
            condition = or_condition;
        } else {
            //Set filter without condition (AND):
            condition = filter;
        }
    }

    //Return condition:
    return condition;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// CHECK EXCLUDE CONDITION:
// Exclude boolean, ObjectId and Date types [Date by KeyName] and explicit nested operators ($and, $or, $elemMatch).
//--------------------------------------------------------------------------------------------------------------------//
function checkExcludeCondition(keyName, currentValue){
    return currentValue !== 'true' && currentValue !== true && currentValue !== 'false' && currentValue !== false && checkObjectId(currentValue) === false && keyName !== 'event' && keyName !== 'date' && keyName !== 'datetime' && keyName !== 'start' && keyName !== 'end' && currentValue['$elemMatch'] == undefined && keyName !== '$and' && keyName !== '$or' && keyName.includes('.date') === false;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET CONDITION REGEX:
//--------------------------------------------------------------------------------------------------------------------//
async function setRegex(regex, condition){
    //Check condition regex:
    if(mainServices.stringToBoolean(regex)){
        let keyName = '';
        let currentValue = '';

        //Await foreach condition:
        await Promise.all(Object.keys(condition).map(async (current, index) => {
            //OR Only:
            if(current == '$or'){
                //Build condition with OR Only contition (await foreach):
                await Promise.all(condition.$or.map((or_current, or_index) => {
                    keyName = Object.keys(or_current)[0];
                    currentValue = condition.$or[or_index][keyName];

                    //Check Exclude Condition:
                    if(checkExcludeCondition(keyName, currentValue)){
                        condition.$or[or_index][keyName] = { $regex: `${currentValue}`, $options: 'i' };
                    }
                }));
            
            //AND:
            } else if(current == '$and') {
                //Build condition with AND contition (await foreach):
                await Promise.all(condition.$and.map(async (and_current, and_index) => {
                    //AND -> OR:
                    if(and_current.$or){
                        //Build condition with AND -> OR contition (await foreach):
                        await Promise.all(and_current.$or.map((or_current, or_index) => {
                            keyName = Object.keys(or_current)[0];
                            currentValue = and_current.$or[or_index][keyName];
                            
                            //Check Exclude Condition:
                            if(checkExcludeCondition(keyName, currentValue)){
                                condition.$and[and_index].$or[or_index][keyName] = { $regex: `${currentValue}`, $options: 'i' };
                            }
                        }));
                    }

                    //AND -> AND:
                    if (and_current.$and){
                        //Build condition with AND -> AND contition (await foreach):
                        await Promise.all(and_current.$and.map((second_and_current, second_and_index) => {
                            keyName = Object.keys(second_and_current)[0];
                            currentValue = and_current.$and[second_and_index][keyName];
                            
                            //Check Exclude Condition:
                            if(checkExcludeCondition(keyName, currentValue)){
                                condition.$and[and_index].$and[second_and_index][keyName] = { $regex: `${currentValue}`, $options: 'i' };
                            }
                        }));
                    }

                    //AND Only:
                    if(and_current.$and == undefined && and_current.$or == undefined){
                        keyName = Object.keys(and_current)[0];
                        currentValue = condition.$and[and_index][keyName];

                        //Check Exclude Condition:
                        if(checkExcludeCondition(keyName, currentValue)){
                            condition.$and[and_index][keyName] = { $regex: `${currentValue}`, $options: 'i' };
                        }
                    }
                }));

            //IN:
            } else if(current == 'in'){
                // Do nothing to exclude IN condition elements (No regex into IN operator).

            //ALL:
            } else if(current == 'all'){
                // Do nothing to exclude ALL condition elements (No regex into ALL operator).

            //Filter without condition (current = name_value):
            } else {
                keyName = Object.keys(condition)[index];
                currentValue = condition[current];
                
                //Exclude boolean, ObjectId and Date types [Date by KeyName] and explicit nested operators ($and, $or, $elemMatch):
                if(currentValue !== 'true' && currentValue !== true && currentValue !== 'false' && currentValue !== false && checkObjectId(currentValue) === false && keyName !== 'event' && keyName !== 'date' && keyName !== 'datetime'  && keyName !== 'start' && keyName !== 'end' && currentValue['$elemMatch'] == undefined && keyName !== '$and' && keyName !== '$or'){
                    condition[current] = { $regex: `${currentValue}`, $options: 'i' };
                }
            }
        }));
    }

    //Return condition:
    return condition;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET IN:
//--------------------------------------------------------------------------------------------------------------------//
async function setIn(filter, condition){
    //Check filter:
    if(filter){
        //Check if the IN operator exists:
        if(filter.in){
            //Create IN condition:
            let global_in_condition = {};

            //Create AND condition to concat multiple IN conditions:
            let and_in_condition = { $and: [] };

            //Check if there is more than one property with the in operator:
            if(Object.keys(filter.in).length == 1){
                //Get key name:
                const keyName = Object.keys(filter.in)[0];

                //Set global in condition:
                global_in_condition[keyName] = { $in: filter.in[keyName] };
            } else {
                //Build IN condition with multiple keys (await foreach):
                await Promise.all(Object.keys(filter.in).map(async (current, index) => {
                    //Create local in_condition (clean on each iteration):
                    let in_condition = {};
                    in_condition[current] = { $in: filter.in[current] };
                    
                    //Add current IN condition into AND array condition:
                    and_in_condition.$and[index] = in_condition;
                }));

                //Set global IN condition (scope):
                global_in_condition = and_in_condition;
            }

            //Remove original IN from condition object:
            delete condition.in;

            //Check if original condition have operators (AND | OR):
            if(Object.keys(condition).length != 0){
                //Set final IN condition to concatenate the original condition:
                condition = { $and: [ global_in_condition, condition ] };
            } else {
                condition = global_in_condition;
            }
        }
    }
    
    //Return condition:
    return condition;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET ALL:
//--------------------------------------------------------------------------------------------------------------------//
async function setAll(filter, condition){
    //Check filter:
    if(filter){
        //Check if the ALL operator exists:
        if(filter.all){
            //Create ALL condition:
            let global_all_condition = {};

            //Create AND condition to concat multiple IN conditions:
            let and_all_condition = { $and: [] };

            //Check if there is more than one property with the all operator:
            if(Object.keys(filter.all).length == 1){
                //Get key name:
                const keyName = Object.keys(filter.all)[0];

                //Set global all condition:
                global_all_condition[keyName] = { $all: filter.all[keyName] };
            } else {
                //Build ALL condition with multiple keys (await foreach):
                await Promise.all(Object.keys(filter.all).map(async (current, index) => {
                    //Create local all_condition (clean on each iteration):
                    let all_condition = {};
                    all_condition[current] = { $all: filter.all[current] };
                    
                    //Add current ALL condition into AND array condition:
                    and_all_condition.$and[index] = all_condition;
                }));

                //Set global IN condition (scope):
                global_all_condition = and_all_condition;
            }

            //Remove original ALL from condition object:
            delete condition.all;

            //Check if original condition have operators (AND | OR):
            if(Object.keys(condition).length != 0){
                //Set final ALL condition to concatenate the original condition:
                condition = { $and: [ global_all_condition, condition ] };
            } else {
                condition = global_all_condition;
            }
        }
    }
    
    //Return condition:
    return condition;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET CONDITION:
//--------------------------------------------------------------------------------------------------------------------//
async function setCondition(filter, regex){
    //Set elemMatch:
    filter = await setElemMatch(filter);

    //Set condition:
    let condition = await setAndOr(filter);

    //Set regex:
    condition = await setRegex(regex, condition);

    //Set in:
    condition = await setIn(filter, condition);

    //Set all:
    condition = await setAll(filter, condition);

    //Return condition:
    return condition;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET DATE CONDITION:
//--------------------------------------------------------------------------------------------------------------------//
async function setExplicitOperator(currentValue, callback){
    Object.keys(currentValue).map((current) => {
        switch(current){
            case '$gte':
                callback('$gte');
                break;
            case '$lte':
                callback('$lte');
                break;
            default:
                callback(false);
                break;
        }
    });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET GROUP:
//--------------------------------------------------------------------------------------------------------------------//
async function setGroup(req){
    //Check group id criteria:
    if(req.query.group !== null && req.query.group !== undefined && req.query.group !== ''){
        if(req.query.group.id !== null && req.query.group.id !== undefined && req.query.group.id !== ''){
            //Set default group order (last records first):
            let group_order = { "$last": "$$ROOT" };

            //Check group order in query:
            if(req.query.group.order !== null && req.query.group.order !== undefined && req.query.group.order === 'first'){
                group_order = { "$first": "$$ROOT" };
            }

            //Add group in the aggregate pipe:
            req.query.aggregate.push({ $group: {
                    _id : "$" + req.query.group.id,
                    doc : group_order,
                }},
                { $replaceRoot: { newRoot: { $mergeObjects: ["$doc"] }}
            });
        }
    }
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// CHECK ELEMENT:
//--------------------------------------------------------------------------------------------------------------------//
async function ckeckElement(_id, schemaName, res){
    //Import current Schema:
    const currentSchema = require('./' + schemaName + '/schemas');

    //Initialize result:
    let result = false;

    //Check _id is not empty:
    if(_id){
        //Check _id is valid ObjectId (Express validator Fix: Update case case that does not go through schema validator):
        if(regexObjectId.test(_id)){
            //Execute check query:
            await currentSchema.Model.findById(_id, { _id: 1 })
            .exec()
            .then((data) => {
                //Check if have results:
                if(data){
                    //Set result true:
                    result = true;
                } else {
                    //Send not valid referenced object mensaje:
                    res.status(405).send({ success: false, message: currentLang.db.not_valid_fk });
                }
            })
            .catch((err) => {
                //Send error:
                mainServices.sendError(res, currentLang.db.query_error, err);
            });
        } else {
            //Send not valid referenced object mensaje:
            res.status(405).send({ success: false, message: currentLang.db.not_valid_objectid });
        }
    } else {
        //Send error:
        mainServices.sendError(res, currentLang.db.id_referenced_empty, 'Ref. schemaName _id ' + _id);
    }

    //Return result:
    return result;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// CHECK REFERENCES:
//--------------------------------------------------------------------------------------------------------------------//
async function checkReferences(_id, schemaName, ForeignKeys, res){
    //Initialize affected collections array:
    let affectedCollections = [];

    //Initialize result:
    let result = false;

    //Initialize dependencies array:
    let dependencies = [];

    //Set affected colletions:
    switch(schemaName){
        case 'users':
            affectedCollections.push('logs');
            affectedCollections.push('sessions');
            affectedCollections.push('appointments');
            affectedCollections.push('appointments_drafts');
            affectedCollections.push('performing');
            affectedCollections.push('signatures');

        case 'people':
            affectedCollections.push('users');
            break;

        case 'organizations':
            affectedCollections.push('branches');
            affectedCollections.push('slots');
            affectedCollections.push('procedures');
            affectedCollections.push('procedure_categories');
            affectedCollections.push('appointments');
            affectedCollections.push('appointments_drafts');
            affectedCollections.push('files');
            affectedCollections.push('pathologies');
            affectedCollections.push('signatures');
            break;

        case 'branches':
            affectedCollections.push('services');
            affectedCollections.push('equipments');
            affectedCollections.push('slots');
            affectedCollections.push('procedures');
            affectedCollections.push('procedure_categories');
            affectedCollections.push('appointments');
            affectedCollections.push('appointments_drafts');
            affectedCollections.push('files');
            break;

        case 'services':
            affectedCollections.push('slots');
            affectedCollections.push('appointments');
            affectedCollections.push('appointments_drafts');
            break;

        case 'modalities':
            affectedCollections.push('services');
            affectedCollections.push('equipments');
            affectedCollections.push('procedures');
            break;

        case 'equipments':
            affectedCollections.push('services');
            affectedCollections.push('procedures');
            affectedCollections.push('slots');
            affectedCollections.push('performing');
            break;

        case 'slots':
            affectedCollections.push('appointments');
            affectedCollections.push('appointments_drafts');
            break;

        case 'procedures':
            affectedCollections.push('slots');
            affectedCollections.push('procedure_categories');
            affectedCollections.push('appointments');
            affectedCollections.push('appointments_drafts');
            affectedCollections.push('performing');
            affectedCollections.push('reports');
            break;

        case 'appointments':
            affectedCollections.push('performing');
            break;

        case 'appointment_requests':
            affectedCollections.push('appointments');
            affectedCollections.push('appointments_drafts');
            break;

        case 'files':
            affectedCollections.push('appointments');
            break;

        case 'pathologies':
            affectedCollections.push('reports');
            break;

        case 'performing':
            affectedCollections.push('reports');
            break;

        case 'reports':
            //Nothing at the moment.
            break;

        case 'signatures':
            affectedCollections.push('reports');
            break;
    }

    //Import affected schemas:
    let schemasAffected = [];
    for (let current in affectedCollections){
        schemasAffected[affectedCollections[current]] = require('./' + affectedCollections[current] + '/schemas');
    }

    //Initialize filters objects:
    let filter = {};
    let fk_singular = {};
    let fk_plural = {};
    let domain_condition = {};
    let imaging_condition = {};
    let referring_condition = {};
    let reporting_condition = {};
    let patient_condition = {};
    let informed_consent_condition = {};
    let clinical_trial_condition = {};
    let attached_condition = {};
    let injection_condition = {};
    let console_condition = {};
    let extra_condition = {};
    let medical_signatures_condition = {};

    //Execute queries into affected schemas (await foreach):
    await Promise.all(affectedCollections.map(async (value, key) => {
        //Set FK Keys:
        fk_singular[ForeignKeys.Singular] = _id;
        fk_plural[ForeignKeys.Plural] = mongoose.Types.ObjectId(_id);
        
        //Create OR condition:
        filter = { $or: [
            fk_singular,
            fk_plural
        ]};

        //Check if contain domain property:
        if(ForeignKeys.Domain){
            //Set domain condition:
            domain_condition[ForeignKeys.Domain] = _id;

            //Add domain contition in OR condition:
            filter.$or.push(domain_condition);
        }

        //Check if contain imaging property:
        if(ForeignKeys.Imaging){
            //Set imaging condition:
            imaging_condition[ForeignKeys.Imaging] = _id;

            //Add imaging contition in OR condition:
            filter.$or.push(imaging_condition);
        }

        //Check if contain referring property:
        if(ForeignKeys.Referring){
            //Set referring condition:
            referring_condition[ForeignKeys.Referring] = _id;

            //Add referring contition in OR condition:
            filter.$or.push(referring_condition);
        }

        //Check if contain reporting property:
        if(ForeignKeys.Reporting){
            //Set reporting condition:
            reporting_condition[ForeignKeys.Reporting] = _id;

            //Add reporting contition in OR condition:
            filter.$or.push(reporting_condition);
        }

        //Check if contain patient property:
        if(ForeignKeys.Patient){
            //Set patient condition:
            patient_condition[ForeignKeys.Patient] = _id;

            //Add patient contition in OR condition:
            filter.$or.push(patient_condition);
        }

        //Check if contain informed consent property:
        if(ForeignKeys.Informed_Consent){
            //Set informed consent condition:
            informed_consent_condition[ForeignKeys.Informed_Consent] = _id;

            //Add informed consent contition in OR condition:
            filter.$or.push(informed_consent_condition);
        }

        //Check if contain clinical trial property:
        if(ForeignKeys.Clinical_Trial){
            //Set clinical trial condition:
            clinical_trial_condition[ForeignKeys.Clinical_Trial] = _id;

            //Add clinical trial contition in OR condition:
            filter.$or.push(clinical_trial_condition);
        }

        //Check if contain attached property:
        if(ForeignKeys.Attached){
            //Set attached condition:
            attached_condition[ForeignKeys.Attached] = _id;

            //Add attached contition in OR condition:
            filter.$or.push(attached_condition);
        }

        //Check if contain injection technician property:
        if(ForeignKeys.Injection){
            //Set injection condition:
            injection_condition[ForeignKeys.Injection] = mongoose.Types.ObjectId(_id);

            //Add injection contition in OR condition:
            filter.$or.push(injection_condition);
        }

        //Check if contain console technician property:
        if(ForeignKeys.Console){
            //Set console condition:
            console_condition[ForeignKeys.Console] = mongoose.Types.ObjectId(_id);

            //Add console contition in OR condition:
            filter.$or.push(console_condition);
        }

        //Check if contain extra property:
        if(ForeignKeys.Extra){
            //Set extra condition:
            extra_condition[ForeignKeys.Extra] = mongoose.Types.ObjectId(_id);

            //Add extra contition in OR condition:
            filter.$or.push(extra_condition);
        }

        //Check if contain medical signatures property:
        if(ForeignKeys.MSignatures){
            //Set medical signatures condition:
            medical_signatures_condition[ForeignKeys.MSignatures] = _id;

            //Add medical signatures contition in OR condition:
            filter.$or.push(medical_signatures_condition);
        }

        //Execute current query:
        await schemasAffected[value].Model.findOne(filter, { _id: 1 } )
        .exec()
        .then((data) => {
            //Check if have results:
            if(data){
                //Add dependencies:
                dependencies.push({
                    collection_ref: value,
                    _id: data._id
                });

                //Set result true:
                result = true;
            }
        })
        .catch((err) => {
            //Send error:
            mainServices.sendError(res, currentLang.db.query_error, err);
        });
    }));

    //Search in users permissions:
    if(schemaName == 'organizations' || schemaName == 'branches' || schemaName == 'services' || schemaName == 'people'){
        //Import users Schema:
        const users = require('../modules/users/schemas');

        //Set users_filter:
        const users_filter = { $or: [
            { 'permissions.organization': _id },
            { 'permissions.branch': _id },
            { 'permissions.services': _id },
            { 'permissions.patient.people_in_charge': _id },
        ]};

        //Execute users (permissions) query:
        await users.Model.findOne(users_filter, { _id: 1 })
        .exec()
        .then((data) => {
            //Check if have results:
            if(data){
                //Add dependencies:
                dependencies.push({
                    collection_ref: 'users',
                    _id: data._id
                });

                //Set result true:
                result = true;
            }
        })
        .catch((err) => {
            //Send error:
            mainServices.sendError(res, currentLang.db.query_error, err);
        });
    }

    //Check result and return:
    if(result){
        //Return dependencies array:
        return dependencies;
    } else {
        //Return boolean result (false):
        return result;
    }
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// IS DUPLICATED:
//--------------------------------------------------------------------------------------------------------------------//
async function isDuplicated(req, res, currentSchema, params, message = ''){
    //Initialize result:
    result = false;

    await currentSchema.Model.findOne(params, { _id: 1 })
    .exec()
    .then((data) => {
        //Check data:
        if(data){
            //Check operation:
            //INSERT:
            if(req.body._id == undefined){
                //Set result (duplicated):
                result = true;

                //Set message:
                if(message === '' || message === undefined || message === null){
                    message = currentLang.db.insert_duplicate;
                }

                //Send duplicate message:
                res.status(422).send({ success: false, message: message + data._id });

            //UPDATE
            } else {
                if(data._id != req.body._id){
                    //Set result (duplicated):
                    result = true;

                    //Set message:
                    if(message === '' || message === undefined || message === null){
                        message = currentLang.db.update_duplicate;
                    }

                    //Send duplicate message:
                    res.status(422).send({ success: false, message: message + data._id });
                }
            }
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });

    //Return result:
    return result;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// CHECK SLOT:
//--------------------------------------------------------------------------------------------------------------------//
async function checkSlot(req, res){
    //Get authenticated user information (Decoded JWT):
    const userAuth = {
        _id: req.decoded.sub,
        domain: req.decoded.session.domain,
        role: req.decoded.session.role,
        concession: req.decoded.session.concession
    };

    //Check overbooking in request and if the user has a overbooking concession:
    if(mainServices.stringToBoolean(req.body.overbooking) === true && ( userAuth.role == 1 || userAuth.role == 2 || userAuth.concession.includes(parseInt(currentConcession, 23)) ) ){
        //Dont check slot (Force insert, overbooking):
        result = true;
    } else {
        //Import schema:
        const appointments = require('./appointments/schemas');

        //Initialize result (available):
        result = true;

        //Set datetime backend format regex:
        const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/i;

        //Check start and end datetimes format:
        if(datetimeRegex.test(req.body.start) && datetimeRegex.test(req.body.end)){
            //Get current dates from the request:
            const currentStart = req.body.start;
            const currentEnd = req.body.end;

            //Set in date format:
            let dateStart = new Date(currentStart);
            let dateEnd = new Date(currentEnd);

            //Format dates:
            const formattedDates = mainServices.datetimeFulCalendarFormater(dateStart, dateEnd);

            // Set params:
            const params = {
                "$and": [
                    { "fk_slot": req.body.fk_slot },
                    {
                        "$or": [
                            // Case 1: The new appointment starts before the existing appointment ends, but after it starts.
                            { "start": { "$gte": formattedDates.start + '.000Z', "$lt": formattedDates.end + '.000Z' } },
                            // Case 2: The new appointment ends after the existing appointment starts, but before it ends.
                            { "end": { "$gt": formattedDates.start + '.000Z', "$lte": formattedDates.end + '.000Z' } },
                            // Case 3: The new appointment starts before the existing one and ends after it.
                            {
                                "$and": [
                                    { "start": { "$lt": formattedDates.start + '.000Z' } },
                                    { "end": { "$gt": formattedDates.end + '.000Z' } }
                                ]
                            }
                        ]
                    }
                ]
            };
            
            //Find:
            await appointments.Model.findOne(params, { _id: 1 })
            .exec()
            .then((data) => {
                //Check data:
                if(data){
                    //Check operation:
                    //INSERT:
                    if(req.body._id == undefined){
                        //Check if have results:
                        if(data){
                            //Set result (unavailable):
                            result = false;

                            //Send unavailable slot message:
                            res.status(422).send({ success: false, message: currentLang.ris.unavailable_slot + data._id });
                        }

                    //UPDATE
                    } else {
                        if(data._id != req.body._id){
                            //Set result (unavailable):
                            result = false;

                            //Send unavailable slot message:
                            res.status(422).send({ success: false, message: currentLang.ris.unavailable_slot + data._id });
                        }
                    }
                }
            })
            .catch((err) => {
                //Send error:
                mainServices.sendError(res, currentLang.db.query_error, err);
            });
        } else {
            //Set result (wrong datetime format):
            result = false;

            //Send wrong datetime format message:
            res.status(422).send({ success: false, message: currentLang.ris.wrong_date_format_slot });
        }
    }

    //Return result:
    return result;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// CHECK URGENCY:
//--------------------------------------------------------------------------------------------------------------------//
async function checkUrgency(req, res, operation){
    //Import schema:
    const slots = require('./slots/schemas');

    //Initialize result:
    result = false;
    
    //Initialize params:
    let params = {};
    
    //Switch by operation:
    switch(operation){
        case 'insert':
            //Urgency appointments can be coordinated in any slot:
            if(req.body.urgency === true){
                result = true;
            //NOT urgent appointments cannot be coordinated in an urgency slot:
            } else {
                //Set params:
                params = {
                    _id: req.body.fk_slot,
                    urgency: true
                };
            }
            break;
        case 'update':
            //Check if the necessary parameters exist in the body for the check:
            let search_urgency_value = false;
            let search_fk_slot_value = false;
            if(req.body.urgency == undefined){ search_urgency_value = true; }
            if(req.body.fk_slot == undefined){ search_fk_slot_value = true; }

            if(search_urgency_value === false && search_fk_slot_value === false){
                //Urgency appointments can be coordinated in any slot:
                if(req.body.urgency === true){
                    result = true;
                //NOT urgent appointments cannot be coordinated in an urgency slot:
                } else {
                    //Set params:
                    params = {
                        _id: req.body.fk_slot,
                        urgency: true
                    };
                }

            //Find necessary parameters to check the slot:
            } else {
                //Urgency appointments can be coordinated in any slot:
                if(req.body.urgency === true){
                    result = true;
                //NOT urgent appointments cannot be coordinated in an urgency slot:
                } else {
                    //Check _id:
                    if(req.body._id){
                        //Import schema:
                        const appointments = require('./appointments/schemas');

                        //Find appointment that is trying to update:
                        await appointments.Model.findOne(req.body._id, { fk_slot: 1 })
                        .exec()
                        .then((data) => {
                            //Set params:
                            params = {
                                _id: data.fk_slot,
                                urgency: true
                            };
                        })
                        .catch((err) => {
                            //Send error:
                            mainServices.sendError(res, currentLang.db.query_error, err);
                        });
                    } else {
                        //Send error:
                        res.status(422).send({ success: false, message: currentLang.db.invalid_id });
                    }
                }
            }

            break;
    }    

    //Find if result == false:
    if(result === false){
        await slots.Model.findOne(params, { _id: 1 })
        .exec()
        .then((data) => {
            //Check data:
            if(data){
                //Check operation:
                //INSERT:
                if(req.body._id == undefined){
                    //Check if have results:
                    if(data){
                        //Set result (urgency slot):
                        result = false;

                        //Send only urgency slot slot message:
                        res.status(422).send({ success: false, message: currentLang.ris.only_urgency_slot });
                    }

                //UPDATE
                } else {
                    if(data._id != req.body._id){
                        //Set result (urgency slot):
                        result = false;

                        //Send only urgency slot message:
                        res.status(422).send({ success: false, message: currentLang.ris.only_urgency_slot });
                    }
                }
            } else {
                //Allowed slot (Not urgency appointment and not urgency slot):
                result = true;
            }
        })
        .catch((err) => {
            //Send error:
            mainServices.sendError(res, currentLang.db.query_error, err);
        });
    }

    //Return result:
    return result;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// CHECK PERSON:
//--------------------------------------------------------------------------------------------------------------------//
async function checkPerson(req, res){
    //Import schemas:
    const people = require('./people/schemas');

    //Initialize result:
    result = false;

    //Set filter:
    let filter = {}

    //Check if document exist (insert and update document case):
    if(req.body.documents){
        //Check how many documents entered:
        if(req.body.documents.length == 1){
            filter['documents'] = req.body.documents[0];
        } else {
            //Create OR condition:
            filter = { $or: [] };

            //Set documents OR condition (await foreach):
            await Promise.all(Object.keys(req.body.documents).map((current) => {
                filter.$or.push({
                    'documents.doc_country_code': req.body.documents[current].doc_country_code,
                    'documents.doc_type': req.body.documents[current].doc_type,
                    'documents.document': req.body.documents[current].document
                });
            }));
        }
    //Update without document case:
    } else {
        filter['_id'] = req.body._id;
    }

    await people.Model.findOne(filter, {})
    .exec()
    .then((data) => {
        //Check data:
        if(data){
            //Check operation:
            //INSERT:
            if(req.body._id == undefined){
                //Check if have results:
                if(data){
                    //Set result (duplicated):
                    result = true;

                    //Send duplicate message:
                    res.status(422).send({ success: false, message: currentLang.ris.duplicated_person, data: data });
                }

            //UPDATE
            } else {
                if(data._id != req.body._id){
                    //Set result (duplicated):
                    result = true;

                    //Send duplicate message:
                    res.status(422).send({ success: false, message: currentLang.ris.same_document, data: data });
                }
            }
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });

    //Return result:
    return result;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// CHECK SIGNATURE:
//--------------------------------------------------------------------------------------------------------------------//
async function checkSignature(res, fk_report, fk_user){
    //Import schemas:
    const reports       = require('./reports/schemas');
    const signatures    = require('./signatures/schemas');

    //Initialize result:
    result = false;

    //Find report by _id:
    await reports.Model.findById(fk_report, { medical_signatures: 1 })
    .exec()
    .then(async (reportData) => {
        //Check data:
        if(reportData){
            if(reportData.medical_signatures.length > 0){

                //Find signatures:
                await signatures.Model.find({ _id: { '$in': reportData.medical_signatures } }, { fk_user: 1 })
                .exec()
                .then(async (signaturesData) => {

                    //Find fk_user on signatures result (await foreach):
                    await Promise.all(Object.keys(signaturesData).map((key) => {
                        if(signaturesData[key].fk_user == fk_user){
                            //Set result (duplicated):
                            result = true;

                            //Send duplicate message:
                            res.status(422).send({ success: false, message: currentLang.ris.report_signed });
                        }
                    }));
                })
                .catch((err) => {
                    //Send error:
                    mainServices.sendError(res, currentLang.db.query_error, err);
                });
            }
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });

    //Return result:
    return result;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// CHECK PATHOLOGY:
//--------------------------------------------------------------------------------------------------------------------//
async function checkPathology(req, res, operation){
    //Import schemas:
    const organizations = require('./organizations/schemas');
    const pathologies   = require('./pathologies/schemas');

    //Initialize result:
    result = false;

    //Switch by operation:
    switch(operation){
        case 'insert':
            //fk_organization is required to insert:
            if(req.body.fk_organization){
                //Find organization by _id:
                await organizations.Model.findById(req.body.fk_organization, { _id: 1 })
                .exec()
                .then(async (organizationData) => {
                    //Check organizationData data:
                    if(organizationData){
                        //Set duplicated check params:
                        const duplicatedCheckParams = {
                            fk_organization: req.body.fk_organization,
                            name: req.body.name.toUpperCase()
                        };

                        //Search for duplicates:
                        result = await isDuplicated(req, res, pathologies, duplicatedCheckParams);
                    }
                })
                .catch((organizationError) => {
                    //Send error:
                    mainServices.sendError(res, currentLang.db.query_error, organizationError);
                });
            } //Without else, it passes but will be stopped by validator.
            
            break;
        case 'update':
            //The parameters that are verified to set duplicate are the combination of name and fk_organization:
            if(req.body.name && req.body.fk_organization){
                //Find organization by _id:
                await organizations.Model.findById(req.body.fk_organization, { _id: 1 })
                .exec()
                .then(async (organizationData) => {
                    //Check organizationData data:
                    if(organizationData){
                        //Set duplicated check params:
                        const duplicatedCheckParams = {
                            fk_organization: req.body.fk_organization,
                            name: req.body.name.toUpperCase()
                        };

                        //Search for duplicates:
                        result = await isDuplicated(req, res, pathologies, duplicatedCheckParams);
                    }
                })
                .catch((organizationError) => {
                    //Send error:
                    mainServices.sendError(res, currentLang.db.query_error, organizationError);
                });
            
            //Find pathology by _id and obtain fk_organization to check duplicates:
            } else if(req.body.name && req.body._id){
                //Find pathology fk_organization by _id:
                await pathologies.Model.findById(req.body._id, { fk_organization: 1 })
                .exec()
                .then(async (pathologyData) => {
                    //Check pathologyData data:
                    if(pathologyData){
                        //Find organization by fk_organization:
                        await organizations.Model.findById(pathologyData.fk_organization, { _id: 1 })
                        .exec()
                        .then(async (organizationData) => {
                            //Check organizationData data:
                            if(organizationData){
                                //Set duplicated check params:
                                const duplicatedCheckParams = {
                                    fk_organization: pathologyData.fk_organization,
                                    name: req.body.name.toUpperCase()
                                };

                                //Search for duplicates:
                                result = await isDuplicated(req, res, pathologies, duplicatedCheckParams);
                            }
                        })
                        .catch((organizationError) => {
                            //Send error:
                            mainServices.sendError(res, currentLang.db.query_error, organizationError);
                        });
                    } //Without else, it passes but will be stopped by validator.
                })
                .catch((pathologyError) => {
                    //Send error:
                    mainServices.sendError(res, currentLang.db.query_error, pathologyError);
                });

            //Find pathology by _id and obtain pathology name to check duplicates:
            } else if(req.body.fk_organization && req.body._id){
                //Find pathology name by _id:
                await pathologies.Model.findById(req.body._id, { name: 1 })
                .exec()
                .then(async (pathologyData) => {
                    //Check pathologyData data:
                    if(pathologyData){
                        //Find organization by fk_organization:
                        await organizations.Model.findById(req.body.fk_organization, { _id: 1 })
                        .exec()
                        .then(async (organizationData) => {
                            //Check organizationData data:
                            if(organizationData){
                                //Set duplicated check params:
                                const duplicatedCheckParams = {
                                    fk_organization: req.body.fk_organization,
                                    name: pathologyData.name.toUpperCase()
                                };

                                //Search for duplicates:
                                result = await isDuplicated(req, res, pathologies, duplicatedCheckParams);
                            }
                        })
                        .catch((organizationError) => {
                            //Send error:
                            mainServices.sendError(res, currentLang.db.query_error, organizationError);
                        });
                    } //Without else, it passes but will be stopped by validator.
                })
                .catch((pathologyError) => {
                    //Send error:
                    mainServices.sendError(res, currentLang.db.query_error, pathologyError);
                });
            }

            break;
    }

    //Return result:
    return result;
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
        case 'logs':            
            filter = adjustCondition(filter, (filter) => {
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'fk_organization'] != undefined){ filter[asPrefix + 'fk_organization'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_organization']); };
                if(filter[asPrefix + 'event'] != undefined){ filter[asPrefix + 'event'] = parseInt(filter['event'], 10); }
                //Set allowed explicit operators:
                if(filter[asPrefix + 'datetime'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'datetime'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'datetime'][explicitOperator] = new Date(filter[asPrefix + 'datetime'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'datetime'] = new Date(filter[asPrefix + 'datetime']);
                        }
                    });
                }
                if(filter[asPrefix + 'fk_user'] != undefined){ filter[asPrefix + 'fk_user'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_user']); };
                if(filter[asPrefix + 'element._id'] != undefined){ filter[asPrefix + 'element._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'element._id']); };
                return filter;
            });
            break;

        case 'users':
            filter = adjustCondition(filter, (filter) => {
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'fk_person'] != undefined){ filter[asPrefix + 'fk_person'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_person']); };
                if(filter[asPrefix + 'permissions.organization'] != undefined){ filter[asPrefix + 'permissions.organization'] = mongoose.Types.ObjectId(filter[asPrefix + 'permissions.organization']); }
                if(filter[asPrefix + 'permissions.branch'] != undefined){ filter[asPrefix + 'permissions.branch'] = mongoose.Types.ObjectId(filter[asPrefix + 'permissions.branch']); }
                if(filter[asPrefix + 'permissions.service'] != undefined){ filter[asPrefix + 'permissions.service'] = mongoose.Types.ObjectId(filter[asPrefix + 'permissions.service']); }
                if(filter[asPrefix + 'permissions.role'] != undefined){ filter[asPrefix + 'permissions.role'] = parseInt(filter['permissions.role'], 10); }
                if(filter[asPrefix + 'permissions.concession'] != undefined){ filter[asPrefix + 'permissions.concession'] = filter[asPrefix + 'permissions.concession'][0] = parseInt(filter[asPrefix + 'permissions.concession'], 10); }
                if(filter[asPrefix + 'professional.workload'] != undefined){ filter[asPrefix + 'professional.workload'] = parseInt(filter[asPrefix + 'professional.workload'], 10); }
                if(filter[asPrefix + 'professional.vacation'] != undefined){ filter[asPrefix + 'professional.vacation'] = mainServices.stringToBoolean(filter[asPrefix + 'professional.vacation']); };
                if(filter[asPrefix + 'settings.viewer'] != undefined){ filter[asPrefix + 'settings.viewer'] = parseInt(filter[asPrefix + 'settings.viewer'], 10); }
                if(filter[asPrefix + 'settings.theme'] != undefined){ filter[asPrefix + 'settings.theme'] = parseInt(filter[asPrefix + 'settings.theme'], 10); }
                if(filter[asPrefix + 'status'] != undefined){ filter[asPrefix + 'status'] = mainServices.stringToBoolean(filter[asPrefix + 'status']); };
                return filter;
            });
            break;

        case 'people':
            filter = adjustCondition(filter, (filter) => {
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'documents.doc_type'] != undefined){ filter[asPrefix + 'documents.doc_type'] = parseInt(filter[asPrefix + 'documents.doc_type'], 10); }
                if(filter[asPrefix + 'gender'] != undefined){ filter[asPrefix + 'gender'] = parseInt(filter[asPrefix + 'gender'], 10); }
                if(filter[asPrefix + 'phone_numbers'] != undefined){ filter[asPrefix + 'phone_numbers'] = filter[asPrefix + 'phone_numbers'][0] = parseInt(filter[asPrefix + 'phone_numbers'], 10); }

                //Set allowed explicit operators:
                if(filter[asPrefix + 'birth_date'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'birth_date'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'birth_date'][explicitOperator] = new Date(filter[asPrefix + 'birth_date'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'birth_date'] = new Date(filter[asPrefix + 'birth_date']);
                        }
                    });
                }

                return filter;
            });
            break;

        case 'organizations':
            filter = adjustCondition(filter, (filter) => {
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'status'] != undefined){ filter[asPrefix + 'status'] = mainServices.stringToBoolean(filter[asPrefix + 'status']); };
                return filter;
            });
            break;

        case 'branches':            
            filter = adjustCondition(filter, (filter) => {
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'fk_organization'] != undefined){ filter[asPrefix + 'fk_organization'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_organization']); };
                if(filter[asPrefix + 'status'] != undefined){ filter[asPrefix + 'status'] = mainServices.stringToBoolean(filter[asPrefix + 'status']); };
                return filter;
            });
            break;

        case 'services':
            filter = adjustCondition(filter, (filter) => {
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'fk_branch'] != undefined){ filter[asPrefix + 'fk_branch'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_branch']); };
                if(filter[asPrefix + 'fk_modality'] != undefined){ filter[asPrefix + 'fk_modality'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_modality']); };
                if(filter[asPrefix + 'fk_equipments'] != undefined){ filter[asPrefix + 'fk_equipments'] = filter[asPrefix + 'fk_equipments'][0] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_equipments']); }
                if(filter[asPrefix + 'status'] != undefined){ filter[asPrefix + 'status'] = mainServices.stringToBoolean(filter[asPrefix + 'status']); };
                return filter;
            });
            break;

        case 'modalities':
            filter = adjustCondition(filter, (filter) => {
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'status'] != undefined){ filter[asPrefix + 'status'] = mainServices.stringToBoolean(filter[asPrefix + 'status']); };
                return filter;
            });
            break;

        case 'equipments':
            filter = adjustCondition(filter, (filter) => {
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'fk_modalities'] != undefined){ filter[asPrefix + 'fk_modalities'] = filter[asPrefix + 'fk_modalities'][0] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_modalities']); }
                if(filter[asPrefix + 'fk_branch'] != undefined){ filter[asPrefix + 'fk_branch'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_branch']); };
                if(filter[asPrefix + 'status'] != undefined){ filter[asPrefix + 'status'] = mainServices.stringToBoolean(filter[asPrefix + 'status']); };
                return filter;
            });
            break;

        case 'slots':
            filter = adjustCondition(filter, (filter) => {
                //Domain:
                if(filter[asPrefix + 'domain.organization'] != undefined){ filter[asPrefix + 'domain.organization'] = mongoose.Types.ObjectId(filter[asPrefix + 'domain.organization']); };
                if(filter[asPrefix + 'domain.branch'] != undefined){ filter[asPrefix + 'domain.branch'] = mongoose.Types.ObjectId(filter[asPrefix + 'domain.branch']); };
                if(filter[asPrefix + 'domain.service'] != undefined){ filter[asPrefix + 'domain.service'] = mongoose.Types.ObjectId(filter[asPrefix + 'domain.service']); };

                //Schema:
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'fk_equipment'] != undefined){ filter[asPrefix + 'fk_equipment'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_equipment']); };
                if(filter[asPrefix + 'fk_procedure'] != undefined){ filter[asPrefix + 'fk_procedure'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_procedure']); };
                if(filter[asPrefix + 'urgency'] != undefined){ filter[asPrefix + 'urgency'] = mainServices.stringToBoolean(filter[asPrefix + 'urgency']); };
                
                //Set allowed explicit operators:
                if(filter[asPrefix + 'start'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'start'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'start'][explicitOperator] = new Date(filter[asPrefix + 'start'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'start'] = new Date(filter[asPrefix + 'start']);
                        }
                    });
                }

                if(filter[asPrefix + 'end'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'end'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'end'][explicitOperator] = new Date(filter[asPrefix + 'end'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'end'] = new Date(filter[asPrefix + 'end']);
                        }
                    });
                }
                
                return filter;
            });
            break;
        
        case 'procedures':
            filter = adjustCondition(filter, (filter) => {
                //Domain:
                if(filter[asPrefix + 'domain.organization'] != undefined){ filter[asPrefix + 'domain.organization'] = mongoose.Types.ObjectId(filter[asPrefix + 'domain.organization']); };
                if(filter[asPrefix + 'domain.branch'] != undefined){ filter[asPrefix + 'domain.branch'] = mongoose.Types.ObjectId(filter[asPrefix + 'domain.branch']); };

                //Schema:
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'fk_modality'] != undefined){ filter[asPrefix + 'fk_modality'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_modality']); };
                if(filter[asPrefix + 'equipments.fk_equipment'] != undefined){ filter[asPrefix + 'equipments.fk_equipment'] = mongoose.Types.ObjectId(filter[asPrefix + 'equipments.fk_equipment']); };
                if(filter[asPrefix + 'equipments.duration'] != undefined){ filter[asPrefix + 'equipments.duration'] = parseInt(filter[asPrefix + 'equipments.duration'], 10); }
                if(filter[asPrefix + 'has_interview'] != undefined){ filter[asPrefix + 'has_interview'] = mainServices.stringToBoolean(filter[asPrefix + 'has_interview']); };
                if(filter[asPrefix + 'informed_consent'] != undefined){ filter[asPrefix + 'informed_consent'] = mainServices.stringToBoolean(filter[asPrefix + 'informed_consent']); };
                if(filter[asPrefix + 'coefficient'] != undefined){ filter[asPrefix + 'coefficient'] = parseFloat(filter[asPrefix + 'coefficient']); }
                if(filter[asPrefix + 'reporting_delay'] != undefined){ filter[asPrefix + 'reporting_delay'] = parseInt(filter[asPrefix + 'reporting_delay'], 10); }
                if(filter[asPrefix + 'wait_time'] != undefined){ filter[asPrefix + 'wait_time'] = parseInt(filter[asPrefix + 'wait_time'], 10); }
                if(filter[asPrefix + 'status'] != undefined){ filter[asPrefix + 'status'] = mainServices.stringToBoolean(filter[asPrefix + 'status']); };

                return filter;
            });
            break;

        case 'procedure_categories':
            filter = adjustCondition(filter, (filter) => {
                //Domain:
                if(filter[asPrefix + 'domain.organization'] != undefined){ filter[asPrefix + 'domain.organization'] = mongoose.Types.ObjectId(filter[asPrefix + 'domain.organization']); };
                if(filter[asPrefix + 'domain.branch'] != undefined){ filter[asPrefix + 'domain.branch'] = mongoose.Types.ObjectId(filter[asPrefix + 'domain.branch']); };
    
                //Schema:
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'fk_procedures'] != undefined){ filter[asPrefix + 'fk_procedures'] = filter[asPrefix + 'fk_procedures'][0] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_procedures']); }
                return filter;
            });
            break;

        case 'files':
            filter = adjustCondition(filter, (filter) => {
                //Domain:
                if(filter[asPrefix + 'domain.organization'] != undefined){ filter[asPrefix + 'domain.organization'] = mongoose.Types.ObjectId(filter[asPrefix + 'domain.organization']); };
                if(filter[asPrefix + 'domain.branch'] != undefined){ filter[asPrefix + 'domain.branch'] = mongoose.Types.ObjectId(filter[asPrefix + 'domain.branch']); };
    
                //Schema:
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                return filter;
            });
            break;

        case 'appointments':
            filter = adjustCondition(filter, (filter) => {
                //Appointment request:
                if(filter[asPrefix + 'fk_appointment_request'] != undefined){ filter[asPrefix + 'fk_appointment_request'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_appointment_request']); };

                //Imaging - Post aggregate lookup:
                if(filter[asPrefix + 'imaging.organization._id'] != undefined){ filter[asPrefix + 'imaging.organization._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'imaging.organization._id']); };
                if(filter[asPrefix + 'imaging.branch._id'] != undefined){ filter[asPrefix + 'imaging.branch._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'imaging.branch._id']); };
                if(filter[asPrefix + 'imaging.service._id'] != undefined){ filter[asPrefix + 'imaging.service._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'imaging.service._id']); };

                //Referring - Post aggregate lookup:
                if(filter[asPrefix + 'referring.organization._id'] != undefined){ filter[asPrefix + 'referring.organization._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'referring.organization._id']); };
                if(filter[asPrefix + 'referring.branch._id'] != undefined){ filter[asPrefix + 'referring.branch._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'referring.branch._id']); };
                if(filter[asPrefix + 'referring.service._id'] != undefined){ filter[asPrefix + 'referring.service._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'referring.service._id']); };
                if(filter[asPrefix + 'referring.fk_referring._id'] != undefined){ filter[asPrefix + 'referring.fk_referring._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'referring.fk_referring._id']); };

                //Reporting - Post aggregate lookup:
                if(filter[asPrefix + 'reporting.organization._id'] != undefined){ filter[asPrefix + 'reporting.organization._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'reporting.organization._id']); };
                if(filter[asPrefix + 'reporting.branch._id'] != undefined){ filter[asPrefix + 'reporting.branch._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'reporting.branch._id']); };
                if(filter[asPrefix + 'reporting.service._id'] != undefined){ filter[asPrefix + 'reporting.service._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'reporting.service._id']); };
                if(filter[asPrefix + 'reporting.fk_reporting._id'] != undefined){ filter[asPrefix + 'reporting.fk_reporting._id'] = filter[asPrefix + 'reporting.fk_reporting._id'][0] = mongoose.Types.ObjectId(filter[asPrefix + 'reporting.fk_reporting._id']); }

                //Set allowed explicit operators:
                if(filter[asPrefix + 'start'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'start'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'start'][explicitOperator] = new Date(filter[asPrefix + 'start'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'start'] = new Date(filter[asPrefix + 'start']);
                        }
                    });
                }

                if(filter[asPrefix + 'end'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'end'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'end'][explicitOperator] = new Date(filter[asPrefix + 'end'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'end'] = new Date(filter[asPrefix + 'end']);
                        }
                    });
                }

                if(filter[asPrefix + 'report_before'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'report_before'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'report_before'][explicitOperator] = new Date(filter[asPrefix + 'report_before'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'report_before'] = new Date(filter[asPrefix + 'report_before']);
                        }
                    });
                }

                //Schema:
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'fk_patient'] != undefined){ filter[asPrefix + 'fk_patient'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_patient']); };
                if(filter[asPrefix + 'fk_slot'] != undefined){ filter[asPrefix + 'fk_slot'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_slot']); };
                if(filter[asPrefix + 'fk_procedure'] != undefined){ filter[asPrefix + 'fk_procedure'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_procedure']); };
                if(filter[asPrefix + 'extra_procedures'] != undefined){ filter[asPrefix + 'extra_procedures'] = filter[asPrefix + 'extra_procedures'][0] = mongoose.Types.ObjectId(filter[asPrefix + 'extra_procedures']); }
                if(filter[asPrefix + 'urgency'] != undefined){ filter[asPrefix + 'urgency'] = mainServices.stringToBoolean(filter[asPrefix + 'urgency']); };

                if(filter[asPrefix + 'media.CD'] != undefined){ filter[asPrefix + 'media.CD'] = mainServices.stringToBoolean(filter[asPrefix + 'media.CD']); };
                if(filter[asPrefix + 'media.DVD'] != undefined){ filter[asPrefix + 'media.DVD'] = mainServices.stringToBoolean(filter[asPrefix + 'media.DVD']); };
                if(filter[asPrefix + 'media.acetate_sheets'] != undefined){ filter[asPrefix + 'media.acetate_sheets'] = mainServices.stringToBoolean(filter[asPrefix + 'media.acetate_sheets']); };
                if(filter[asPrefix + 'contrast.use_contrast'] != undefined){ filter[asPrefix + 'contrast.use_contrast'] = mainServices.stringToBoolean(filter[asPrefix + 'contrast.use_contrast']); };
                if(filter[asPrefix + 'outpatient'] != undefined){ filter[asPrefix + 'outpatient'] = mainServices.stringToBoolean(filter[asPrefix + 'outpatient']); };
                if(filter[asPrefix + 'cancellation_reasons'] != undefined){ filter[asPrefix + 'cancellation_reasons'] = parseInt(filter[asPrefix + 'cancellation_reasons'], 10); }

                //Private health:
                if(filter[asPrefix + 'private_health.height'] != undefined){ filter[asPrefix + 'private_health.height'] = parseInt(filter[asPrefix + 'private_health.height'], 10); }
                if(filter[asPrefix + 'private_health.weight'] != undefined){ filter[asPrefix + 'private_health.weight'] = parseFloat(filter[asPrefix + 'private_health.weight']); }
                if(filter[asPrefix + 'private_health.diabetes'] != undefined){ filter[asPrefix + 'private_health.diabetes'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.diabetes']); };
                if(filter[asPrefix + 'private_health.hypertension'] != undefined){ filter[asPrefix + 'private_health.hypertension'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.hypertension']); };
                if(filter[asPrefix + 'private_health.epoc'] != undefined){ filter[asPrefix + 'private_health.epoc'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.epoc']); };
                if(filter[asPrefix + 'private_health.smoking'] != undefined){ filter[asPrefix + 'private_health.smoking'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.smoking']); };
                if(filter[asPrefix + 'private_health.malnutrition'] != undefined){ filter[asPrefix + 'private_health.malnutrition'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.malnutrition']); };
                if(filter[asPrefix + 'private_health.obesity'] != undefined){ filter[asPrefix + 'private_health.obesity'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.obesity']); };
                if(filter[asPrefix + 'private_health.hiv'] != undefined){ filter[asPrefix + 'private_health.hiv'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.hiv']); };
                if(filter[asPrefix + 'private_health.renal_insufficiency'] != undefined){ filter[asPrefix + 'private_health.renal_insufficiency'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.renal_insufficiency']); };
                if(filter[asPrefix + 'private_health.heart_failure'] != undefined){ filter[asPrefix + 'private_health.heart_failure'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.heart_failure']); };
                if(filter[asPrefix + 'private_health.ischemic_heart_disease'] != undefined){ filter[asPrefix + 'private_health.ischemic_heart_disease'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.ischemic_heart_disease']); };
                if(filter[asPrefix + 'private_health.valvulopathy'] != undefined){ filter[asPrefix + 'private_health.valvulopathy'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.valvulopathy']); };
                if(filter[asPrefix + 'private_health.arrhythmia'] != undefined){ filter[asPrefix + 'private_health.arrhythmia'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.arrhythmia']); };
                if(filter[asPrefix + 'private_health.cancer'] != undefined){ filter[asPrefix + 'private_health.cancer'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.cancer']); };
                if(filter[asPrefix + 'private_health.dementia'] != undefined){ filter[asPrefix + 'private_health.dementia'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.dementia']); };
                if(filter[asPrefix + 'private_health.claustrophobia'] != undefined){ filter[asPrefix + 'private_health.claustrophobia'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.claustrophobia']); };
                if(filter[asPrefix + 'private_health.asthma'] != undefined){ filter[asPrefix + 'private_health.asthma'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.asthma']); };
                if(filter[asPrefix + 'private_health.hyperthyroidism'] != undefined){ filter[asPrefix + 'private_health.hyperthyroidism'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.hyperthyroidism']); };
                if(filter[asPrefix + 'private_health.hypothyroidism'] != undefined){ filter[asPrefix + 'private_health.hypothyroidism'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.hypothyroidism']); };
                if(filter[asPrefix + 'private_health.pregnancy'] != undefined){ filter[asPrefix + 'private_health.pregnancy'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.pregnancy']); };

                if(filter[asPrefix + 'private_health.implants.cochlear_implant'] != undefined){ filter[asPrefix + 'private_health.implants.cochlear_implant'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.implants.cochlear_implant']); };
                if(filter[asPrefix + 'private_health.implants.cardiac_stent'] != undefined){ filter[asPrefix + 'private_health.implants.cardiac_stent'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.implants.cardiac_stent']); };
                if(filter[asPrefix + 'private_health.implants.metal_prostheses'] != undefined){ filter[asPrefix + 'private_health.implants.metal_prostheses'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.implants.metal_prostheses']); };
                if(filter[asPrefix + 'private_health.implants.metal_shards'] != undefined){ filter[asPrefix + 'private_health.implants.metal_shards'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.implants.metal_shards']); };
                if(filter[asPrefix + 'private_health.implants.pacemaker'] != undefined){ filter[asPrefix + 'private_health.implants.pacemaker'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.implants.pacemaker']); };

                if(filter[asPrefix + 'private_health.covid19.had_covid'] != undefined){ filter[asPrefix + 'private_health.covid19.had_covid'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.covid19.had_covid']); };
                if(filter[asPrefix + 'private_health.covid19.vaccinated'] != undefined){ filter[asPrefix + 'private_health.covid19.vaccinated'] = mainServices.stringToBoolean(filter[asPrefix + 'private_health.covid19.vaccinated']); };

                //Consents:
                if(filter[asPrefix + 'consents.informed_consent'] != undefined){ filter[asPrefix + 'consents.informed_consent'] = mongoose.Types.ObjectId(filter[asPrefix + 'consents.informed_consent']); };
                if(filter[asPrefix + 'consents.clinical_trial'] != undefined){ filter[asPrefix + 'consents.clinical_trial'] = mongoose.Types.ObjectId(filter[asPrefix + 'consents.clinical_trial']); };

                //Attached files:
                if(filter[asPrefix + 'attached_files'] != undefined){ filter[asPrefix + 'attached_files'] = filter[asPrefix + 'attached_files'][0] = mongoose.Types.ObjectId(filter[asPrefix + 'attached_files']); }

                if(filter[asPrefix + 'status'] != undefined){ filter[asPrefix + 'status'] = mainServices.stringToBoolean(filter[asPrefix + 'status']); };
                if(filter[asPrefix + 'overbooking'] != undefined){ filter[asPrefix + 'overbooking'] = mainServices.stringToBoolean(filter[asPrefix + 'overbooking']); };

                return filter;
            });
            break;

        case 'appointments_drafts':
            filter = adjustCondition(filter, (filter) => {
                //Appointment request:
                if(filter[asPrefix + 'fk_appointment_request'] != undefined){ filter[asPrefix + 'fk_appointment_request'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_appointment_request']); };
                
                //Imaging - Post aggregate lookup:
                if(filter[asPrefix + 'imaging.organization._id'] != undefined){ filter[asPrefix + 'imaging.organization._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'imaging.organization._id']); };
                if(filter[asPrefix + 'imaging.branch._id'] != undefined){ filter[asPrefix + 'imaging.branch._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'imaging.branch._id']); };
                if(filter[asPrefix + 'imaging.service._id'] != undefined){ filter[asPrefix + 'imaging.service._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'imaging.service._id']); };
    
                //Set allowed explicit operators:
                if(filter[asPrefix + 'start'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'start'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'start'][explicitOperator] = new Date(filter[asPrefix + 'start'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'start'] = new Date(filter[asPrefix + 'start']);
                        }
                    });
                 }
    
                if(filter[asPrefix + 'end'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'end'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'end'][explicitOperator] = new Date(filter[asPrefix + 'end'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'end'] = new Date(filter[asPrefix + 'end']);
                        }
                    });
                }
    
                //Schema:
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'fk_patient'] != undefined){ filter[asPrefix + 'fk_patient'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_patient']); };
                if(filter[asPrefix + 'fk_coordinator'] != undefined){ filter[asPrefix + 'fk_coordinator'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_coordinator']); };
                if(filter[asPrefix + 'fk_slot'] != undefined){ filter[asPrefix + 'fk_slot'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_slot']); };
                if(filter[asPrefix + 'fk_procedure'] != undefined){ filter[asPrefix + 'fk_procedure'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_procedure']); };
                if(filter[asPrefix + 'extra_procedures'] != undefined){ filter[asPrefix + 'extra_procedures'] = filter[asPrefix + 'extra_procedures'][0] = mongoose.Types.ObjectId(filter[asPrefix + 'extra_procedures']); }
                if(filter[asPrefix + 'urgency'] != undefined){ filter[asPrefix + 'urgency'] = mainServices.stringToBoolean(filter[asPrefix + 'urgency']); };
                if(filter[asPrefix + 'overbooking'] != undefined){ filter[asPrefix + 'overbooking'] = mainServices.stringToBoolean(filter[asPrefix + 'overbooking']); };
                
                return filter;
            });
            break;

        case 'appointment_requests':
            filter = adjustCondition(filter, (filter) => {
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'urgency'] != undefined){ filter[asPrefix + 'urgency'] = mainServices.stringToBoolean(filter[asPrefix + 'urgency']); };

                //Imaging - Post aggregate lookup:
                if(filter[asPrefix + 'imaging.organization._id'] != undefined){ filter[asPrefix + 'imaging.organization._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'imaging.organization._id']); };
                if(filter[asPrefix + 'imaging.branch._id'] != undefined){ filter[asPrefix + 'imaging.branch._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'imaging.branch._id']); };
                
                //Referring - Post aggregate lookup:
                if(filter[asPrefix + 'referring.organization._id'] != undefined){ filter[asPrefix + 'referring.organization._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'referring.organization._id']); };
                if(filter[asPrefix + 'referring.branch._id'] != undefined){ filter[asPrefix + 'referring.branch._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'referring.branch._id']); };
        
                //Study:
                if(filter[asPrefix + 'study.fk_procedure'] != undefined){ filter[asPrefix + 'study.fk_procedure'] = mongoose.Types.ObjectId(filter[asPrefix + 'study.fk_procedure']); };
                if(filter[asPrefix + 'study.fk_modality'] != undefined){ filter[asPrefix + 'study.fk_modality'] = mongoose.Types.ObjectId(filter[asPrefix + 'study.fk_modality']); };

                //Patient:
                if(filter[asPrefix + 'patient.doc_type'] != undefined){ filter[asPrefix + 'patient.documents.doc_type'] = parseInt(filter[asPrefix + 'patient.documents.doc_type'], 10); }
                if(filter[asPrefix + 'patient.gender'] != undefined){ filter[asPrefix + 'patient.gender'] = parseInt(filter[asPrefix + 'patient.gender'], 10); }
                if(filter[asPrefix + 'patient.phone_numbers'] != undefined){ filter[asPrefix + 'patient.phone_numbers'] = filter[asPrefix + 'patient.phone_numbers'][0] = parseInt(filter[asPrefix + 'patient.phone_numbers'], 10); }

                //Patient - Set allowed explicit operators:
                if(filter[asPrefix + 'patient.birth_date'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'patient.birth_date'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'patient.birth_date'][explicitOperator] = new Date(filter[asPrefix + 'patient.birth_date'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'patient.birth_date'] = new Date(filter[asPrefix + 'patient.birth_date']);
                        }
                    });
                }

                return filter;
            });
            break;

        case 'pathologies':            
            filter = adjustCondition(filter, (filter) => {
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'fk_organization'] != undefined){ filter[asPrefix + 'fk_organization'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_organization']); };
                if(filter[asPrefix + 'status'] != undefined){ filter[asPrefix + 'status'] = mainServices.stringToBoolean(filter[asPrefix + 'status']); };
                return filter;
            });
            break;

        case 'performing':
            filter = adjustCondition(filter, (filter) => {
                //Schema:
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'fk_appointment'] != undefined){ filter[asPrefix + 'fk_appointment'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_appointment']); };
                if(filter[asPrefix + 'fk_equipment'] != undefined){ filter[asPrefix + 'fk_equipment'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_equipment']); };
                if(filter[asPrefix + 'fk_procedure'] != undefined){ filter[asPrefix + 'fk_procedure'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_procedure']); };
                if(filter[asPrefix + 'extra_procedures'] != undefined){ filter[asPrefix + 'extra_procedures'] = filter[asPrefix + 'extra_procedures'][0] = mongoose.Types.ObjectId(filter[asPrefix + 'extra_procedures']); }
                if(filter[asPrefix + 'urgency'] != undefined){ filter[asPrefix + 'urgency'] = mainServices.stringToBoolean(filter[asPrefix + 'urgency']); };
                
                //Set allowed explicit operators:
                if(filter[asPrefix + 'date'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'date'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'date'][explicitOperator] = new Date(filter[asPrefix + 'date'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'date'] = new Date(filter[asPrefix + 'date']);
                        }
                    });
                }

                if(filter[asPrefix + 'cancellation_reasons'] != undefined){ filter[asPrefix + 'cancellation_reasons'] = parseInt(filter[asPrefix + 'cancellation_reasons'], 10); }
                if(filter[asPrefix + 'status'] != undefined){ filter[asPrefix + 'status'] = mainServices.stringToBoolean(filter[asPrefix + 'status']); };                

                //Injection:
                if(filter[asPrefix + 'injection.administered_volume'] != undefined){ filter[asPrefix + 'injection.administered_volume'] = parseInt(filter[asPrefix + 'injection.administered_volume'], 10); }

                //Injection user - Post aggregate lookup:
                if(filter[asPrefix + 'injection.injection_user._id'] != undefined){ filter[asPrefix + 'injection.injection_user._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'injection.injection_user._id']); };
                if(filter[asPrefix + 'injection.injection_user.status'] != undefined){ filter[asPrefix + 'injection.injection_user.status'] = mainServices.stringToBoolean(filter[asPrefix + 'injection.injection_user.status']); };
                if(filter[asPrefix + 'injection.injection_user.person._id'] != undefined){ filter[asPrefix + 'injection.injection_user.person._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'injection.injection_user.person._id']); };
                if(filter[asPrefix + 'injection.injection_user.person.documents.doc_type'] != undefined){ filter[asPrefix + 'injection.injection_user.person.documents.doc_type'] = parseInt(filter[asPrefix + 'injection.injection_user.person.documents.doc_type'], 10); }
                if(filter[asPrefix + 'injection.injection_user.person.gender'] != undefined){ filter[asPrefix + 'injection.injection_user.person.gender'] = parseInt(filter[asPrefix + 'injection.injection_user.person.gender'], 10); }
                if(filter[asPrefix + 'injection.injection_user.person.phone_numbers'] != undefined){ filter[asPrefix + 'injection.injection_user.person.phone_numbers'] = filter[asPrefix + 'injection.injection_user.person.phone_numbers'][0] = parseInt(filter[asPrefix + 'injection.injection_user.person.phone_numbers'], 10); }
                    
                //Set allowed explicit operators:
                if(filter[asPrefix + 'injection.injection_user.person.birth_date'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'injection.injection_user.person.birth_date'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'injection.injection_user.person.birth_date'][explicitOperator] = new Date(filter[asPrefix + 'injection.injection_user.person.birth_date'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'injection.injection_user.person.birth_date'] = new Date(filter[asPrefix + 'injection.injection_user.person.birth_date']);
                        }
                    });
                }

                //Acquisition console technician - Post aggregate lookup:
                if(filter[asPrefix + 'acquisition.console_technician._id'] != undefined){ filter[asPrefix + 'acquisition.console_technician._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'acquisition.console_technician._id']); };
                if(filter[asPrefix + 'acquisition.console_technician.status'] != undefined){ filter[asPrefix + 'acquisition.console_technician.status'] = mainServices.stringToBoolean(filter[asPrefix + 'acquisition.console_technician.status']); };
                if(filter[asPrefix + 'acquisition.console_technician.person._id'] != undefined){ filter[asPrefix + 'acquisition.console_technician.person._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'acquisition.console_technician.person._id']); };
                if(filter[asPrefix + 'acquisition.console_technician.person.documents.doc_type'] != undefined){ filter[asPrefix + 'acquisition.console_technician.person.documents.doc_type'] = parseInt(filter[asPrefix + 'acquisition.console_technician.person.documents.doc_type'], 10); }
                if(filter[asPrefix + 'acquisition.console_technician.person.gender'] != undefined){ filter[asPrefix + 'acquisition.console_technician.person.gender'] = parseInt(filter[asPrefix + 'acquisition.console_technician.person.gender'], 10); }
                if(filter[asPrefix + 'acquisition.console_technician.person.phone_numbers'] != undefined){ filter[asPrefix + 'acquisition.console_technician.person.phone_numbers'] = filter[asPrefix + 'acquisition.console_technician.person.phone_numbers'][0] = parseInt(filter[asPrefix + 'acquisition.console_technician.person.phone_numbers'], 10); }
                if(filter[asPrefix + 'acquisition.console_technician.person.birth_date'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'acquisition.console_technician.person.birth_date'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'acquisition.console_technician.person.birth_date'][explicitOperator] = new Date(filter[asPrefix + 'acquisition.console_technician.person.birth_date'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'acquisition.console_technician.person.birth_date'] = new Date(filter[asPrefix + 'acquisition.console_technician.person.birth_date']);
                        }
                    });
                }

                //PET-CT:
                if(filter[asPrefix + 'injection.pet_ct.syringe_activity_full'] != undefined){ filter[asPrefix + 'injection.pet_ct.syringe_activity_full'] = parseFloat(filter[asPrefix + 'injection.pet_ct.syringe_activity_full']); }
                if(filter[asPrefix + 'injection.pet_ct.syringe_activity_empty'] != undefined){ filter[asPrefix + 'injection.pet_ct.syringe_activity_empty'] = parseFloat(filter[asPrefix + 'injection.pet_ct.syringe_activity_empty']); }
                if(filter[asPrefix + 'injection.pet_ct.administred_activity'] != undefined){ filter[asPrefix + 'injection.pet_ct.administred_activity'] = parseFloat(filter[asPrefix + 'injection.pet_ct.administred_activity']); }

                //PET-CT | Laboratory user - Post aggregate lookup:
                if(filter[asPrefix + 'injection.pet_ct.laboratory_user._id'] != undefined){ filter[asPrefix + 'injection.pet_ct.laboratory_user._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'injection.pet_ct.laboratory_user._id']); };
                if(filter[asPrefix + 'injection.pet_ct.laboratory_user.status'] != undefined){ filter[asPrefix + 'injection.pet_ct.laboratory_user.status'] = mainServices.stringToBoolean(filter[asPrefix + 'injection.pet_ct.laboratory_user.status']); };
                if(filter[asPrefix + 'injection.pet_ct.laboratory_user.person._id'] != undefined){ filter[asPrefix + 'injection.pet_ct.laboratory_user.person._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'injection.pet_ct.laboratory_user.person._id']); };
                if(filter[asPrefix + 'injection.pet_ct.laboratory_user.person.documents.doc_type'] != undefined){ filter[asPrefix + 'injection.pet_ct.laboratory_user.person.documents.doc_type'] = parseInt(filter[asPrefix + 'injection.pet_ct.laboratory_user.person.documents.doc_type'], 10); }
                if(filter[asPrefix + 'injection.pet_ct.laboratory_user.person.gender'] != undefined){ filter[asPrefix + 'injection.pet_ct.laboratory_user.person.gender'] = parseInt(filter[asPrefix + 'injection.pet_ct.laboratory_user.person.gender'], 10); }
                if(filter[asPrefix + 'injection.pet_ct.laboratory_user.person.phone_numbers'] != undefined){ filter[asPrefix + 'injection.pet_ct.laboratory_user.person.phone_numbers'] = filter[asPrefix + 'injection.pet_ct.laboratory_user.person.phone_numbers'][0] = parseInt(filter[asPrefix + 'injection.pet_ct.laboratory_user.person.phone_numbers'], 10); }
                    
                //Set allowed explicit operators:
                if(filter[asPrefix + 'injection.pet_ct.laboratory_user.person.birth_date'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'injection.pet_ct.laboratory_user.person.birth_date'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'injection.pet_ct.laboratory_user.person.birth_date'][explicitOperator] = new Date(filter[asPrefix + 'injection.pet_ct.laboratory_user.person.birth_date'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'injection.pet_ct.laboratory_user.person.birth_date'] = new Date(filter[asPrefix + 'injection.pet_ct.laboratory_user.person.birth_date']);
                        }
                    });
                }

                //Acquisition:
                if(filter[asPrefix + 'acquisition.console_technician'] != undefined){ filter[asPrefix + 'acquisition.console_technician'] = mongoose.Types.ObjectId(filter[asPrefix + 'acquisition.console_technician']); };

                return filter;
            });
            break;

        case 'reports':
            filter = adjustCondition(filter, (filter) => {
                //Schema:
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'fk_performing'] != undefined){ filter[asPrefix + 'fk_performing'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_performing']); };
                if(filter[asPrefix + 'findings.fk_procedure'] != undefined){ filter[asPrefix + 'findings.fk_procedure'] = filter[asPrefix + 'findings.fk_procedure'][0] = mongoose.Types.ObjectId(filter[asPrefix + 'findings.fk_procedure']); }
                if(filter[asPrefix + 'medical_signatures'] != undefined){ filter[asPrefix + 'medical_signatures'] = filter[asPrefix + 'medical_signatures'][0] = mongoose.Types.ObjectId(filter[asPrefix + 'medical_signatures']); }
                if(filter[asPrefix + 'fk_pathologies'] != undefined){ filter[asPrefix + 'fk_pathologies'] = filter[asPrefix + 'fk_pathologies'][0] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_pathologies']); }

                //Authenticated:
                if(filter[asPrefix + 'authenticated.fk_user'] != undefined){ filter[asPrefix + 'authenticated.fk_user'] = mongoose.Types.ObjectId(filter[asPrefix + 'authenticated.fk_user']); };
                if(filter[asPrefix + 'authenticated.datetime'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'authenticated.datetime'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'authenticated.datetime'][explicitOperator] = new Date(filter[asPrefix + 'authenticated.datetime'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'authenticated.datetime'] = new Date(filter[asPrefix + 'authenticated.datetime']);
                        }
                    });
                }

                return filter;
            });
            break;
        
        case 'signatures':
            filter = adjustCondition(filter, (filter) => {
                //Schema:
                if(filter[asPrefix + '_id'] != undefined){ filter[asPrefix + '_id'] = mongoose.Types.ObjectId(filter[asPrefix + '_id']); };
                if(filter[asPrefix + 'fk_organization'] != undefined){ filter[asPrefix + 'fk_organization'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_organization']); };
                if(filter[asPrefix + 'fk_user'] != undefined){ filter[asPrefix + 'fk_user'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_user']); };

                return filter;
            });
            break;
    }

    //Return adjusted filter:
    return filter;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// ADJUST CONDITION:
//--------------------------------------------------------------------------------------------------------------------//
async function adjustCondition(filter, callback){
    //Initialize final filter:
    let final_filter = {};

    //Condition with AND operator:
    if(filter.and){
        final_filter = callback(filter.and);
    }

    //Condition with OR operator:
    if(filter.or){
        final_filter = callback(filter.or);
    }

    //Condition with elemMatch operator:
    if(filter.elemMatch){
        //Check if there is more than one property with the elemMatch operator:
        if(Object.keys(filter.elemMatch).length){
            //Get key name:
            const keyName = Object.keys(filter.elemMatch)[0];

            //Loop through values inside the elementMatch Object (await foreach):
            await Promise.all(Object.keys(filter.elemMatch[keyName]).map(async (current) => {
                //Create tmp_filter (clean on each iteration):
                let tmp_filter = {};
                tmp_filter[keyName + '.' + current] = filter.elemMatch[keyName][current];

                //Adjust Data Type (individual element [elementMatch Object]):
                let callback_return = await callback(tmp_filter);

                //Assign adjusted value on original object:
                filter.elemMatch[keyName][current] = callback_return[keyName + '.' + current];
            }));
        } else {
            //Build elementMatch condition with multiple keys (await foreach):
            await Promise.all(Object.keys(filter.elementMatch).map(async (keyName) => {

                //Loop through values inside the IN array:
                await Promise.all(Object.keys(filter.elementMatch[keyName]).map(async (current) => {
                    //Create tmp_filter (clean on each iteration):
                    let tmp_filter = {};
                    tmp_filter[keyName + '.' + current] = filter.elemMatch[keyName][current];

                    //Adjust Data Type (individual element [elementMatch Object]):
                    let callback_return = await callback(tmp_filter);
                    
                    //Assign adjusted value on original object:
                    filter.elemMatch[keyName][current] = callback_return[keyName + '.' + current];
                }));
            }));
        }
    }

    //Condition with IN operator:
    if(filter.in){
        //Check if there is more than one property with the in operator:
        if(Object.keys(filter.in).length == 1){
            //Get key name:
            const keyName = Object.keys(filter.in)[0];

            //Loop through values inside the IN array:
            await Promise.all(Object.keys(filter.in[keyName]).map(async (current) => {
                //Create tmp_filter (clean on each iteration):
                let tmp_filter = {};
                tmp_filter[keyName] = filter.in[keyName][current];

                //Adjust Data Type (individual element [IN Array]):
                let callback_return = await callback(tmp_filter);
                
                //Assign adjusted value on original object:
                filter.in[keyName][current] = callback_return[keyName]
            }));
        } else {
            //Build IN condition with multiple keys (await foreach):
            await Promise.all(Object.keys(filter.in).map(async (keyName) => {

                //Loop through values inside the IN array:
                await Promise.all(Object.keys(filter.in[keyName]).map(async (current) => {
                    //Create tmp_filter (clean on each iteration):
                    let tmp_filter = {};
                    tmp_filter[keyName] = filter.in[keyName][current];

                    //Adjust Data Type (individual element [IN Array]):
                    let callback_return = await callback(tmp_filter);
                    
                    //Assign adjusted value on original object:
                    filter.in[keyName][current] = callback_return[keyName]
                }));
            }));
        }
    }

    //Condition with ALL operator:
    if(filter.all){
        //Check if there is more than one property with the ALL operator:
        if(Object.keys(filter.all).length == 1){
            //Get key name:
            const keyName = Object.keys(filter.all)[0];

            //Loop through values inside the ALL array:
            await Promise.all(Object.keys(filter.all[keyName]).map(async (current) => {
                //Create tmp_filter (clean on each iteration):
                let tmp_filter = {};
                tmp_filter[keyName] = filter.all[keyName][current];

                //Adjust Data Type (individual element [ALL Array]):
                let callback_return = await callback(tmp_filter);
                
                //Assign adjusted value on original object:
                filter.all[keyName][current] = callback_return[keyName]
            }));
        } else {
            //Build ALL condition with multiple keys (await foreach):
            await Promise.all(Object.keys(filter.all).map(async (keyName) => {

                //Loop through values inside the ALL array:
                await Promise.all(Object.keys(filter.all[keyName]).map(async (current) => {
                    //Create tmp_filter (clean on each iteration):
                    let tmp_filter = {};
                    tmp_filter[keyName] = filter.all[keyName][current];

                    //Adjust Data Type (individual element [ALL Array]):
                    let callback_return = await callback(tmp_filter);
                    
                    //Assign adjusted value on original object:
                    filter.all[keyName][current] = callback_return[keyName]
                }));
            }));
        }
    }

    //Condition without operator (Filter only):
    final_filter = callback(filter);

    //Return adjusted condition:
    return final_filter;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET FK ORGANIZATION:
//--------------------------------------------------------------------------------------------------------------------//
async function setFKOrganization(req, res, user_permission){
    // Initializate fk_organization:
    let fk_organization = '';

    // Check if there is JWT to set fk_organization:
    if(req.decoded !== undefined){
        //One step authentication:
        if(req.decoded.session !== undefined && req.decoded.session !== null){
            //Get domain type from JWT:
            const domainType = await domainIs(req.decoded.session.domain, res);

            //Get complete domain:
            const completeDomain = await getCompleteDomain(req.decoded.session.domain, domainType);
            fk_organization = completeDomain.organization;

        //Two step authentication for multiple role user (exist 1 minute JWT but not session):
        } else {
            //Get domain type from user_permissions:
            const domainType = await domainIs(user_permission.domain, res);

            //Get complete domain:
            const completeDomain = await getCompleteDomain(user_permission.domain, domainType);
            fk_organization = completeDomain.organization;
        }
    
    // If there is no JWT get fk_organization from user permission:
    // This case is for users with only one permission (one step login).
    // Otherwise it does not reach this step (Does not record signin attempt log).
    } else {
        //Get domain type from user_permissions:
        const domainType = await domainIs(user_permission.domain, res);

        //Get complete domain:
        const completeDomain = await getCompleteDomain(user_permission.domain, domainType);
        fk_organization = completeDomain.organization;
    }

    // Return fk_organization:
    return fk_organization;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// INSERT LOG:
//--------------------------------------------------------------------------------------------------------------------//
async function insertLog(req, res, event, element = undefined, fk_user = undefined, user_permission = undefined){
    //Import schemas:
    const logs = require('./logs/schemas');

    //Check fk_user:
    if(fk_user == undefined){
        //Get user _id from decoded JWT:
        fk_user = req.decoded.sub;
    }

    //Set fk_organization:
    const fk_organization = await setFKOrganization(req, res, user_permission);

    //Set datetime:
    const datetime = moment().format('YYYY-MM-DDTHH:mm:ss.SSS', { trim: false }) + 'Z';

    //Initializate result:
    let result = false;

    //Create log object:
    const logObj = {
        fk_organization: mongoose.Types.ObjectId(fk_organization),
        event: event,
        datetime: datetime,
        fk_user: mongoose.Types.ObjectId(fk_user),
        ip_client: mainServices.getIPClient(req)
    }

    //Check if log entry have an element:
    if(element !== undefined && element !== null && element !== ''){
        logObj['element'] = element;
    }

    //Create Mongoose object to insert validated data:
    const logData = new logs.Model(logObj);

    //Save registry in Log DB:
    await logData.save(logData)
    .then(async (savedLog) => {
        if(savedLog){
            //Set result:
            result = true;
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });

    //Return result:
    return result;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// DOMAIN IS:
//--------------------------------------------------------------------------------------------------------------------//
async function domainIs (domain, res) {
    //Initialize result:
    let result = null;

    //Import schemas:
    const organizations = require('./organizations/schemas');
    const branches      = require('./branches/schemas');
    const services      = require('./services/schemas');

    //Set projection:
    const minimalProj = { _id: 1 };

    //Search in ORGANIZATIONS:
    await organizations.Model.findById(domain, minimalProj)
    .exec()
    .then(async (organization_data) => {
        //Check if have results:
        if(organization_data){
            result = 'organizations';
        } else {

            //Search in BRANCHES:
            await branches.Model.findById(domain, minimalProj)
            .exec()
            .then(async (branches_data) => {
                //Check if have results:
                if(branches_data){
                    result = 'branches';
                } else {

                    //Search in SERVICES:
                    await services.Model.findById(domain, minimalProj)
                    .exec()
                    .then((services_data) => {
                        //Check if have results:
                        if(services_data){
                            result = 'services';
                        }
                    })
                    .catch((err) => {
                        //Set result:
                        result = 'Error: ' + currentLang.db.query_error;

                        //Send error:
                        mainServices.sendError(res, currentLang.db.query_error, err);
                    });

                }
            })
            .catch((err) => {
                //Set result:
                result = 'Error: ' + currentLang.db.query_error;

                //Send error:
                mainServices.sendError(res, currentLang.db.query_error, err);
            });
            
        }
    })
    .catch((err) => {
        //Set result:
        result = 'Error: ' + currentLang.db.query_error;

        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });

    //Return result:
    return result;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// ADD DOMAIN CONDITION:
//--------------------------------------------------------------------------------------------------------------------//
async function addDomainCondition(req, res, domainType, completeDomain){
    //Get information for the request:
    let filter      = req.query.filter;
    const user_id   = req.decoded.sub;
    const domain    = req.decoded.session.domain;
    const role      = req.decoded.session.role;
    const schema    = req.baseUrl.slice(1);   //Slice to remove '/' (first character).
    const method    = req.path.slice(1);      //Slice to remove '/' (first character).

    //Initializate operation result:
    let operationResult = true;

    //Check if bad domain type:
    if(domainType !== 'organizations' && domainType !== 'branches' && domainType !== 'services'){
        operationResult = false; /* Operation rejected */
    } else {

        //Switch by method:
        switch(method){
            //------------------------------------------------------------------------------------------------------------//
            // FIND, FIND BY ID, FIND ONE, FINDBYSERVICE, FINDBYROLEINREPORT, STUDYTOKEN:
            //------------------------------------------------------------------------------------------------------------//
            case 'find':
            case 'findOne':
            case 'findByService':       // Only the users module uses this case.
            case 'findByRoleInReport':  // Only the users module uses this case.
            case 'studyToken':          // Wezen paths.
                //If filter has no operator, add domain condition with no operator:
                let haveOperator = false;
                
                //Check if it has a filter:
                if(filter){
                    //If filter has operator, add domain condition with AND operator:
                    if(filter.and || filter.or){
                        haveOperator = true; 
                    }
                } else {
                    //Add filter object to request (prevent undefined nested properties):
                    req.query.filter = {};
                }

                //Set condition according to schema:
                switch(schema){
                    case 'organizations':
                        //Check whether it has operator or not:
                        if(haveOperator){
                            //Add AND operator in case only this OR operator (Prevent: Cannot set properties of undefined):
                            if(!filter.and){ req.query.filter['and'] = []; }

                            //Switch by domain type: 
                            if(domainType == 'organizations'){
                                //Add domain condition:
                                req.query.filter.and['_id'] = domain;

                            } else if(domainType == 'branches' || domainType == 'services'){
                                //Add domain condition:
                                req.query.filter.and['_id'] = completeDomain.organization;
                            }
                        } else {
                            //Switch by domain type: 
                            if(domainType == 'organizations'){
                                //Add domain condition:
                                req.query.filter['_id'] = domain;

                            } else if(domainType == 'branches' || domainType == 'services'){
                                //Add domain condition:
                                req.query.filter['_id'] = completeDomain.organization;
                            }
                        }
                        break;

                    case 'branches':
                        //Check whether it has operator or not:
                        if(haveOperator){
                            //Add AND operator in case only this OR operator (Prevent: Cannot set properties of undefined):
                            if(!filter.and){ req.query.filter['and'] = []; }

                            //Switch by domain type: 
                            if(domainType == 'organizations'){
                                //Add domain condition:
                                req.query.filter.and['fk_organization'] = domain;
                            
                            } else if(domainType == 'branches'){
                                //Add domain condition:
                                req.query.filter.and['_id'] = domain;

                            } else if(domainType == 'services'){
                                //Add domain condition:
                                req.query.filter.and['_id'] = completeDomain.branch;
                            }

                        } else {
                            //Switch by domain type: 
                            if(domainType == 'organizations'){
                                //Add domain condition:
                                req.query.filter['fk_organization'] = domain;
                            
                            } else if(domainType == 'branches'){
                                //Add domain condition:
                                req.query.filter['_id'] = domain;

                            } else if(domainType == 'services'){
                                //Add domain condition:
                                req.query.filter['_id'] = completeDomain.branch;
                            }
                        }
                        break;

                    case 'services':
                        //Check whether it has operator or not:
                        if(haveOperator){
                            //Add AND operator in case only this OR operator (Prevent: Cannot set properties of undefined):
                            if(!filter.and){ req.query.filter['and'] = []; }

                            //Switch by domain type: 
                            if(domainType == 'organizations'){
                                //Add domain condition:
                                req.query.filter.and['branch.fk_organization'] = domain;

                            } else if(domainType == 'branches'){
                                //Add domain condition:
                                req.query.filter.and['fk_branch'] = domain;
                            
                            } else if(domainType == 'services'){
                                //Add domain condition:
                                req.query.filter.and['_id'] = domain;
                            }

                        } else {
                            //Switch by domain type: 
                            if(domainType == 'organizations'){
                                //Add domain condition:
                                req.query.filter['branch.fk_organization'] = domain;

                            } else if(domainType == 'branches'){
                                //Add domain condition:
                                req.query.filter['fk_branch'] = domain;
                            
                            } else if(domainType == 'services'){
                                //Add domain condition:
                                req.query.filter['_id'] = domain;
                            }
                        }
                        break;

                    case 'equipments':
                        //Check whether it has operator or not:
                        if(haveOperator){
                            //Add AND operator in case only this OR operator (Prevent: Cannot set properties of undefined):
                            if(!filter.and){ req.query.filter['and'] = []; }

                            //Switch by domain type: 
                            if(domainType == 'organizations'){
                                //Add domain condition:
                                req.query.filter.and['branch.fk_organization'] = domain;

                            } else if(domainType == 'branches' || domainType == 'services'){
                                //Add domain condition:
                                req.query.filter.and['fk_branch'] = completeDomain.branch;
                            }
                            
                        } else {
                            //Switch by domain type: 
                            if(domainType == 'organizations'){
                                //Add domain condition:
                                req.query.filter['branch.fk_organization'] = domain;

                            } else if(domainType == 'branches' || domainType == 'services'){
                                //Add domain condition:
                                req.query.filter['fk_branch'] = completeDomain.branch;                            
                            }
                        }
                        break;

                    case 'slots':
                        //Check whether it has operator or not:
                        if(haveOperator){
                            //Add AND operator in case only this OR operator (Prevent: Cannot set properties of undefined):
                            if(!filter.and){ req.query.filter['and'] = []; }

                            //Switch by domain type: 
                            if(domainType == 'organizations'){
                                //Add domain condition:
                                req.query.filter.and['domain.organization'] = domain;

                            } else if(domainType == 'branches'){
                                //Add domain condition:
                                req.query.filter.and['domain.branch'] = domain;

                            } else if(domainType == 'services'){
                                //Add domain condition:
                                req.query.filter.and['domain.service'] = domain;
                            }
                        } else {
                            //Switch by domain type: 
                            if(domainType == 'organizations'){
                                //Add domain condition:
                                req.query.filter['domain.organization'] = domain;

                            } else if(domainType == 'branches'){
                                //Add domain condition:
                                req.query.filter['domain.branch'] = domain;

                            } else if(domainType == 'services'){
                                //Add domain condition:
                                req.query.filter['domain.service'] = domain;
                            }
                        }
                        break;

                    case 'procedures':
                        //Check whether it has operator or not:
                        if(haveOperator){
                            //Add AND operator in case only this OR operator (Prevent: Cannot set properties of undefined):
                            if(!filter.and){ req.query.filter['and'] = []; }

                            //Switch by domain type: 
                            if(domainType == 'organizations'){
                                //Add domain condition:
                                req.query.filter.and['domain.organization'] = domain;

                            } else if(domainType == 'branches'){
                                //Add domain condition:
                                req.query.filter.and['domain.branch'] = domain;

                            } else if(domainType == 'services'){
                                //Add domain condition (Limited permission):
                                //If the user is logged in with the service domain, he will be able to see the procedures of the branch, not of the organization (there are no procedures per service).
                                req.query.filter.and['domain.branch'] = completeDomain.branch;
                            }

                        } else {
                            //Switch by domain type: 
                            if(domainType == 'organizations'){
                                //Add domain condition:
                                req.query.filter['domain.organization'] = domain;

                            } else if(domainType == 'branches'){
                                //Add domain condition:
                                req.query.filter['domain.branch'] = domain;

                            } else if(domainType == 'services'){
                                //Add domain condition (Limited permission):
                                //If the user is logged in with the service domain, he will be able to see the procedures of the branch, not of the organization (there are no procedures per service).
                                req.query.filter['domain.branch'] = completeDomain.branch;
                            }
                        }
                        break;

                    case 'procedure_categories':
                        //Check whether it has operator or not:
                        if(haveOperator){
                            //Add AND operator in case only this OR operator (Prevent: Cannot set properties of undefined):
                            if(!filter.and){ req.query.filter['and'] = []; }

                            //Switch by domain type: 
                            if(domainType == 'organizations'){
                                //Add domain condition:
                                req.query.filter.and['domain.organization'] = domain;

                            } else if(domainType == 'branches'){
                                //Add domain condition:
                                req.query.filter.and['domain.branch'] = domain;

                            } else if(domainType == 'services'){
                                //Add domain condition (Limited permission):
                                //If the user is logged in with the service domain, he will be able to see the procedure categories of the branch, not of the organization (there are no procedure categories per service).
                                req.query.filter.and['domain.branch'] = completeDomain.branch;
                            }

                        } else {
                            //Switch by domain type: 
                            if(domainType == 'organizations'){
                                //Add domain condition:
                                req.query.filter['domain.organization'] = domain;

                            } else if(domainType == 'branches'){
                                //Add domain condition:
                                req.query.filter['domain.branch'] = domain;

                            } else if(domainType == 'services'){
                                //Add domain condition (Limited permission):
                                //If the user is logged in with the service domain, he will be able to see the procedure categories of the branch, not of the organization (there are no procedure categories per service).
                                req.query.filter['domain.branch'] = completeDomain.branch;
                            }
                        }
                        break;

                    case 'files':
                        //Check whether it has operator or not:
                        if(haveOperator){
                            //Add AND operator in case only this OR operator (Prevent: Cannot set properties of undefined):
                            if(!filter.and){ req.query.filter['and'] = []; }

                            //Switch by domain type: 
                            if(domainType == 'organizations'){
                                //Add domain condition:
                                req.query.filter.and['domain.organization'] = domain;

                            } else if(domainType == 'branches' || domainType == 'services'){
                                //Add domain condition:
                                req.query.filter.and['domain.branch'] = completeDomain.branch;
                            }
                        } else {
                            //Switch by domain type: 
                            if(domainType == 'organizations'){
                                //Add domain condition:
                                req.query.filter['domain.organization'] = domain;

                            } else if(domainType == 'branches' || domainType == 'services'){
                                //Add domain condition:
                                req.query.filter['domain.branch'] = completeDomain.branch;
                            }
                        }
                        break;

                    case 'appointments':
                    case 'appointment_requests':
                        //Initializate composite domain objects:
                        let imaging = {};
                        let referring = {};
                        let fk_referring = {};
                        let reporting = {};
                        let fk_reporting = {};

                        //Create filter and first explicit $AND operator (if not exist):
                        if(!filter){ req.query.filter = {}; }
                        req.query.filter['$and'] = [];

                        //Set patient condition:
                        if(role === 9){ req.query.filter['patient._id'] = user_id; }

                        //Switch by domain type: 
                        if(domainType == 'organizations'){
                            //Set composite domain:
                            //The data type is adjusted manually because $AND does not go through the adjustDataTypes function.
                            imaging['imaging.organization._id'] = mongoose.Types.ObjectId(domain);
                            referring['referring.organization._id'] = mongoose.Types.ObjectId(domain);
                            fk_referring['referring.fk_referring._id'] = mongoose.Types.ObjectId(user_id);
                            reporting['reporting.organization._id'] = mongoose.Types.ObjectId(domain);
                            fk_reporting['reporting.fk_reporting._id'] = mongoose.Types.ObjectId(user_id);
                            
                            //Create explicit operators (Third operator level):
                            let or_condition    = { '$or'   : [ imaging, referring, fk_referring, reporting, fk_reporting] };
                            let domain_condition   = { '$and'  : [ or_condition ] };

                            //Add domain condition into explicit $AND operator:
                            req.query.filter.$and.push(domain_condition);

                        } else if(domainType == 'branches'){
                            //Set composite domain:
                            //The data type is adjusted manually because $AND does not go through the adjustDataTypes function.
                            imaging['imaging.branch._id'] = mongoose.Types.ObjectId(domain);
                            referring['referring.branch._id'] = mongoose.Types.ObjectId(domain);
                            fk_referring['referring.fk_referring._id'] = mongoose.Types.ObjectId(user_id);
                            reporting['reporting.branch._id'] = mongoose.Types.ObjectId(domain);
                            fk_reporting['reporting.fk_reporting._id'] = mongoose.Types.ObjectId(user_id);
                            
                            //Create explicit operators (Third operator level):
                            let or_condition    = { '$or'   : [ imaging, referring, fk_referring, reporting, fk_reporting] };
                            let domain_condition   = { '$and'  : [ or_condition ] };

                            //Add domain condition into explicit $AND operator:
                            req.query.filter.$and.push(domain_condition);

                        } else if(domainType == 'services'){
                            //Set composite domain:
                            //The data type is adjusted manually because $AND does not go through the adjustDataTypes function.
                            imaging['imaging.service._id'] = mongoose.Types.ObjectId(domain);
                            referring['referring.service._id'] = mongoose.Types.ObjectId(domain);
                            fk_referring['referring.fk_referring._id'] = mongoose.Types.ObjectId(user_id);
                            reporting['reporting.service._id'] = mongoose.Types.ObjectId(domain);
                            fk_reporting['reporting.fk_reporting._id'] = mongoose.Types.ObjectId(user_id);
                            
                            //Create explicit operators (Third operator level):
                            let or_condition    = { '$or'   : [ imaging, referring, fk_referring, reporting, fk_reporting] };
                            let domain_condition   = { '$and'  : [ or_condition ] };

                            //Add domain condition into explicit $AND operator:
                            req.query.filter.$and.push(domain_condition);
                        }

                        break;

                    case 'appointments_drafts':
                        //Initializate composite domain objects:
                        let imaging_drafts = {};
    
                        //Create filter and first explicit $AND operator (if not exist):
                        if(!filter){ req.query.filter = {}; }
                        req.query.filter['$and'] = [];

                        //Set patient condition:
                        if(role === 9){ req.query.filter['patient._id'] = user_id; }
    
                        //Switch by domain type: 
                        if(domainType == 'organizations'){
                            //Set composite domain:
                            //The data type is adjusted manually because $AND does not go through the adjustDataTypes function.
                            imaging_drafts['imaging.organization._id'] = mongoose.Types.ObjectId(domain);
                                
                            //Create explicit operators (Third operator level):
                            let or_condition    = { '$or'   : [ imaging_drafts ] };
                            let domain_condition   = { '$and'  : [ or_condition ] };
    
                            //Add domain condition into explicit $AND operator:
                            req.query.filter.$and.push(domain_condition);
    
                        } else if(domainType == 'branches'){
                            //Set composite domain:
                            //The data type is adjusted manually because $AND does not go through the adjustDataTypes function.
                            imaging_drafts['imaging.branch._id'] = mongoose.Types.ObjectId(domain);
                                
                            //Create explicit operators (Third operator level):
                            let or_condition    = { '$or'   : [ imaging_drafts ] };
                            let domain_condition   = { '$and'  : [ or_condition ] };
    
                            //Add domain condition into explicit $AND operator:
                            req.query.filter.$and.push(domain_condition);
    
                        } else if(domainType == 'services'){
                            //Set composite domain:
                            //The data type is adjusted manually because $AND does not go through the adjustDataTypes function.
                            imaging_drafts['imaging.service._id'] = mongoose.Types.ObjectId(domain);
                                
                            //Create explicit operators (Third operator level):
                            let or_condition    = { '$or'   : [ imaging_drafts ] };
                            let domain_condition   = { '$and'  : [ or_condition ] };
    
                            //Add domain condition into explicit $AND operator:
                            req.query.filter.$and.push(domain_condition);
                        }
    
                        break;

                    case 'wezen':   // studyToken from wezen url is the same as perfoming finds domain filters:
                    case 'performing':
                        //Initializate composite domain objects:
                        let appointment_imaging = {};
                        let appointment_referring = {};
                        let appointment_fk_referring = {};
                        let appointment_reporting = {};
                        let appointment_fk_reporting = {};

                        //Create filter and first explicit $AND operator (if not exist):
                        if(!filter){ req.query.filter = {}; }
                        req.query.filter['$and'] = [];

                        //Set patient condition:
                        if(role === 9){ req.query.filter['patient._id'] = user_id; }

                        //Switch by domain type: 
                        if(domainType == 'organizations'){
                            //Set composite domain:
                            //The data type is adjusted manually because $AND does not go through the adjustDataTypes function.
                            appointment_imaging['appointment.imaging.organization._id'] = mongoose.Types.ObjectId(domain);
                            appointment_referring['appointment.referring.organization._id'] = mongoose.Types.ObjectId(domain);
                            appointment_fk_referring['appointment.referring.fk_referring._id'] = mongoose.Types.ObjectId(user_id);
                            appointment_reporting['appointment.reporting.organization._id'] = mongoose.Types.ObjectId(domain);
                            appointment_fk_reporting['appointment.reporting.fk_reporting._id'] = mongoose.Types.ObjectId(user_id);

                            //Create explicit operators (Third operator level):
                            let or_condition    = { '$or'   : [ appointment_imaging, appointment_referring, appointment_fk_referring, appointment_reporting, appointment_fk_reporting] };
                            let domain_condition   = { '$and'  : [ or_condition ] };

                            //Add domain condition into explicit $AND operator:
                            req.query.filter.$and.push(domain_condition);

                        } else if(domainType == 'branches'){
                            //Set composite domain:
                            //The data type is adjusted manually because $AND does not go through the adjustDataTypes function.
                            appointment_imaging['appointment.imaging.branch._id'] = mongoose.Types.ObjectId(domain);
                            appointment_referring['appointment.referring.branch._id'] = mongoose.Types.ObjectId(domain);
                            appointment_fk_referring['appointment.referring.fk_referring._id'] = mongoose.Types.ObjectId(user_id);
                            appointment_reporting['appointment.reporting.branch._id'] = mongoose.Types.ObjectId(domain);
                            appointment_fk_reporting['appointment.reporting.fk_reporting._id'] = mongoose.Types.ObjectId(user_id);
                            
                            //Create explicit operators (Third operator level):
                            let or_condition    = { '$or'   : [ appointment_imaging, appointment_referring, appointment_fk_referring, appointment_reporting, appointment_fk_reporting] };
                            let domain_condition   = { '$and'  : [ or_condition ] };

                            //Add domain condition into explicit $AND operator:
                            req.query.filter.$and.push(domain_condition);

                        } else if(domainType == 'services'){
                            //Set composite domain:
                            //The data type is adjusted manually because $AND does not go through the adjustDataTypes function.
                            appointment_imaging['appointment.imaging.service._id'] = mongoose.Types.ObjectId(domain);
                            appointment_referring['appointment.referring.service._id'] = mongoose.Types.ObjectId(domain);
                            appointment_fk_referring['appointment.referring.fk_referring._id'] = mongoose.Types.ObjectId(user_id);
                            appointment_reporting['appointment.reporting.service._id'] = mongoose.Types.ObjectId(domain);
                            appointment_fk_reporting['appointment.reporting.fk_reporting._id'] = mongoose.Types.ObjectId(user_id);
                            
                            //Create explicit operators (Third operator level):
                            let or_condition    = { '$or'   : [ appointment_imaging, appointment_referring, appointment_fk_referring, appointment_reporting, appointment_fk_reporting] };
                            let domain_condition   = { '$and'  : [ or_condition ] };

                            //Add domain condition into explicit $AND operator:
                            req.query.filter.$and.push(domain_condition);
                        }
                        break;

                    case 'reports':
                        //Initializate composite domain objects:
                        let performing_appointment_imaging = {};
                        let performing_appointment_referring = {};
                        let performing_appointment_fk_referring = {};
                        let performing_appointment_reporting = {};
                        let performing_appointment_fk_reporting = {};

                        //Create filter and first explicit $AND operator (if not exist):
                        if(!filter){ req.query.filter = {}; }
                        req.query.filter['$and'] = [];

                        //Set patient condition:
                        if(role === 9){ req.query.filter['patient._id'] = user_id; }

                        //Switch by domain type: 
                        if(domainType == 'organizations'){
                            //Set composite domain:
                            //The data type is adjusted manually because $AND does not go through the adjustDataTypes function.
                            performing_appointment_imaging['appointment.imaging.organization._id'] = mongoose.Types.ObjectId(domain);
                            performing_appointment_referring['appointment.referring.organization._id'] = mongoose.Types.ObjectId(domain);
                            performing_appointment_fk_referring['appointment.referring.fk_referring._id'] = mongoose.Types.ObjectId(user_id);
                            performing_appointment_reporting['appointment.reporting.organization._id'] = mongoose.Types.ObjectId(domain);
                            performing_appointment_fk_reporting['appointment.reporting.fk_reporting._id'] = mongoose.Types.ObjectId(user_id);
                            
                            //Create explicit operators (Third operator level):
                            let or_condition    = { '$or'   : [ performing_appointment_imaging, performing_appointment_referring, performing_appointment_fk_referring, performing_appointment_reporting, performing_appointment_fk_reporting] };
                            let domain_condition   = { '$and'  : [ or_condition ] };

                            //Add domain condition into explicit $AND operator:
                            req.query.filter.$and.push(domain_condition);

                        } else if(domainType == 'branches'){
                            //Set composite domain:
                            //The data type is adjusted manually because $AND does not go through the adjustDataTypes function.
                            performing_appointment_imaging['appointment.imaging.branch._id'] = mongoose.Types.ObjectId(domain);
                            performing_appointment_referring['appointment.referring.branch._id'] = mongoose.Types.ObjectId(domain);
                            performing_appointment_fk_referring['appointment.referring.fk_referring._id'] = mongoose.Types.ObjectId(user_id);
                            performing_appointment_reporting['appointment.reporting.branch._id'] = mongoose.Types.ObjectId(domain);
                            performing_appointment_fk_reporting['appointment.reporting.fk_reporting._id'] = mongoose.Types.ObjectId(user_id);
                            
                            //Create explicit operators (Third operator level):
                            let or_condition    = { '$or'   : [ performing_appointment_imaging, performing_appointment_referring, performing_appointment_fk_referring, performing_appointment_reporting, performing_appointment_fk_reporting] };
                            let domain_condition   = { '$and'  : [ or_condition ] };

                            //Add domain condition into explicit $AND operator:
                            req.query.filter.$and.push(domain_condition);

                        } else if(domainType == 'services'){
                            //Set composite domain:
                            //The data type is adjusted manually because $AND does not go through the adjustDataTypes function.
                            performing_appointment_imaging['appointment.imaging.service._id'] = mongoose.Types.ObjectId(domain);
                            performing_appointment_referring['appointment.referring.service._id'] = mongoose.Types.ObjectId(domain);
                            performing_appointment_fk_referring['appointment.referring.fk_referring._id'] = mongoose.Types.ObjectId(user_id);
                            performing_appointment_reporting['appointment.reporting.service._id'] = mongoose.Types.ObjectId(domain);
                            performing_appointment_fk_reporting['appointment.reporting.fk_reporting._id'] = mongoose.Types.ObjectId(user_id);
                            
                            //Create explicit operators (Third operator level):
                            let or_condition    = { '$or'   : [ performing_appointment_imaging, performing_appointment_referring, performing_appointment_fk_referring, performing_appointment_reporting, performing_appointment_fk_reporting] };
                            let domain_condition   = { '$and'  : [ or_condition ] };

                            //Add domain condition into explicit $AND operator:
                            req.query.filter.$and.push(domain_condition);
                        }
                        break;

                    case 'logs':
                    case 'signatures':
                    case 'pathologies':
                        //Check whether it has operator or not:
                        if(haveOperator){
                            //Add AND operator in case only this OR operator (Prevent: Cannot set properties of undefined):
                            if(!filter.and){ req.query.filter['and'] = []; }
    
                            //Add domain condition:
                            req.query.filter.and['fk_organization'] = completeDomain.organization;
    
                        } else {
                            //Add domain condition:
                            req.query.filter['fk_organization'] = completeDomain.organization;
                        }
                        break;
                        
                    case 'users':
                        //Create explicit $OR operator:
                        // The explicit $OR operator is used since it is not possible to use IN.
                        // If more than one operator is used (IN, OR in this case), the master 
                        // condition is an AND and an OR would be required.
                        let explicit_or = [];

                        //Import schemas:
                        const branches = require('./branches/schemas');
                        const services = require('./services/schemas');

                        //If domainType is ORGANIZATIONS:
                        //In this case it is necessary to obtain all the _id of branches and services associated with the organization.
                        if(domainType == 'organizations'){
                            //Add into ORGANIZATION domain condition:
                            explicit_or.push({ 'permissions.organization': mongoose.Types.ObjectId(domain) });

                            //Initializate query results variables:
                            let branchesIds = [];
                            let servicesIds = [];
                            let branchesIN = [];

                            //Get all branch _id of this organization:
                            //Attribute to cross: fk_organization
                            await branches.Model.find({ fk_organization: domain }, { _id: 1 })
                            .exec()
                            .then((data) => {
                                branchesIds = data;
                            })
                            .catch((err) => {
                                //Send error:
                                mainServices.sendError(res, currentLang.db.query_error, err);
                            });

                            //Format branches array for IN operator (Await foreach):
                            await Promise.all(Object.keys(branchesIds).map((current) => {
                                //Add _id branches into array for second query (services query):
                                branchesIN.push(branchesIds[current]._id);

                                //Add into BRANCH domain condition:
                                explicit_or.push({ 'permissions.branch': mongoose.Types.ObjectId(branchesIds[current]._id) });
                            }));

                            //Delete temp array:
                            delete branchesIds;
                            
                            //Get all service _id of this organization:
                            //Attribute to cross: fk_branch (branchesIN obtained).
                            await services.Model.find({ fk_branch: { '$in': branchesIN } }, { _id: 1 })
                            .exec()
                            .then((data) => {
                                servicesIds = data;
                            })
                            .catch((err) => {
                                //Send error:
                                mainServices.sendError(res, currentLang.db.query_error, err);
                            });

                            //Format services array for IN operator (Await foreach):
                            await Promise.all(Object.keys(servicesIds).map((current) => {
                                //Add into SERVICE domain condition:
                                // OR operator is used since it is not possible to use IN.
                                // If more than one operator is used (IN, OR in this case),
                                // the master condition is an AND and an OR would be required.
                                explicit_or.push({ 'permissions.service': mongoose.Types.ObjectId(servicesIds[current]._id) });
                            }));

                            //Delete temp array:
                            delete servicesIds;

                        //If domainType is BRANCHES:
                        //In this case it is necessary to obtain the organization _id and all the services _id
                        } else if(domainType == 'branches'){
                            //Add into BRANCH domain condition:
                            explicit_or.push({ 'permissions.branch': mongoose.Types.ObjectId(domain) });

                            //Initializate query results variables:
                            let fk_organization = '';
                            let servicesIds = [];

                            //Get organization _id from branches collection (fk_organization):
                            await branches.Model.findById(domain, { fk_organization: 1 })
                            .exec()
                            .then((data) => {
                                fk_organization = data.fk_organization;
                            })
                            .catch((err) => {
                                //Send error:
                                mainServices.sendError(res, currentLang.db.query_error, err);
                            });

                            //Add into ORGANIZATION domain condition:
                            explicit_or.push({ 'permissions.organization': mongoose.Types.ObjectId(fk_organization) });

                            //Get all service _id of this branch:
                            await services.Model.find({ fk_branch: domain }, { _id: 1 })
                            .exec()
                            .then((data) => {
                                servicesIds = data;
                            })
                            .catch((err) => {
                                //Send error:
                                mainServices.sendError(res, currentLang.db.query_error, err);
                            });

                            //Format services array for IN operator (Await foreach):
                            await Promise.all(Object.keys(servicesIds).map((current) => {
                                //Add into SERVICE domain condition:
                                // OR operator is used since it is not possible to use IN.
                                // If more than one operator is used (IN, OR in this case),
                                // the master condition is an AND and an OR would be required.
                                explicit_or.push({ 'permissions.service': mongoose.Types.ObjectId(servicesIds[current]._id) });
                            }));

                            //Delete temp array:
                            delete servicesIds;

                        //If domainType is SERVICES:
                        //In this case it is necessary to obtain the _id of branch and organization.
                        } else if(domainType == 'services'){
                            //Add into SERVICE domain condition:
                            explicit_or.push({ 'permissions.service': mongoose.Types.ObjectId(domain) });

                            //Initializate query results variables:
                            let fk_branch = '';
                            let fk_organization = '';

                            //Get branches _id from service collection (fk_branch):
                            await services.Model.findById(domain, { fk_branch: 1 })
                            .exec()
                            .then((data) => {
                                fk_branch = data.fk_branch;
                            })
                            .catch((err) => {
                                //Send error:
                                mainServices.sendError(res, currentLang.db.query_error, err);
                            });

                            //Add into BRANCH domain condition:
                            explicit_or.push({ 'permissions.branch': mongoose.Types.ObjectId(fk_branch) });
                            

                            //Get organization _id from branches collection (fk_organization):
                            await branches.Model.findById(fk_branch, { fk_organization: 1 })
                            .exec()
                            .then((data) => {
                                fk_organization = data.fk_organization;
                            })
                            .catch((err) => {
                                //Send error:
                                mainServices.sendError(res, currentLang.db.query_error, err);
                            });

                            //Add into ORGANIZATION domain condition:
                            explicit_or.push({ 'permissions.organization': mongoose.Types.ObjectId(fk_organization) });
                        }

                        //Create explicit $AND operator to contain $OR (Explicit operator):
                        if(!req.query.filter.$and){ req.query.filter['$and'] = []; }

                        //Add explicit $OR operator:
                        req.query.filter.$and.push({'$or' : explicit_or });
                        break;
                }
                break;

            //------------------------------------------------------------------------------------------------------------//
            // STATS:
            // Create RABC filter because filter is disabled in stats:
            //------------------------------------------------------------------------------------------------------------//
            case 'appointment_requests':
            case 'appointments':
                req.query.rabc_filter = { 'imaging.organization': mongoose.Types.ObjectId(completeDomain.organization) };
                break;
            case 'performing':
            case 'reports':
                req.query.rabc_filter = { 'appointment.imaging.organization._id': mongoose.Types.ObjectId(completeDomain.organization) };
                break;
            case 'organizations':
                req.query.rabc_filter = { 'appointment.imaging.organization._id': mongoose.Types.ObjectId(completeDomain.organization) };
                break;

            //------------------------------------------------------------------------------------------------------------//
            // INSERT & UPDATE:
            //------------------------------------------------------------------------------------------------------------//
            // INSERT:
            case 'insert':
                //Set restrictions according to schema [INSERT ONLY]:
                switch(schema){
                    case 'organizations':
                        // No restrictions here.
                        // The Superuser role is unique role can access here.
                        break;

                    case 'branches':
                        // No restrictions here.
                        // The Superuser role is unique role can access here.
                        break;

                    case 'services':
                        //To insert a service it can only be domainType organization (Administrator role only):
                        if(domainType == 'branches' || domainType == 'services'){
                            operationResult = false; /* Operation rejected */
                        }
                        break;

                    case 'modalities':
                        // No restrictions here.
                        // The Superuser role is unique role can access here.
                        break;

                    case 'equipments':
                        // No restrictions here.
                        // The Superuser role is unique role can access here.
                        break;

                    case 'slots':
                        //Current cases to eval:
                        if(domainType == 'organizations' && req.body.domain.organization !== domain){
                            operationResult = false; /* Operation rejected */
                        } else if(domainType == 'branches' && req.body.domain.branch !== domain){
                            operationResult = false; /* Operation rejected */
                        } else if(domainType == 'services' && req.body.domain.service !== domain){
                            operationResult = false; /* Operation rejected */
                        }
                        break;

                    case 'procedures':
                    case 'procedure_categories':
                        //Current cases to eval:
                        if(domainType == 'organizations' && req.body.domain.organization !== domain){
                            operationResult = false; /* Operation rejected */
                        
                        //To insert a procedure or procedure category it can only be domainType organization (Administrator role only):
                        } else if(domainType == 'branches' || domainType == 'services'){
                            operationResult = false; /* Operation rejected */
                        }
                        break;

                    case 'files':
                        //Current cases to eval:
                        if(domainType == 'organizations' && req.body.domain.organization !== domain){
                            operationResult = false; /* Operation rejected */
                        } else if(domainType == 'branches' && req.body.domain.branch !== domain){
                            operationResult = false; /* Operation rejected */
                        } else if(domainType == 'services' && referencedFile.domain.organization != completeDomain.organization){
                            operationResult = false; /* Operation rejected */
                        }
                        break;

                    case 'appointments':
                    case 'appointments_drafts':
                        //Current cases to eval:
                        if(domainType == 'organizations' && req.body.imaging.organization !== domain){
                            operationResult = false; /* Operation rejected */
                        } else if(domainType == 'branches' && req.body.imaging.branch !== domain){
                            operationResult = false; /* Operation rejected */
                        } else if(domainType == 'services' && req.body.imaging.service !== domain){
                            operationResult = false; /* Operation rejected */
                        }
                        break;

                    case 'performing':
                        //Get Domain Reference:
                        const referencedAppointment = await getDomainReference('appointments', req.body.fk_appointment, { 'imaging' : 1 });

                        //Check Domain Reference:
                        if(referencedAppointment !== false){
                            //Current cases to eval:
                            if(domainType == 'organizations' && referencedAppointment.imaging.organization != domain){
                                operationResult = false; /* Operation rejected */
                            } else if(domainType == 'branches' && referencedAppointment.imaging.branch != domain){
                                operationResult = false; /* Operation rejected */
                            } else if(domainType == 'services' && referencedAppointment.imaging.service != domain){
                                operationResult = false; /* Operation rejected */
                            }
                        } else {
                            operationResult = false;  /* Operation rejected */
                        }
                        break;

                    case 'reports':
                        //Get Domain Reference:
                        const referencePerforming = await getDomainReference('performing', req.body.fk_performing, { 'fk_appointment' : 1 });
                        const referencePerformingAppointment = await getDomainReference('appointments', referencePerforming.fk_appointment, { 'imaging' : 1 });

                        //Check Domain Reference:
                        if(referencePerforming !== false){
                            //Current cases to eval:
                            if(domainType == 'organizations' && referencePerformingAppointment.imaging.organization != domain){
                                operationResult = false; /* Operation rejected */
                            } else if(domainType == 'branches' && referencePerformingAppointment.imaging.branch != domain){
                                operationResult = false; /* Operation rejected */
                            } else if(domainType == 'services' && referencePerformingAppointment.imaging.service != domain){
                                operationResult = false; /* Operation rejected */
                            }
                        } else {
                            operationResult = false;  /* Operation rejected */
                        }
                        break;

                    case 'signatures':
                        // No restrictions here.
                        // All users can sign as long as they have the concession to do so.
                        // fk_organization field is setted in save handler with the domain auth.
                        break;

                    case 'pathologies':
                        //Current cases to eval:
                        if(domainType == 'organizations' && req.body.fk_organization !== domain){
                            operationResult = false; /* Operation rejected */
                        
                        //To insert a pathology it can only be domainType organization (Administrator role only):
                        } else if(domainType == 'branches' || domainType == 'services'){
                            operationResult = false; /* Operation rejected */
                        }
                        break;

                    case 'people':
                        //No restrictions here.
                        //People must be accessible from all organizations (single database of people).
                        break;

                    case 'users':
                        //Check that permissions are being established or modified:
                        if(req.body.permissions){

                            //Loop in permisions array (Await foreach):
                            await Promise.all(Object.keys(req.body.permissions).map(async (current) => {

                                //Current cases:
                                if( (domainType == 'organizations' && req.body.permissions[current].organization !== domain) ||
                                    (domainType == 'branches' && req.body.permissions[current].branch !== domain) ||
                                    (domainType == 'services' && req.body.permissions[current].service !== domain) ) {

                                    //Permission organization:
                                    if(req.body.permissions[current].organization){
                                        // Not allowed.
                                        // A user authenticated with domain type at the 'branch or service level'
                                        // cannot insert permissions with 'organization level'.
                                        // Except if it is patient permission (patient creation).
                                        if(req.body.permissions[current].role !== 9){
                                            operationResult = false; /* Operation rejected */
                                        }

                                    //Permission branch:
                                    } else if(req.body.permissions[current].branch){
                                        //Import branches schema:
                                        const branches = require('./branches/schemas');

                                        //FindById associated branch:
                                        await branches.Model.findById(req.body.permissions[current].branch, { _id: 1, fk_organization: 1 })
                                        .exec()
                                        .then(async (branchData) => {
                                            //Check if have results:
                                            if(branchData){

                                                //Domain type organization case:
                                                if(domainType == 'organizations' && branchData.fk_organization == domain){
                                                    //Set operation result (allowed):
                                                    operationResult = true;

                                                //Domain type service case:
                                                } else if(domainType == 'services'){
                                                    // Not allowed.
                                                    // A user authenticated with domain type at the 'service level'
                                                    // cannot insert permissions with 'branch level'.
                                                    operationResult = false; /* Operation rejected */
                                                }
                                            }
                                        })
                                        .catch((err) => {
                                            //Send error:
                                            mainServices.sendError(res, currentLang.db.query_error, err);
                                        });

                                    //Permission service:
                                    } else if(req.body.permissions[current].service){
                                        //Import services schema:
                                        const services = require('./services/schemas');

                                        //FindById current permission service:
                                        await services.Model.findById(req.body.permissions[current].service, { _id: 1, fk_branch: 1 })
                                        .exec()
                                        .then(async (serviceData) => {
                                            //Check if have results:
                                            if(serviceData){

                                                //Import branches schema:
                                                const branches = require('./branches/schemas');

                                                //FindById associated branch:
                                                await branches.Model.findById(serviceData.fk_branch, { _id: 1, fk_organization: 1 })
                                                .exec()
                                                .then(async (branchData) => {
                                                    //Check if have results:
                                                    if(branchData){                                                

                                                        //Domain type branch case:
                                                        if(domainType == 'branches' && branchData._id == domain){
                                                            //Set operation result (allowed):
                                                            operationResult = true;
                                                        //Domain type organization case:
                                                        } else if(domainType == 'organizations' && branchData.fk_organization == domain){
                                                            //Set operation result (allowed):
                                                            operationResult = true;
                                                        }

                                                    }
                                                })
                                                .catch((err) => {
                                                    //Send error:
                                                    mainServices.sendError(res, currentLang.db.query_error, err);
                                                });
                                            }
                                        })
                                        .catch((err) => {
                                            //Send error:
                                            mainServices.sendError(res, currentLang.db.query_error, err);
                                        });
                                    } else {
                                        operationResult = false; /* Operation rejected */
                                    }
                                }

                                //Check that the authenticated role can insert the role of the request:
                                //Add Superuser [Allowed: Superuser]:
                                if( (req.body.permissions[current].role == 1 && role != 1) ||

                                    //Add Administrator, ... ,Recepcionist [Allowed: Superuser, Administrator]:
                                    (((req.body.permissions[current].role >= 2 && req.body.permissions[current].role <= 8) && (role != 1 && role != 2)) || ((req.body.permissions[current].role >= 2 && req.body.permissions[current].role <= 8) && (role != 1 && role != 2))) ||

                                    //Add Patient [Allowed: Superuser, Administrator, Recepcionist]:
                                    //(req.body.permissions[current].role == 9 && (role != 1 && role != 2 && role != 8)) ||
                                    // Condition cancelled: Now this is controlled by main permissions and concesions.
                                    
                                    //Add Functional user [Allowed: Superuser, Administrator]:
                                    (req.body.permissions[current].role == 1 && (role != 1 && role != 2)) )
                                { operationResult = false; /* Operation rejected */ }
                            }));
                        }
                        break;
                }
                break;
            
            // UPDATE:
            case 'update':
                //Set restrictions according to schema [INSERT AND UPDATE]:
                switch(schema){
                    case 'organizations':
                        // No restrictions here.
                        // The Superuser role is unique role can access here.
                        break;

                    case 'branches':
                        // No restrictions here.
                        // The Superuser role is unique role can access here.
                        break;
                    
                    case 'services':
                        //To insert a service it can only be domainType organization (Administrator role only):
                        if(domainType == 'branches' || domainType == 'services'){
                            operationResult = false; /* Operation rejected */
                        }
                        break;

                    case 'modalities':
                        // No restrictions here.
                        // The Superuser role is unique role can access here.
                        break;

                    case 'equipments':
                        // No restrictions here.
                        // The Superuser role is unique role can access here.
                        break;

                    case 'slots':
                        //Get Domain Reference:
                        const referencedSlot = await getDomainReference(schema, req.body._id, { 'domain' : 1 });

                        //Check Domain Reference:
                        if(referencedSlot !== false){
                            //Current cases to eval:
                            if(domainType == 'organizations' && referencedSlot.domain.organization != domain){
                                operationResult = false; /* Operation rejected */
                            } else if(domainType == 'branches' && referencedSlot.domain.branch != domain){
                                operationResult = false; /* Operation rejected */
                            } else if(domainType == 'services' && referencedSlot.domain.service != domain){
                                operationResult = false; /* Operation rejected */
                            }
                        } else {
                            operationResult = false;  /* Operation rejected */
                        }
                        
                        break;

                    case 'procedures':
                    case 'procedure_categories':
                        //Get Domain Reference:
                        const referencedProcedure = await getDomainReference(schema, req.body._id, { 'domain' : 1 });

                        //Check Domain Reference:
                        if(referencedProcedure !== false){
                            //Current cases to eval:
                            if(domainType == 'organizations' && referencedProcedure.domain.organization != domain){
                                operationResult = false; /* Operation rejected */

                            //To update a procedure it can only be domainType organization (Administrator role only):
                            } else if(domainType == 'branches' || domainType == 'services'){
                                operationResult = false; /* Operation rejected */
                            }
                        } else {
                            operationResult = false;  /* Operation rejected */
                        }
                        break;

                    case 'files':
                        //Get Domain Reference:
                        const referencedFile = await getDomainReference(schema, req.body._id, { 'domain' : 1 });

                        //Check Domain Reference:
                        if(referencedFile !== false){
                            //Current cases to eval:
                            if(domainType == 'organizations' && referencedFile.domain.organization != domain){
                                operationResult = false; /* Operation rejected */
                            } else if(domainType == 'branches' && referencedFile.domain.branch != domain){
                                operationResult = false; /* Operation rejected */
                            } else if(domainType == 'services' && referencedFile.domain.organization != completeDomain.organization){
                                operationResult = false; /* Operation rejected */
                            }
                        } else {
                            operationResult = false;  /* Operation rejected */
                        }
                        break;

                    case 'appointments':
                    case 'appointments_drafts':
                        //Get Domain Reference:
                        const referencedAppointment = await getDomainReference(schema, req.body._id, { 'imaging' : 1 });

                        //Check Domain Reference:
                        if(referencedAppointment !== false){
                            //Current cases to eval:
                            if(domainType == 'organizations' && referencedAppointment.imaging.organization != domain){
                                operationResult = false; /* Operation rejected */
                            } else if(domainType == 'branches' && referencedAppointment.imaging.branch != domain){
                                operationResult = false; /* Operation rejected */
                            } else if(domainType == 'services' && referencedAppointment.imaging.service != domain){
                                operationResult = false; /* Operation rejected */
                            }
                        } else {
                            operationResult = false;  /* Operation rejected */
                        }
                        break;

                    case 'performing':
                        //Get Domain Reference:
                        const referencedFK = await getDomainReference(schema, req.body._id, { 'fk_appointment' : 1 });
                        const referencedFKAppointment = await getDomainReference('appointments', referencedFK.fk_appointment, { 'imaging' : 1 });

                        //Check Domain Reference:
                        if(referencedFKAppointment !== false){
                            //Current cases to eval:
                            if(domainType == 'organizations' && referencedFKAppointment.imaging.organization != domain){
                                operationResult = false; /* Operation rejected */
                            } else if(domainType == 'branches' && referencedFKAppointment.imaging.branch != domain){
                                operationResult = false; /* Operation rejected */
                            } else if(domainType == 'services' && referencedFKAppointment.imaging.service != domain){
                                operationResult = false; /* Operation rejected */
                            }
                        } else {
                            operationResult = false;  /* Operation rejected */
                        }
                        break;

                    case 'reports':
                        //Get Domain Reference:
                        const referenceSelfFK = await getDomainReference(schema, req.body._id, { 'fk_performing' : 1 });
                        const referencePerformingFK = await getDomainReference('performing', referenceSelfFK.fk_performing, { 'fk_appointment' : 1 });
                        const referencePerformingFKAppointment = await getDomainReference('appointments', referencePerformingFK.fk_appointment, { 'imaging' : 1 });

                        //Check Domain Reference:
                        if(referencePerformingFKAppointment !== false){
                            //Current cases to eval:
                            if(domainType == 'organizations' && referencePerformingFKAppointment.imaging.organization != domain){
                                operationResult = false; /* Operation rejected */
                            } else if(domainType == 'branches' && referencePerformingFKAppointment.imaging.branch != domain){
                                operationResult = false; /* Operation rejected */
                            } else if(domainType == 'services' && referencePerformingFKAppointment.imaging.service != domain){
                                operationResult = false; /* Operation rejected */
                            }
                        } else {
                            operationResult = false;  /* Operation rejected */
                        }
                        break;

                    case 'pathologies':
                        //Get Domain Reference:
                        const referencedPathology = await getDomainReference(schema, req.body._id, { 'fk_organization' : 1 });

                        //Check Domain Reference:
                        if(referencedPathology !== false){
                            //Current cases to eval:
                            if(domainType == 'organizations' && referencedPathology.fk_organization != domain){
                                operationResult = false; /* Operation rejected */

                            //To update a procedure it can only be domainType organization (Administrator role only):
                            } else if(domainType == 'branches' || domainType == 'services'){
                                operationResult = false; /* Operation rejected */
                            }
                        } else {
                            operationResult = false;  /* Operation rejected */
                        }
                        break;

                    case 'people':
                        //No restrictions here.
                        //People must be accessible from all organizations (single database of people).
                        break;

                    case 'users':
                        //Check that permissions are being established or modified:
                        if(req.body.permissions){
                            //Set operation result (rejected):
                            operationResult = false;

                            //Loop in permisions array (Await foreach):
                            await Promise.all(Object.keys(req.body.permissions).map(async (current) => {
                                    
                                //Current cases:
                                //With a single element that meets the condition will be enough to allow the operation.
                                //The rest of the permissions that do not meet the condition may belong to another organization.
                                if( (domainType == 'organizations' && req.body.permissions[current].organization === domain) ||
                                    (domainType == 'branches' && req.body.permissions[current].branch === domain) ||
                                    (domainType == 'services' && req.body.permissions[current].service === domain) ){

                                    //Set operation result (allowed):
                                    operationResult = true;

                                //Check cases where the domain type does not match the permission domain:
                                //Permission organization:
                                } else if(req.body.permissions[current].organization){

                                    //Add update user patient data exception:
                                    if(req.body.permissions[current].role == 9){
                                        //Set operation result (allowed):
                                        operationResult = true;
                                    }
                                    
                                    // OR Not allowed.
                                    // A user authenticated with domain type at the 'branch or service level'
                                    // cannot change the permissions of another user with permissions at the 'organization level'.

                                //Permission branch:
                                } else if(req.body.permissions[current].branch){
                                    //Import branches schema:
                                    const branches = require('./branches/schemas');

                                    //FindById associated branch:
                                    await branches.Model.findById(req.body.permissions[current].branch, { _id: 1, fk_organization: 1 })
                                    .exec()
                                    .then(async (branchData) => {
                                        //Check if have results:
                                        if(branchData){

                                            //Domain type organization case:
                                            if(domainType == 'organizations' && branchData.fk_organization == domain){
                                                //Set operation result (allowed):
                                                operationResult = true;

                                            //Domain type service case:
                                            } else if(domainType == 'services'){
                                                // Not allowed.
                                                // A user authenticated with domain type at 'service level' cannot change 
                                                // the permissions of another user with permissions at 'branch level'.
                                            }
                                        }
                                    })
                                    .catch((err) => {
                                        //Send error:
                                        mainServices.sendError(res, currentLang.db.query_error, err);
                                    });

                                //Permission service:
                                } else if(req.body.permissions[current].service){
                                    //Import services schema:
                                    const services = require('./services/schemas');

                                    //FindById current permission service:
                                    await services.Model.findById(req.body.permissions[current].service, { _id: 1, fk_branch: 1 })
                                    .exec()
                                    .then(async (serviceData) => {
                                        //Check if have results:
                                        if(serviceData){

                                            //Import branches schema:
                                            const branches = require('./branches/schemas');

                                            //FindById associated branch:
                                            await branches.Model.findById(serviceData.fk_branch, { _id: 1, fk_organization: 1 })
                                            .exec()
                                            .then(async (branchData) => {
                                                //Check if have results:
                                                if(branchData){                                                

                                                    //Domain type branch case:
                                                    if(domainType == 'branches' && branchData._id == domain){
                                                        //Set operation result (allowed):
                                                        operationResult = true;
                                                    //Domain type organization case:
                                                    } else if(domainType == 'organizations' && branchData.fk_organization == domain){
                                                        //Set operation result (allowed):
                                                        operationResult = true;
                                                    }

                                                }
                                            })
                                            .catch((err) => {
                                                //Send error:
                                                mainServices.sendError(res, currentLang.db.query_error, err);
                                            });
                                        }
                                    })
                                    .catch((err) => {
                                        //Send error:
                                        mainServices.sendError(res, currentLang.db.query_error, err);
                                    });
                                }

                                //In the event of an update, the roles are not controlled since they may belong to another organization.
                            }));
                        }
                        
                        break;
                }
                break;

            //------------------------------------------------------------------------------------------------------------//
            // DELETE:
            //------------------------------------------------------------------------------------------------------------//
            // Restricted by roles (Superuser is only user allowed).
            //------------------------------------------------------------------------------------------------------------//
        }
    }

    //Return operation result:
    return operationResult;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// GET DOMAIN REFERENCE:
//--------------------------------------------------------------------------------------------------------------------//
async function getDomainReference(schemaName, _id, domainProj){
    //Initializate result:
    let result = false;

    //Import current Schema:
    const currentSchema = require('./' + schemaName + '/schemas');
    
    //Find domain reference by Id:
    await currentSchema.Model.findById(_id, domainProj)
    .exec()
    .then((data) => {
        //Check if have results:
        if(data){
            result = data;
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });

    //Return result:
    return result;
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// CHECK OBJECT ID:
//--------------------------------------------------------------------------------------------------------------------//
function checkObjectId(objId){
    //Check with Moongoose method:
    if(mongoose.isValidObjectId(objId)){
        //Fix any 12 characters long string case:
        //When creating an object id with a valid string it must be the same string.
        const realObjectId = new ObjectId(objId);

        //Check string contents:
        if(realObjectId.toString() == objId.toString()){
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// VALIDATE PERMISSIONS:
//--------------------------------------------------------------------------------------------------------------------//
async function validatePermissions(req){
    //Initializate operation result:
    let operationResult = false;

    //Check that the request has permissions:
    if(req.body.permissions){
        //Loop in permissions array (Await foreach):
        await Promise.all(Object.keys(req.body.permissions).map((current) => {
            if( (req.body.permissions[current].organization ||
                req.body.permissions[current].branch ||
                req.body.permissions[current].service ) &&
                req.body.permissions[current].role ){
                
                //Set operation result:
                operationResult = true;
            }
        }));
    }

    //Return operation result:
    return operationResult;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET STUDY IUID:
//--------------------------------------------------------------------------------------------------------------------//
// Set OID Structure base:
// Reference in UY:
// https://centrodeconocimiento.agesic.gub.uy/documents/207224/425682/Gu%C3%ADa+para+la+gesti%C3%B3n+de+OID.pdf/293df376-77d5-71d3-9490-ede702bbb583
//--------------------------------------------------------------------------------------------------------------------//
// '2.16.858'          + // Base UNAOID UY
// '.2'                + // Identifica Objeto (0: Organizaciones, 1: Personas, 2: Objetos)
// '.XXXXXXXX'         + // ID Estructura (Organización o sucursal) [max length: 8]
// '.72769'            + // ID PACS (PACS organization o branch) Tipo de objeto [FIJO]
// '.YYYYMMDDHHmmss'   + // Timestamp
// '*'                 + // Sufijo (Opcional)
//--------------------------------------------------------------------------------------------------------------------//
// Ejemplo de sufijo:
// '.XXXXXX'           + // Consecutivo interno
// '.8'                + // PACS de ASSE
//--------------------------------------------------------------------------------------------------------------------//
// Total max length: 64
//--------------------------------------------------------------------------------------------------------------------//
// ID PACS:
// 67430 Historia Clínica Electrónica
// 71867 Repositorio de documentos electrónicos
// 72591 Modelo de Plantilla Digital
// 72768 Sistemas de Información de Salud (HIS, SIS,HealthInformationSystems)
// 72769 Sistemas de Archivo y Transmisión de Imágenes (PACS, SATI, Picture And CommunicationInformationSystems)
// 72770 Sistemas de Información Imagenológica (SII, RIS, IIS, ImagenologicalInformationSystem, RadiologicalInformationSystems)
// 72771 Sistemas de Información de Laboratorios (sinónimos asociados: SIL, LIS, LaboratoryInformationSystems)
//--------------------------------------------------------------------------------------------------------------------//
async function setStudyIUID(req, res) {
    //Initialize operation status:
    let operation_status = false;

    //Import schema:
    const organizations = require('./organizations/schemas');
    const branches = require('./branches/schemas');

    //Get timestamp:
    const timestamp = moment().format('YYYYMMDDHHmmss', { trim: false }); //Trim false to keep leading zeros.

    //Create Study IUID regex:
    const regexStudyIUD = /^([0-9].([0-9]){2}.([0-9]){3}.[0-9].([0-9]){8}.([0-9]){5}.([0-9]){14})/gm;

    //Search in Organizations:
    await organizations.Model.findById(req.body.imaging.organization, { country_code: 1, structure_id: 1, suffix: 1 })
    .exec()
    .then(async (organization_data) => {
        //Check if have results:
        if(organization_data){
            //Initialize Study IUID structure:
            let country_code = undefined;
            let structure_id = undefined;
            let suffix = '';

            //Check organization country_code:
            if(organization_data.country_code !== undefined && organization_data.country_code !== null && organization_data.country_code !== ''){
                country_code = organization_data.country_code;
            }

            //Check organization structure_id:
            if(organization_data.structure_id !== undefined && organization_data.structure_id !== null && organization_data.structure_id !== ''){
                structure_id = organization_data.structure_id;
            }

            //Check organization suffix:
            if(organization_data.suffix !== undefined && organization_data.suffix !== null && organization_data.suffix !== ''){
                suffix = '.' + organization_data.suffix;
            }

            //Search in Branches:
            await branches.Model.findById(req.body.imaging.branch, { country_code: 1, structure_id: 1, suffix: 1 })
            .exec()
            .then((branch_data) => {
                //Check if have results:
                if(branch_data){
                    //Check branch country_code:
                    if(branch_data.country_code !== undefined && branch_data.country_code !== null && branch_data.country_code !== ''){
                        //Override organization country_code with branch country_code:
                        country_code = branch_data.country_code;
                    }

                    //Check branch structure_id:
                    if(branch_data.structure_id !== undefined && branch_data.structure_id !== null && branch_data.structure_id !== ''){
                        //Override organization structure_id with branch structure_id:
                        structure_id = branch_data.structure_id;
                    }

                    //Check branch suffix:
                    if(branch_data.suffix !== undefined && branch_data.suffix !== null && branch_data.suffix !== ''){
                        suffix = suffix + '.' + branch_data.suffix;
                    }
                }
            })
            .catch((err) => {
                //Send error:
                mainServices.sendError(res, currentLang.db.query_error, err);
            });

            // Set Accession number [OBR-18] (00080050):
            // 16 chars max.
            // Use four digits for Fractional Seconds to prevent repetitions.
            const accession_number = await moment().format('YYMMDDHHmmssSSSS', { trim: false }); //Trim false to keep leading zeros.

            //Create Study IUID:
            const study_iuid = '2.16.' + country_code + '.2.' + structure_id + '.72769.' + timestamp + '.' + accession_number + suffix;

            //Check study IUID with regex:
            if(regexStudyIUD.test(study_iuid)){
                //Set study_iuid and accession number in the request:
                req.body['study_iuid'] = study_iuid;
                req.body['accession_number'] = accession_number;

                //Set operation status:
                operation_status = true;
            } else {
                //Problem to generate Study IUID:
                res.status(500).send({ success: false, message: currentLang.ris.study_iuid_error + study_iuid });
            }
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });

    //Return operation status:
    return operation_status;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET ID ISSUER:
// Adaptation of the UNAOID for the ICAO standard.
//--------------------------------------------------------------------------------------------------------------------//
function setIDIssuer(organization_country_code, doc_country_code, doc_type){
    //Set baseIssuerID by region:
    const baseIssuerID = {
        //Uruguay:
        '858' : {
            // Set medical history organization ID (HCEN):
            'medical_organization' : '10000675',

            // CEDULA DE IDENTIDAD (ICAO - ID):
            '1' : '68909',

            // Pasaporte:
            '2' : '68912',

            // CREDENCIAL CIVICA (ICAO - CC):
            '3' : '68944',

            // LIBRETA DE CONDUCIR NACIONAL:
            '4' : '69011',

            // Permiso de residencia | OTRO DOCUMENTO DE IDENTIFICACION PERSONAL:
            '5' : '69024',

            // Visa | OTRO DOCUMENTO DE IDENTIFICACION PERSONAL:
            '6' : '69024',

            // Documento transitorio | OTRO DOCUMENTO DE IDENTIFICACION PERSONAL:
            '7' : '69024',

            // Documento anónimo | SIN DOCUMENTO (ICAO - SD):
            '100': '68945'
        }
    };

    //Return Issuer:
    return '2.16.' + doc_country_code + '.2.' + baseIssuerID[organization_country_code]['medical_organization'] + '.' + baseIssuerID[organization_country_code][doc_type];
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// GET COMPLETE DOMAIN:
//--------------------------------------------------------------------------------------------------------------------//
async function getCompleteDomain(domain, type){
    //Import schemas:
    const services = require('./services/schemas');
    const branches = require('./branches/schemas');

    //Initializate complete domain
    let completeDomain = {
        organization    : undefined,
        branch          : undefined,
        service         : undefined
    };

    //Switch by domain type:
    switch(type){
        case 'organizations':
            //Set organization _id with current domain as ObjectId type:
            completeDomain['organization'] = mongoose.Types.ObjectId(domain);
            break;

        case 'branches':
            //Set branch _id with current domain as ObjectId type:
            completeDomain['branch'] = mongoose.Types.ObjectId(domain);

            //Find domain branch to obtain fk_organization:
            await branches.Model.findById(domain, { fk_organization: 1 })
            .exec()
            .then((branch_data) => {

                //Check if have results:
                if(branch_data){

                    //Set organization _id with fk_organization as ObjectId type:
                    completeDomain['organization'] = mongoose.Types.ObjectId(branch_data.fk_organization);
                }
            })
            .catch((err) => {
                //Send error:
                mainServices.sendError(res, currentLang.db.query_error, err);
            });
            break;

        case 'services':
            //Set service _id with current domain as ObjectId type:
            completeDomain['service'] = mongoose.Types.ObjectId(domain);

            //Find domain service to obtain fk_branch://Search in Branches:
            await services.Model.findById(domain, { fk_branch: 1 })
            .exec()
            .then(async (service_data) => {

                //Check if have results:
                if(service_data){

                    //Set branch _id with fk_branch as ObjectId type:
                    completeDomain['branch'] = mongoose.Types.ObjectId(service_data.fk_branch);
                    
                    //Find referenced branch to obtain fk_organization:
                    await branches.Model.findById(service_data.fk_branch, { fk_organization: 1 })
                    .exec()
                    .then((branch_data) => {

                        //Check if have results:
                        if(branch_data){
                            
                            //Set organization _id with fk_organization as ObjectId type:
                            completeDomain['organization'] = mongoose.Types.ObjectId(branch_data.fk_organization);
                        }
                    })
                    .catch((err) => {
                        //Send error:
                        mainServices.sendError(res, currentLang.db.query_error, err);
                    });
                }
            })
            .catch((err) => {
                //Send error:
                mainServices.sendError(res, currentLang.db.query_error, err);
            });
            
            break;
    }

    //Return complete domain:
    return completeDomain;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// IS PET-CT METHOD:
//--------------------------------------------------------------------------------------------------------------------//
async function isPET(_id){
    //Initialize result:
    let result = false;

    //Import current Schema:
    const modalities = require('./modalities/schemas');

    //Find domain reference by Id:
    await modalities.Model.findById(_id, { 'code_value': 1 })
    .exec()
    .then((data) => {
        //Check if have results:
        if(data.code_value == 'PT'){
            result = true;
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });

    //Return result:
    return result;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET PERFORMING DATE:
//--------------------------------------------------------------------------------------------------------------------//
async function setPerformingDate(fk_appointment, checking_time){
    //Initializate result:
    let result = null;

    //Import appointments Schema:
    const appointments = require('./appointments/schemas');

    //Find appointment by _id:
    await appointments.Model.findById(fk_appointment, { start: 1 })
    .exec()
    .then((data) => {
        //Check for results (not empty):
        if(data){
            //Convert Mongoose object to Javascript object:
            data = data.toObject();

            //Date:
            const dateYear   = data.start.getFullYear();
            const dateMonth  = data.start.toLocaleString("es-AR", { month: "2-digit" });
            const dateDay    = data.start.toLocaleString("es-AR", { day: "2-digit" })

            //Set date format in result:
            result = dateYear + '-' + dateMonth + '-' + dateDay + 'T' + checking_time + ':00.000Z';
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });

    //Return result:
    return new Date(result);
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// REPORTS SAVE CONTROLLER:
//--------------------------------------------------------------------------------------------------------------------//
async function reportsSaveController(operation, handlerObj){
    //Initialize result:
    let result = {
        'success' : false,
        'message' : handlerObj.error_message
    };

    //Switch by operation:
    switch(operation){
        // Insert report:
        // handlerObj = { fk_performing, amend, error_message };
        case 'insert_report':
            //Format amend to boolean:
            if(handlerObj.amend === undefined || handlerObj.amend === null){
                handlerObj.amend = false;
            } else {
                handlerObj.amend = mainServices.stringToBoolean(handlerObj.amend);
            }
            
            //Find performing by _id:
            await findPerforming(handlerObj.fk_performing, { flow_state: 1 }, async (performingData) => {
                //Check for results (not empty):
                if(performingData){
                    //Convert Mongoose object to Javascript object:
                    performingData = performingData.toObject();

                    //Switch by flow state:
                    switch(performingData.flow_state){
                        //P06 (Para informar | First insert):
                        case 'P06':
                            //Update performing flow state to P07 (Informe borrador):
                            result = await setPerformingFS(handlerObj.fk_performing, 'P07');
                            break;

                        //P09 (Terminado (con informe) | Amend insert):
                        case 'P09':
                            //Check if is an amend:
                            if(handlerObj.amend !== undefined && handlerObj.amend === true){
                                //Update performing flow state to P07 (Informe borrador):
                                result = await setPerformingFS(handlerObj.fk_performing, 'P07');
                            }
                            break;
                    }
                }
            });
            break;

        // Update report:
        // handlerObj = { fk_performing, error_message };
        case 'update_report':
            //Find performing by _id:
            await findPerforming(handlerObj.fk_performing, { flow_state: 1 }, async (performingData) => {
                //Check for results (not empty):
                if(performingData){
                    //Convert Mongoose object to Javascript object:
                    performingData = performingData.toObject();

                    //Switch by flow state:
                    switch(performingData.flow_state){
                        //P07 (Informe borrador informar | Normal update):
                        case 'P07':
                            //Set success true result:
                            result = { 'success' : true };
                            break;

                        //P08 (Informe firmado | Update and destroy signatures):
                        case 'P08':
                            //Update performing flow state to P07 (Informe borrador):
                            result = await setPerformingFS(handlerObj.fk_performing, 'P07');
                            break;
                    }
                }
            });
            break;

        // Sign report:
        // handlerObj = { fk_performing, error_message };
        case 'sign_report':
            //Find performing by _id:
            await findPerforming(handlerObj.fk_performing, { flow_state: 1 }, async (performingData) => {
                //Check for results (not empty):
                if(performingData){
                    //Convert Mongoose object to Javascript object:
                    performingData = performingData.toObject();

                    //Switch by flow state:
                    switch(performingData.flow_state){
                        //P07 (Informe borrador | First sign):
                        case 'P07':
                            //Update performing flow state to P08 (Informe firmado):
                            result = await setPerformingFS(handlerObj.fk_performing, 'P08');
                            break;

                        //P08 (Informe firmado | Only add signature in the save handler):
                        case 'P08':
                            //Set success true result:
                            result = { 'success' : true };
                            break;
                    }
                }
            });
            break;

        // Authenticate report:
        // handlerObj = { fk_performing, error_message };
        case 'authenticate_report':
            //Find performing by _id:
            await findPerforming(handlerObj.fk_performing, { flow_state: 1 }, async (performingData) => {
                //Check for results (not empty):
                if(performingData){
                    //Convert Mongoose object to Javascript object:
                    performingData = performingData.toObject();

                    //Switch by flow state:
                    switch(performingData.flow_state){
                        //P08 (Informe firmado | Add authenticate object in report):
                        case 'P08':
                            //Update performing flow state to P09 (Terminado (con informe)):
                            result = await setPerformingFS(handlerObj.fk_performing, 'P09');
                            break;
                    }
                }
            });
            break;
    }

    //Return result:
    return result;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// FIND PERFORMING:
//--------------------------------------------------------------------------------------------------------------------//
async function findPerforming(fk_performing, proj, callback){
    //Import performing Schema:
    const performing = require('./performing/schemas');

    //Find performing by _id:
    await performing.Model.findById(fk_performing, proj)
    .exec()
    .then(async (performingData) => {
        //Execute callback with performing data:
        await callback(performingData);
    })
    .catch((err) => {
        //Set result - Find performing error:
        result = {
            'success' : false,
            'message' : currentLang.db.query_error + ' ' + err
        };
    });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET PERFORMING FLOW STATE:
//--------------------------------------------------------------------------------------------------------------------//
async function setPerformingFS(_id, flow_state){
    //Import performing Schema:
    const performing = require('./performing/schemas');

    //Initialize result:
    let result = {};

    //Set update data:
    const updateData = { $set: { 'flow_state': flow_state }};

    //Update flow state:
    await performing.Model.findOneAndUpdate({ _id: _id }, updateData, { new: true })
    .then(async (data) => {
        //Check if have results:
        if(data) {
            //Set success true result:
            result = { 'success' : true };
        } else {
            //Set result - Dont match (empty result):
            result = {
                'success' : false,
                'message' : currentLang.db.id_no_results
            };
        }

    })
    .catch((err) => {
        //Set result - Update performing error:
        result = {
            'success' : false,
            'message' : currentLang.db.update_error + ' ' + err
        };
    });

    //Return result:
    return result;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// ADD SIGN TO REPORT:
//--------------------------------------------------------------------------------------------------------------------//
async function addSignatureToReport(reportData, signature_id, req, res){
    //Import reports Schema:
    const reports = require('./reports/schemas');

    //Get saved signatures:
    let medical_signatures = [...reportData.medical_signatures];

    //Add current signature to saved signatures:
    medical_signatures.push(signature_id);
    
    //Set update data:
    const updateData = { $set: { 'medical_signatures': medical_signatures }};

    //Update medical signatures in report:
    await reports.Model.findOneAndUpdate({ _id: reportData._id }, updateData, { new: true })
    .then(async (data) => {
        //Set log element:
        const element = {
            type    : 'reports',
            _id     : data._id
        };

        //Save registry in Log DB:
        await insertLog(req, res, 5, element);

        //Send DEBUG Message:
        mainServices.sendConsoleMessage('DEBUG', '\ninsert [sign report]: ' + JSON.stringify({ report_id: reportData._id, user_id: signature_id }));
    })
    .catch((err) => {
        //Send ERROR Message:
        mainServices.sendConsoleMessage('ERROR', '\ninsert [sign report]: Failed, ' + JSON.stringify({ report_id: reportData._id, user_id: signature_id }), err);
    });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// REMOVE ALL SIGNATURES FROM REPORT:
//--------------------------------------------------------------------------------------------------------------------//
async function removeAllSignaturesFromReport(reportData){
    //Import reports Schema:
    const reports       = require('./reports/schemas');
    const signatures    = require('./signatures/schemas');

    //Set update data:
    const updateData = { $set: { 'medical_signatures': [] }};

    //Update medical signatures in report:
    await reports.Model.findOneAndUpdate({ _id: reportData._id }, updateData, { new: true })
    .then(async (data) => {

        //Delete all referenced signatures:
        await signatures.Model.deleteMany({ _id: { '$in': reportData.medical_signatures }})
        .exec()
        .then((data) => {
            if(data) {
                //Send DEBUG Message:
                mainServices.sendConsoleMessage('DEBUG', '\nupdate [remove signatures from report]: ' + JSON.stringify({ report_id: reportData._id }));
            } else {
                //Send ERROR Message:
                mainServices.sendConsoleMessage('ERROR', '\ndelete [delete signature]: Failed, ' + JSON.stringify({ report_id: reportData._id }), currentLang.db.delete_id_no_results);
            }
        })
        .catch((err) => {
            //Send ERROR Message:
            mainServices.sendConsoleMessage('ERROR', '\ndelete [delete signature]: Failed, ' + JSON.stringify({ report_id: reportData._id }), err);
        });
        
    })
    .catch((err) => {
        //Send ERROR Message:
        mainServices.sendConsoleMessage('ERROR', '\nupdate [remove signatures from report]: Failed, ' + JSON.stringify({ report_id: reportData._id }), err);
    });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// CHECK SHA2 REPORT:
//--------------------------------------------------------------------------------------------------------------------//
async function checkSHA2Report(sha2_report, medical_signatures){
    //Import signatures Schema:
    const signatures = require('./signatures/schemas');

    //Initializate result:
    let result = { success: true };

    //Find signatures by _id:
    await signatures.Model.find({ _id: { '$in': medical_signatures }})
    .exec()
    .then(async (signaturesData) => {
        //Check if have results:
        if(signaturesData){
            //Check found signatures (await foreach):
            await Promise.all(Object.keys(signaturesData).map((key) => {
                //Check sha2:
                if(signaturesData[key].sha2 !== sha2_report){
                    result = {
                        success: false,
                        message: 'No coincide el hash de integridad (SHA-2) de al menos una de las firmas.'
                    };
                }
            }));
            
        } else {
            //No data (empty result):
            result = {
                success: false,
                message: 'No se hallaron las firmas referenciadas al informe.'
            };
        }
    })
    .catch((err) => {
        //Send DB error:
        result = {
            success: false,
            message: 'Error durante la consulta a la base de datos: ' + err
        };
    });

    //Return result:
    return result;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET SHA2 REPORT:
//--------------------------------------------------------------------------------------------------------------------//
async function setSHA2Report(report_id){
    //Import reports Schema:
    const reports = require('./reports/schemas');

    //Initializate result:
    let result = { success: false, message: undefined };

    //Find referenced report:
    await reports.Model.findById(report_id)
    .exec()
    .then(async (reportData) => {
        //Check if have results:
        if(reportData){
            //Create compare report:
            //Remove medical_signatures and updatedAt from report to enable multiple signatures.
            //Also remove fk_pathologies because can be added in the future.
            const compare_report = {
                fk_performing           : reportData.fk_performing,
                clinical_info           : reportData.clinical_info,
                procedure_description   : reportData.procedure_description,
                findings                : reportData.findings,
                summary                 : reportData.summary,
                createdAt               : reportData.createdAt
            };

            //Generate SHA-2
            const sha2_report = await SHA256(compare_report).toString();

            //Set result:
            result = { success: true, sha2: sha2_report, report_data: reportData };

        } else {
            //No data (empty result):
            result = { success: false, message: currentLang.ris.wrong_report_id };
        }
    })
    .catch((err) => {
        //Query db error:
        result = { success: false, message: currentLang.db.query_error + ' - ' + err};
    });

    //Return result:
    return result;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET BASE64 FILE:
//--------------------------------------------------------------------------------------------------------------------//
async function setBase64Files(req, operation){
    //Check filenames:
    if(req.filenames !== undefined){
        //Encode files to base64 (await foreach):
        await Promise.all(Object.keys(req.filenames).map(async (key) => {
            //Encode current file to base64:
            const fileBase64 = await fs.readFile('uploads/' + req.filenames[key].filename, { encoding: 'base64' }, (error) => {
                if(error){
                    //Send ERROR Message:
                    sendConsoleMessage('ERROR', error);
                    throw('Error: ' + error);
                }
            });

            //Set the base64 files in the request (req.body fields):
            switch(req.filenames[key].fieldname){
                //Files from file module (insert only):
                case 'uploaded_file':
                    req.body.base64 = fileBase64;
                    break;

                //Organization or branch logos:
                case 'uploaded_logo':
                    //Set base64 in request by operation:
                    switch(operation){
                        case 'insert':
                            req.body.base64_logo = fileBase64;
                            break;
                        case 'update':
                            if(req.validatedResult.set === false){ req.validatedResult.set = {} };
                            req.validatedResult.set['base64_logo'] = fileBase64;
                            break;
                    }
                    break;

                //Organization certificate:
                case 'uploaded_cert':
                    //Set base64 in request by operation:
                    switch(operation){
                        case 'insert':
                            req.body.base64_cert = fileBase64;
                            break;
                        case 'update':
                            if(req.validatedResult.set === false){ req.validatedResult.set = {} };
                            req.validatedResult.set['base64_cert'] = fileBase64;
                            break;
                    }
                    break;
            }
        }));

        //Remove temp file from uploads:
        await Promise.all(Object.keys(req.filenames).map(async (key) => {
            await fs.unlink('uploads/' + req.filenames[key].filename, (error) => {
                if(error){
                    //Send ERROR Message:
                    sendConsoleMessage('ERROR', error);
                    throw('Error: ' + error);
                } else {
                    //Send DEBUG Message:
                    mainServices.sendConsoleMessage('DEBUG', currentLang.db.delete_temp_file_uploads);
                }
            });
        }));
    }
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET FLOW STATE:
//--------------------------------------------------------------------------------------------------------------------//
async function setFlowState(_id, flow_sate, schemaName){
    //Import current Schema:
    const currentSchema = require('./' + schemaName + '/schemas');

    //Initializate operation_result:
    let operation_result = undefined;

    //Save data into DB:
    await currentSchema.Model.findOneAndUpdate({ _id: _id }, { flow_state: flow_sate }, { new: true })
    .then(async (data) => {
        operation_result = 'success';
    })
    .catch((err) => {
        operation_result = err;
    });

    return operation_result;
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
    batchDelete,
    findAggregation,
    isDuplicated,
    checkSlot,
    checkUrgency,
    checkPerson,
    checkSignature,
    checkPathology,
    adjustDataTypes,
    ckeckElement,
    insertLog,
    setElemMatch,
    setAndOr,
    setRegex,
    setIn,
    setAll,
    setCondition,
    setGroup,
    domainIs,
    addDomainCondition,
    checkObjectId,
    validatePermissions,
    setStudyIUID,
    setIDIssuer,
    getCompleteDomain,
    isPET,
    setPerformingDate,
    reportsSaveController,
    addSignatureToReport,
    removeAllSignaturesFromReport,
    checkSHA2Report,
    setSHA2Report,
    setBase64Files,
    setFlowState,
    setPerformingFS
};
//--------------------------------------------------------------------------------------------------------------------//