//--------------------------------------------------------------------------------------------------------------------//
// MODULES SERVICES:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const mongoose              = require('mongoose');                          //Mongoose.
const ObjectId              = require('mongoose').Types.ObjectId;           //To check ObjectId Type.
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
    let { filter, proj, sort, pager, regex } = req.query;

    //Set condition:
    let condition = await setCondition(filter);

    //Set regex:
    condition = await setRegex(regex, condition);

    //Set in:
    condition = await setIn(filter, condition);

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
            await currentSchema.Model.find(condition, formatted_proj).skip(req.query.skip).limit(req.query.limit).sort(sort)
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
    let { filter, proj, sort, regex } = req.query;

    //Set condition:
    let condition = await setCondition(filter);

    //Set regex:
    condition = await setRegex(regex, condition);

    //Set in:
    condition = await setIn(filter, condition);

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
async function insert(req, res, currentSchema, referencedElements = false){
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
                //Send successfully response:
                res.status(200).send({ success: true, message: currentLang.db.insert_success, data: data });
            })
            .catch((err) => {
                //Send error:
                mainServices.sendError(res, currentLang.db.insert_error, err);
            });
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
            mainServices.sendConsoleMessage('DEBUG', '\nupdate [processed data]: ' + JSON.stringify({ _id: req.body._id }, updateObj));

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
async function _delete(req, res, currentSchema){
    //Validate ID request:
    if(!mainServices.validateRequestID(req.body._id, res)) return;    

    //Check references of the element you want to delete:
    const result = await checkReferences(req.body._id, currentSchema.Model.modelName, currentSchema.ForeignKeys, res);

    //Check References Result:
    if(result){
        //Deletion rejected for dependencies:
        res.status(405).send({ success: false, message: currentLang.db.delete_rejected_dep, dependencies: result });
    } else {
        //Delete element:
        await currentSchema.Model.findOneAndDelete({ _id: req.body._id })
        .exec()
        .then((data) => {
            if(data) {
                //Send DEBUG Message:
                mainServices.sendConsoleMessage('DEBUG', '\ndelete [deleted document]: ' + JSON.stringify({ _id: req.body._id }));

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
// SET CONDITION:
//--------------------------------------------------------------------------------------------------------------------//
async function setCondition(filter){
    //Initialize main condition:
    let condition = {};

    //Check filter:
    if(filter){
        //Initialize conditions:
        let and_condition = false;
        let or_condition = false;

        //Set AND Condition:
        if(filter.and){
            //Create condition filter:
            and_condition = { $and: [] };

            //Build filter with contition type (await foreach):
            await Promise.all(Object.keys(filter.and).map((key) => {
                and_condition.$and.push({ [key]: filter.and[key] });
            }));
        }

        //Set OR Condition:
        if(filter.or){
            //Create condition filter:
            or_condition = { $or: [] };

            //Build filter with contition type (await foreach):
            await Promise.all(Object.keys(filter.or).map((key) => {
                or_condition.$or.push({ [key]: filter.or[key] });
            }));
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

                    //Exclude boolean, ObjectId and Date types [Date by KeyName]:
                    if(currentValue !== 'true' && currentValue !== true && currentValue !== 'false' && currentValue !== false  && checkObjectId(currentValue) === false && keyName !== 'start' && keyName !== 'end'){
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
                            
                            //Exclude boolean, ObjectId and Date types [Date by KeyName]:
                            if(currentValue !== 'true' && currentValue !== true && currentValue !== 'false' && currentValue !== false && checkObjectId(currentValue) === false && keyName !== 'start' && keyName !== 'end'){
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
                            
                            //Exclude boolean, ObjectId and Date types [Date by KeyName]:
                            if(currentValue !== 'true' && currentValue !== true && currentValue !== 'false' && currentValue !== false && checkObjectId(currentValue) === false && keyName !== 'start' && keyName !== 'end'){
                                condition.$and[and_index].$and[second_and_index][keyName] = { $regex: `${currentValue}`, $options: 'i' };
                            }
                        }));
                    }

                    //AND Only:
                    if(and_current.$and == undefined && and_current.$or == undefined){
                        keyName = Object.keys(and_current)[0];
                        currentValue = condition.$and[and_index][keyName];

                        //Exclude boolean, ObjectId and Date types [Date by KeyName]:
                        if(currentValue !== 'true' && currentValue !== true && currentValue !== 'false' && currentValue !== false && checkObjectId(currentValue) === false && keyName !== 'start' && keyName !== 'end'){
                            condition.$and[and_index][keyName] = { $regex: `${currentValue}`, $options: 'i' };
                        }
                    }
                }));

            //Filter without condition (current = name_value):
            } else {
                keyName = Object.keys(condition)[index];
                currentValue = condition[current];
                
                //Exclude boolean, ObjectId and Date types [Date by KeyName]:
                if(currentValue !== 'true' && currentValue !== true && currentValue !== 'false' && currentValue !== false && checkObjectId(currentValue) === false  && keyName !== 'start' && keyName !== 'end'){
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
// CHECK ELEMENT:
//--------------------------------------------------------------------------------------------------------------------//
async function ckeckElement(_id, schemaName, res){
    //Import current Schema:
    const currentSchema = require('./' + schemaName + '/schemas');

    //Initialize result:
    let result = false;

    //Check _id is not empty:
    if(_id){
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
        case 'people':
            affectedCollections.push('users');
            break;
        case 'organizations':
            affectedCollections.push('branches');
            break;
        case 'branches':
            affectedCollections.push('services');
            break;
        case 'services':
            affectedCollections.push('slots');
            break;
        case 'modalities':
            affectedCollections.push('services');
            affectedCollections.push('equipments');
            break;
        case 'equipments':
            affectedCollections.push('services');
            break;
        case 'slots':
            //Set dependencies
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
async function isDuplicated(req, res, currentSchema, value, fieldName){
    //Initialize result:
    result = false;

    //Set filter:
    let filter = {}
    filter[fieldName] = value;

    await currentSchema.Model.findOne(filter, { _id: 1 })
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
                    res.status(200).send({ success: false, message: currentLang.db.insert_duplicate + data._id });
                }

            //UPDATE
            } else {
                if(data._id != req.body._id){
                    //Set result (duplicated):
                    result = true;

                    //Send duplicate message:
                    res.status(200).send({ success: false, message: currentLang.db.update_duplicate + data._id });
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
                if(filter[asPrefix + 'birth_date'] != undefined){ filter[asPrefix + 'birth_date'] = new Date(filter[asPrefix + 'birth_date']); }
                if(filter[asPrefix + 'phone_numbers'] != undefined){ filter[asPrefix + 'phone_numbers'] = filter[asPrefix + 'phone_numbers'][0] = parseInt(filter[asPrefix + 'phone_numbers'], 10); }
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
                if(filter[asPrefix + 'fk_procedures'] != undefined){ filter[asPrefix + 'fk_procedures'] = filter[asPrefix + 'fk_procedures'][0] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_procedures']); }
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
                if(filter[asPrefix + 'start'] != undefined){ filter[asPrefix + 'start'] = new Date(filter[asPrefix + 'start']); }
                if(filter[asPrefix + 'end'] != undefined){ filter[asPrefix + 'end'] = new Date(filter[asPrefix + 'end']); }
                if(filter[asPrefix + 'urgency'] != undefined){ filter[asPrefix + 'urgency'] = mainServices.stringToBoolean(filter[asPrefix + 'urgency']); };
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

    //Condition with IN operator:
    if(filter.in){
        //Check if there is more than one property with the in operator:
        if(Object.keys(filter.in).length == 1){
            //Get key name:
            const keyName = Object.keys(filter.in)[0];

            //Loop through values inside the IN array:
            Object.keys(filter.in[keyName]).forEach(async (current) => {
                //Create tmp_filter (clean on each iteration):
                let tmp_filter = {};
                tmp_filter[keyName] = filter.in[keyName][current];

                //Adjust Data Type (individual element [IN Array]):
                let callback_return = await callback(tmp_filter);
                
                //Assign adjusted value on original object:
                filter.in[keyName][current] = callback_return[keyName]
            });
        } else {
            //Build IN condition with multiple keys (await foreach):
            await Promise.all(Object.keys(filter.in).map(async (keyName, index) => {

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
function addDomainCondition(req, res, domainType){
    //Get information for the request:
    let filter = req.query.filter;
    const domain = req.decoded.session.domain;
    const schema = req.baseUrl.slice(1);   //Slice to remove '/' (first character).
    const method = req.path.slice(1);      //Slice to remove '/' (first character).

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

                        //Add domain condition:
                        req.query.filter.and['_id'] = domain;
                    } else {
                        //Add domain condition:
                        req.query.filter['_id'] = domain;
                    }
                    //BRANCH AND SERVICE should not be accessed here due to role control.

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
                        }
                        //SERVICE you should not access here because of role control.

                    } else {
                        //Switch by domain type: 
                        if(domainType == 'organizations'){
                            //Add domain condition:
                            req.query.filter['fk_organization'] = domain;
                        
                        } else if(domainType == 'branches'){
                            //Add domain condition:
                            req.query.filter['_id'] = domain;
                        }
                        //SERVICE you should not access here because of role control.
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

                        } else if(domainType == 'branches'){
                            //Add domain condition:
                            req.query.filter.and['fk_branch'] = domain;
                        
                        }
                        //SERVICE you should not access here because of role control.
                    } else {
                        //Switch by domain type: 
                        if(domainType == 'organizations'){
                            //Add domain condition:
                            req.query.filter['branch.fk_organization'] = domain;

                        } else if(domainType == 'branches'){
                            //Add domain condition:
                            req.query.filter['fk_branch'] = domain;
                        
                        }
                        //SERVICE you should not access here because of role control.
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

            }
            break;

        //------------------------------------------------------------------------------------------------------------//
        // INSERT & UPDATE:
        //------------------------------------------------------------------------------------------------------------//
        case 'insert':
        case 'update':
            //Set restrictions according to schema:
            switch(schema){
                case 'branches':
                    if(domainType == 'organizations' && req.body.fk_organization !== domain){
                        return false; /* Operation rejected */  
                    }
                    break;
                
                case 'services':
                    if( (domainType == 'organizations' && checkDomainReference(res, 'branches', { fk_organization: domain }) == false) ||
                        (domainType == 'branches' && req.body.fk_branch !== domain) )
                    { return false; /* Operation rejected */ }
                    break;    

                case 'slots':
                    if(domainType == 'organizations' && req.body.domain.organization !== domain && checkDomainReference(res, 'organizations', { 'domain.organization': domain }) == false){
                        return false; /* Operation rejected */
                    } else if(domainType == 'branches' && req.body.domain.branch !== domain && checkDomainReference(res, 'branches', { 'domain.branch': domain }) == false){
                        return false; /* Operation rejected */
                    } else if(domainType == 'services' && req.body.domain.service !== domain && checkDomainReference(res, 'services', { 'domain.service': domain }) == false){
                        return false; /* Operation rejected */
                    }
                    break;
            }
            // Inserts y updates ¿controlar contra el dominio a nivel del handler?
            break;

        //------------------------------------------------------------------------------------------------------------//
        // DELETE:
        //------------------------------------------------------------------------------------------------------------//
        // Restricted by roles (Superuser is only user allowed).
        //------------------------------------------------------------------------------------------------------------//
    }

    //Operation allowed:
    return true;
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
// CHECK DOMAIN REFERENCE:
//--------------------------------------------------------------------------------------------------------------------//
async function checkDomainReference(res, schemaName, filter){
    //Import current Schema:
    const currentSchema = require('./' + schemaName + '/schemas');

    //Initialize result:
    let result = false;

    //Check filter is not empty:
    if(filter){
        //Execute check query:
        await currentSchema.Model.findOne(filter, { _id: 1 })
        .exec()
        .then((data) => {
            //Check if have results:
            if(data){
                //Set result true:
                result = true;
            } else {
                //Send not valid referenced object mensaje:
                res.status(405).send({ success: false, message: 'Operación NO permitida, el dominio indicado desde el JWT NO permite la operación deseada.' });
            }
        })
        .catch((err) => {
            //Send error:
            mainServices.sendError(res, currentLang.db.query_error, err);
        });
    } else {
        //Send error:
        mainServices.sendError(res, 'Para chequear una referencia de dominio, el parametro filter NO puede ser vacío.');
    }

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
    findAggregation,
    isDuplicated,
    adjustDataTypes,
    ckeckElement,
    insertLog,
    setCondition,
    setRegex,
    setIn,
    domainIs,
    addDomainCondition
};
//--------------------------------------------------------------------------------------------------------------------//