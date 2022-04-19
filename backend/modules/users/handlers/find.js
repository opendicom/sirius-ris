//--------------------------------------------------------------------------------------------------------------------//
// FIND HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const mongoose  = require('mongoose');

//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Generic CRUD Service:
const genericCRUD = require('../../crud.services');

//Import schemas:
const users = require('../schemas');

module.exports = async (req, res) => {
    //Get query params:
    let filter = req.query.filter;

    //Add aggregate to request:
    req.query['aggregate'] = [
        //Branches lookup:
        { $lookup: {
            from: 'people',
            localField: 'fk_people',
            foreignField: '_id',
            as: 'people_data',
        }},
        
        //Unwind:
        { $unwind: { path: "$people_data", preserveNullAndEmptyArrays: true } },
    ];    

    //Correct data types for match operation:
    if(filter != undefined){
        //Users and people types values (Schema):
        if(filter.fk_people != undefined){ filter.fk_people = mongoose.Types.ObjectId(filter.fk_people) };
        if(filter.status != undefined){ filter.status = mainServices.stringToBoolean(filter.status) };

        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: filter });
    }

    //Excecute main query:
    await genericCRUD.findAggregation(req, res, users);
}
//--------------------------------------------------------------------------------------------------------------------//