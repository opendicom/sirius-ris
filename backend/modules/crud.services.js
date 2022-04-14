//--------------------------------------------------------------------------------------------------------------------//
// GENERIC CRUD SERVICE:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const { validationResult } = require('express-validator');                  //Express-validator Middleware.

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
    let { filter, proj, skip, limit, sort, pager } = req.query;

    //Parse skip and limit value (string) to integer (base 10):
    skip = parseInt(skip, 10);
    limit = parseInt(limit, 10);

    //Validate and format data projection:
    const formatted_proj = mainServices.validateFormattedProj(proj);

    //Check if Pager was requested:
    if(pager){
        //Parse page_number and page_limit value (string) to integer (base 10):
        pager.page_number = parseInt(pager.page_number, 10);
        pager.page_limit = parseInt(pager.page_limit, 10);

        //If dosn't exist, set page number:
        if(!pager.page_number){
            pager.page_number = 1;
        }

        //Set page limit and and replace limit param:
        if(pager.page_limit){
            limit = pager.page_limit;
        } else {
            //Set default page limit value:
            limit = 10;
        }

        //Calculate and replace skip value (Paginate):
        skip = (pager.page_number-1)*limit;
    }

    //Count using query params:
    await currentSchema.Model.countDocuments(filter)
    .exec()
    .then(async (count) => {
        //Check result count:
        if(count > 0){
            //Excecute main query:
            await currentSchema.Model.find(filter, formatted_proj).skip(skip).limit(limit).sort(sort)
            .exec()
            .then((data) => {
                //Check if have results:
                if(data){ 
                    //Validate and set paginator:
                    let pager_data;
                    if(pager){
                        pager_data = {
                            total_items: count,
                            items_per_page: limit,
                            viewed_items: data.length,
                            number_of_pages: Math.ceil(count / limit),
                            actual_page: pager.page_number
                        };
                    } else {
                        pager_data = 'Pager is disabled';
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
    const formatted_proj = mainServices.validateFormattedProj(proj);

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
    const formatted_proj = mainServices.validateFormattedProj(proj);
    
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
// Export CRUD service module:
//--------------------------------------------------------------------------------------------------------------------//
module.exports = {
    find,
    findById,
    findOne,
    insert,
    update,
    _delete
};
//--------------------------------------------------------------------------------------------------------------------//