//--------------------------------------------------------------------------------------------------------------------//
// GENERIC CRUD SERVICE:
//--------------------------------------------------------------------------------------------------------------------//
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
    res.status(200).send({ success: true, message: 'findOne.' });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// INSERT:
// Creates a new record in the database.
//--------------------------------------------------------------------------------------------------------------------//
async function insert(req, res, currentSchema){
    res.status(200).send({ success: true, message: 'insert.' });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// UPDATE:
// Validate against the current model and if positive, updates an existing record in the database according to the
// ID and specified parameters.
//--------------------------------------------------------------------------------------------------------------------//
async function update(req, res, currentSchema){
    res.status(200).send({ success: true, message: 'update.' });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// DELETE:
// Delete an item from the database based on an ID (This method is reserved for developers).
//--------------------------------------------------------------------------------------------------------------------//
async function _delete(req, res, currentSchema){
    res.status(200).send({ success: true, message: 'delete.' });
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