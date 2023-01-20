//--------------------------------------------------------------------------------------------------------------------//
// MODULES SERVICES:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const mongoose              = require('mongoose');                          // Mongoose
const moment                = require('moment');                            // Moment
const ObjectId              = require('mongoose').Types.ObjectId;           // To check ObjectId Type
const { validationResult }  = require('express-validator');                 // Express-validator Middleware

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
async function insert(req, res, currentSchema, referencedElements = false, successResponse = true){
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
                //Check if you want successful http response (false to batch inserts):
                if(successResponse){
                    //Send successfully response:
                    res.status(200).send({ success: true, message: currentLang.db.insert_success, data: data });

                    //Set header sent property to check if header have already been sent:
                    res.headerSent = true;
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
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// UPDATE:
// Validate against the current model and if positive, updates an existing record in the database according to the
// ID and specified parameters.
//--------------------------------------------------------------------------------------------------------------------//
async function update(req, res, currentSchema, referencedElements = false){
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

                    //Send successfully response:
                    res.status(200).send({
                        success: true,
                        data: data,
                        blocked_attributes: req.validatedResult.blocked,
                        blocked_unset: req.validatedResult.blocked_unset
                    });
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
async function _delete(req, res, currentSchema, successResponse = true){
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
        .then((data) => {
            if(data) {
                //Send DEBUG Message:
                mainServices.sendConsoleMessage('DEBUG', '\ndelete [deleted document]: ' + JSON.stringify({ _id: req.body._id }));

                //Check if you want successful http response (false to batch delete):
                if(successResponse){
                    //Send successfully response:
                    res.status(200).send({ success: true, message: currentLang.db.delete_success, data: data });

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
async function findAggregation(req, res, currentSchema){
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
                if(key !== 'and' && key !== '$and' && key !== 'or' && key !== '$or' && key !== 'in' && key !== '$in'){
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

                    //Exclude boolean, ObjectId and Date types [Date by KeyName] and explicit nested operators ($and, $or, $elemMatch):
                    if(currentValue !== 'true' && currentValue !== true && currentValue !== 'false' && currentValue !== false  && checkObjectId(currentValue) === false && keyName !== 'date' && keyName !== 'start' && keyName !== 'end' && currentValue['$elemMatch'] == undefined && keyName !== '$and' && keyName !== '$or'){
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
                            
                            //Exclude boolean, ObjectId and Date types [Date by KeyName] and explicit nested operators ($and, $or, $elemMatch):
                            if(currentValue !== 'true' && currentValue !== true && currentValue !== 'false' && currentValue !== false && checkObjectId(currentValue) === false && keyName !== 'date' && keyName !== 'start' && keyName !== 'end' && currentValue['$elemMatch'] == undefined && keyName !== '$and' && keyName !== '$or'){
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
                            
                            //Exclude boolean, ObjectId and Date types [Date by KeyName] and explicit nested operators ($and, $or, $elemMatch):
                            if(currentValue !== 'true' && currentValue !== true && currentValue !== 'false' && currentValue !== false && checkObjectId(currentValue) === false && keyName !== 'date' && keyName !== 'start' && keyName !== 'end' && currentValue['$elemMatch'] == undefined && keyName !== '$and' && keyName !== '$or'){
                                condition.$and[and_index].$and[second_and_index][keyName] = { $regex: `${currentValue}`, $options: 'i' };
                            }
                        }));
                    }

                    //AND Only:
                    if(and_current.$and == undefined && and_current.$or == undefined){
                        keyName = Object.keys(and_current)[0];
                        currentValue = condition.$and[and_index][keyName];

                        //Exclude boolean, ObjectId and Date types [Date by KeyName] and explicit nested operators ($and, $or, $elemMatch):
                        if(currentValue !== 'true' && currentValue !== true && currentValue !== 'false' && currentValue !== false && checkObjectId(currentValue) === false && keyName !== 'date' && keyName !== 'start' && keyName !== 'end' && currentValue['$elemMatch'] == undefined && keyName !== '$and' && keyName !== '$or'){
                            condition.$and[and_index][keyName] = { $regex: `${currentValue}`, $options: 'i' };
                        }
                    }
                }));

            //IN:
            } else if(current == 'in'){
                // Do nothing to exclude IN condition elements (No regex into IN operator).

            //Filter without condition (current = name_value):
            } else {
                keyName = Object.keys(condition)[index];
                currentValue = condition[current];
                
                //Exclude boolean, ObjectId and Date types [Date by KeyName] and explicit nested operators ($and, $or, $elemMatch):
                if(currentValue !== 'true' && currentValue !== true && currentValue !== 'false' && currentValue !== false && checkObjectId(currentValue) === false && keyName !== 'date'  && keyName !== 'start' && keyName !== 'end' && currentValue['$elemMatch'] == undefined && keyName !== '$and' && keyName !== '$or'){
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

            //Remove original in from condition object:
            delete condition.in;

            //Check if oroginal condition have operators (AND | OR):
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
            //affectedCollections.push('signatures');

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
            //affectedCollections.push('pathologies');
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
            //affectedCollections.push('procedure_templates');
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
            //affectedCollections.push('reports');
            //affectedCollections.push('procedure_templates');
            break;

        case 'appointments':
            affectedCollections.push('performing');
            break;

        case 'files':
            affectedCollections.push('appointments');
            break;

        case 'pathologies':
            //affectedCollections.push('reports');
            break;

        case 'performing':
            //affectedCollections.push('reports');
            break;

        case 'reports':
            //Nothing at the moment.
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
                //Check if have results:
                if(data){
                    //Set result (duplicated):
                    result = true;

                    //Set message:
                    if(message === '' || message === undefined || message === null){
                        message = currentLang.db.insert_duplicate;
                    }

                    //Send duplicate message:
                    res.status(422).send({ success: false, message: message + data._id });
                }

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
        
        //Add one minute to start and subtract one minute to end to allow (Allow minimal overlap):
        let addedMinuteStart = new Date(dateStart.setMinutes(dateStart.getMinutes() + 1));
        let removedMinuteEnd = new Date(dateEnd.setMinutes(dateEnd.getMinutes() - 1));

        //Format dates:
        const formattedDates = mainServices.datetimeFulCalendarFormater(addedMinuteStart, removedMinuteEnd);

        //Set params:
        const params = { "$and" : [
            { "fk_slot" : req.body.fk_slot },
            { "$or" : [
                { "start" : {
                    "$gte" : formattedDates.start + '.000Z',
                    "$lte" : formattedDates.end + '.000Z'
                }},
                { "end" : {
                    "$gte" : formattedDates.start + '.000Z',
                    "$lte" : formattedDates.end + '.000Z'
                }}
            ]}
        ]};

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
                console.log(req.body.documents[current]);
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
                if(filter[asPrefix + 'informed_consent'] != undefined){ filter[asPrefix + 'informed_consent'] = mainServices.stringToBoolean(filter[asPrefix + 'informed_consent']); };
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
                if(filter[asPrefix + 'private_health.weight'] != undefined){ filter[asPrefix + 'private_health.weight'] = parseInt(filter[asPrefix + 'private_health.weight'], 10); }
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

                return filter;
            });
            break;

            case 'appointments_drafts':
                filter = adjustCondition(filter, (filter) => {
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
                if(filter[asPrefix + 'injection.administration_time'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'injection.administration_time'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'injection.administration_time'][explicitOperator] = new Date(filter[asPrefix + 'injection.administration_time'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'injection.administration_time'] = new Date(filter[asPrefix + 'injection.administration_time']);
                        }
                    });
                }

                //Injection technician - Post aggregate lookup:
                if(filter[asPrefix + 'injection.injection_technician._id'] != undefined){ filter[asPrefix + 'injection.injection_technician._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'injection.injection_technician._id']); };
                if(filter[asPrefix + 'injection.injection_technician.status'] != undefined){ filter[asPrefix + 'injection.injection_technician.status'] = mainServices.stringToBoolean(filter[asPrefix + 'injection.injection_technician.status']); };
                if(filter[asPrefix + 'injection.injection_technician.person._id'] != undefined){ filter[asPrefix + 'injection.injection_technician.person._id'] = mongoose.Types.ObjectId(filter[asPrefix + 'injection.injection_technician.person._id']); };
                if(filter[asPrefix + 'injection.injection_technician.person.documents.doc_type'] != undefined){ filter[asPrefix + 'injection.injection_technician.person.documents.doc_type'] = parseInt(filter[asPrefix + 'injection.injection_technician.person.documents.doc_type'], 10); }
                if(filter[asPrefix + 'injection.injection_technician.person.gender'] != undefined){ filter[asPrefix + 'injection.injection_technician.person.gender'] = parseInt(filter[asPrefix + 'injection.injection_technician.person.gender'], 10); }
                if(filter[asPrefix + 'injection.injection_technician.person.phone_numbers'] != undefined){ filter[asPrefix + 'injection.injection_technician.person.phone_numbers'] = filter[asPrefix + 'injection.injection_technician.person.phone_numbers'][0] = parseInt(filter[asPrefix + 'injection.injection_technician.person.phone_numbers'], 10); }
                
                //Set allowed explicit operators:
                if(filter[asPrefix + 'injection.injection_technician.person.birth_date'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'injection.injection_technician.person.birth_date'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'injection.injection_technician.person.birth_date'][explicitOperator] = new Date(filter[asPrefix + 'injection.injection_technician.person.birth_date'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'injection.injection_technician.person.birth_date'] = new Date(filter[asPrefix + 'injection.injection_technician.person.birth_date']);
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
                if(filter[asPrefix + 'injection.pet_ct.syringe_activity_full'] != undefined){ filter[asPrefix + 'injection.pet_ct.syringe_activity_full'] = parseInt(filter[asPrefix + 'injection.pet_ct.syringe_activity_full'], 10); }
                if(filter[asPrefix + 'injection.pet_ct.syringe_activity_empty'] != undefined){ filter[asPrefix + 'injection.pet_ct.syringe_activity_empty'] = parseInt(filter[asPrefix + 'injection.pet_ct.syringe_activity_empty'], 10); }
                if(filter[asPrefix + 'injection.pet_ct.administred_activity'] != undefined){ filter[asPrefix + 'injection.pet_ct.administred_activity'] = parseInt(filter[asPrefix + 'injection.pet_ct.administred_activity'], 10); }
                if(filter[asPrefix + 'injection.pet_ct.syringe_full_time'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'injection.pet_ct.syringe_full_time'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'injection.pet_ct.syringe_full_time'][explicitOperator] = new Date(filter[asPrefix + 'injection.pet_ct.syringe_full_time'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'injection.pet_ct.syringe_full_time'] = new Date(filter[asPrefix + 'injection.pet_ct.syringe_full_time']);
                        }
                    });
                }

                //Set allowed explicit operators:
                if(filter[asPrefix + 'injection.pet_ct.syringe_empty_time'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'injection.pet_ct.syringe_empty_time'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'injection.pet_ct.syringe_empty_time'][explicitOperator] = new Date(filter[asPrefix + 'injection.pet_ct.syringe_empty_time'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'injection.pet_ct.syringe_empty_time'] = new Date(filter[asPrefix + 'injection.pet_ct.syringe_empty_time']);
                        }
                    });
                }

                //Acquisition:
                if(filter[asPrefix + 'acquisition.console_technician'] != undefined){ filter[asPrefix + 'acquisition.console_technician'] = mongoose.Types.ObjectId(filter[asPrefix + 'acquisition.console_technician']); };
                if(filter[asPrefix + 'acquisition.time'] != undefined){
                    setExplicitOperator(filter[asPrefix + 'acquisition.time'], (explicitOperator) => {
                        if(explicitOperator){
                            filter[asPrefix + 'acquisition.time'][explicitOperator] = new Date(filter[asPrefix + 'acquisition.time'][explicitOperator]);
                        } else {
                            filter[asPrefix + 'acquisition.time'] = new Date(filter[asPrefix + 'acquisition.time']);
                        }
                    });
                }

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

    //Condition without operator (Filter only):
    final_filter = callback(filter);

    //Return adjusted condition:
    return final_filter;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// INSERT LOG:
//--------------------------------------------------------------------------------------------------------------------//
async function insertLog(event, datetime, fk_user, req, res){
    //Import schemas:
    const logs = require('./logs/schemas');

    //Initializate result:
    let result = false;

    //Create log object:
    const logObj = {
        event: event,
        datetime: datetime,
        fk_user: mongoose.Types.ObjectId(fk_user),
        ip_client: mainServices.getIPClient(req)
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
            // FIND, FIND BY ID, FIND ONE:
            //------------------------------------------------------------------------------------------------------------//
            case 'find':
            case 'findOne':
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
                        //Initializate composite domain objects:
                        let imaging = {};
                        let referring = {};
                        let fk_referring = {};
                        let reporting = {};
                        let fk_reporting = {};

                        //Create filter and first explicit $AND operator (if not exist):
                        if(!filter){ req.query.filter = {}; }
                        req.query.filter['$and'] = [];

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

            //Create Study IUID:
            const study_iuid = '2.16.' + country_code + '.2.' + structure_id + '.72769.' + timestamp + suffix;

            //Check study IUID with regex:
            if(regexStudyIUD.test(study_iuid)){
                //Set study_iuid in the request:
                req.body['study_iuid'] = study_iuid;

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
    adjustDataTypes,
    ckeckElement,
    insertLog,
    setElemMatch,
    setAndOr,
    setRegex,
    setIn,
    setCondition,
    domainIs,
    addDomainCondition,
    validatePermissions,
    setStudyIUID,
    getCompleteDomain,
    isPET
};
//--------------------------------------------------------------------------------------------------------------------//