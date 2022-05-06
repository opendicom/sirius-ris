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
        } else {
            //Send not valid referenced object mensaje:
            res.status(405).send({ success: false, message: currentLang.db.not_valid_fk });
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
            //Send not valid referenced object mensaje:
            res.status(405).send({ success: false, message: currentLang.db.not_valid_fk });
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
// CHECK ELEMENT:
//--------------------------------------------------------------------------------------------------------------------//
async function ckeckElement(_id, schemaName, res){
    //Import current Schema:
    const currentSchema = require('./' + schemaName + '/schemas');

    //Initialize result:
    let result = false;

    //Execute check query:
    await currentSchema.Model.findById(_id, { _id: 1 })
    .exec()
    .then((data) => {
        //Check if have results:
        if(data){
            //Set result true:
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
            //Set dependencies
            break;
        case 'modalities':
            affectedCollections.push('services');
            affectedCollections.push('equipments');
            break;
        case 'equipments':
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
            if(filter[asPrefix + 'fk_person'] != undefined){ filter[asPrefix + 'fk_person'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_person']); };
            if(filter[asPrefix + 'permissions.organization'] != undefined){ filter[asPrefix + 'permissions.organization'] = mongoose.Types.ObjectId(filter[asPrefix + 'permissions.organization']); }
            if(filter[asPrefix + 'permissions.branch'] != undefined){ filter[asPrefix + 'permissions.branch'] = mongoose.Types.ObjectId(filter[asPrefix + 'permissions.branch']); }
            if(filter[asPrefix + 'permissions.service'] != undefined){ filter[asPrefix + 'permissions.service'] = mongoose.Types.ObjectId(filter[asPrefix + 'permissions.service']); }
            if(filter[asPrefix + 'permissions.role'] != undefined){ filter[asPrefix + 'permissions.role'] = parseInt(filter['permissions.role'], 10); }
            if(filter[asPrefix + 'permissions.concession'] != undefined){ filter[asPrefix + 'permissions.concession'] = filter[asPrefix + 'permissions.concession'][0] = parseInt(filter[asPrefix + 'permissions.concession'], 10); }
            if(filter[asPrefix + 'settings.viewer'] != undefined){ filter[asPrefix + 'settings.viewer'] = parseInt(filter[asPrefix + 'settings.viewer'], 10); }
            if(filter[asPrefix + 'settings.theme'] != undefined){ filter[asPrefix + 'settings.theme'] = parseInt(filter[asPrefix + 'settings.theme'], 10); }
            if(filter[asPrefix + 'status'] != undefined){ filter[asPrefix + 'status'] = mainServices.stringToBoolean(filter[asPrefix + 'status']); };
            break;

        case 'people':
            if(filter[asPrefix + 'documents.doc_type'] != undefined){ filter[asPrefix + 'documents.doc_type'] = parseInt(filter[asPrefix + 'documents.doc_type'], 10); }
            if(filter[asPrefix + 'gender'] != undefined){ filter[asPrefix + 'gender'] = parseInt(filter[asPrefix + 'gender'], 10); }
            if(filter[asPrefix + 'birth_date'] != undefined){ filter[asPrefix + 'birth_date'] = new Date(filter[asPrefix + 'birth_date']); }
            if(filter[asPrefix + 'phone_numbers'] != undefined){ filter[asPrefix + 'phone_numbers'] = filter[asPrefix + 'phone_numbers'][0] = parseInt(filter[asPrefix + 'phone_numbers'], 10); }
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

        case 'equipments':
            if(filter[asPrefix + 'fk_modalities'] != undefined){ filter[asPrefix + 'fk_modalities'] = filter[asPrefix + 'fk_modalities'][0] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_modalities']); }
            if(filter[asPrefix + 'fk_branch'] != undefined){ filter[asPrefix + 'fk_branch'] = mongoose.Types.ObjectId(filter[asPrefix + 'fk_branch']); };
            if(filter[asPrefix + 'status'] != undefined){ filter[asPrefix + 'status'] = mainServices.stringToBoolean(filter[asPrefix + 'status']); };
            break;
    }

    //Return adjusted filter:
    return filter;
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
    insertLog
};
//--------------------------------------------------------------------------------------------------------------------//