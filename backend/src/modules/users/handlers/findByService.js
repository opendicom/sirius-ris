//--------------------------------------------------------------------------------------------------------------------//
// FIND BY SERVICE HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res, currentSchema) => {
    //Get query params:
    let { filter, regex, service, role } = req.query;

    //Check service and role properties:
    if(service && role){
        //Set allowed user roles numbers:
        const user_roles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        if(!isNaN(role) && user_roles.includes(parseInt(role, 10))){
            //Parse role to integer (base 10):
            role = parseInt(role, 10);

            //Check if service is a valid ObjectId:
            if(moduleServices.checkObjectId(service)){
                //Get complete domain:
                const completeDomain = await moduleServices.getCompleteDomain(service, 'services');

                //Add aggregate to request:
                req.query['aggregate'] = [];

                //Set group by:
                await moduleServices.setGroup(req);

                //Add schema pipe aggregation:
                req.query.aggregate.push(
                    //People lookup:
                    { $lookup: {
                        from: 'people',
                        localField: 'fk_person',
                        foreignField: '_id',
                        as: 'person',
                    }},
                    
                    //Unwind:
                    { $unwind: { path: "$person", preserveNullAndEmptyArrays: true } },

                    //------------------------------------------------------------------------------------------------//
                    // REMOVE DUPLICATED VALUES (SET DEFAULT PROJECTION):
                    // Important note: Request project replaces the aggregation projection.
                    // (This prevent mix content proj error).
                    //------------------------------------------------------------------------------------------------//
                    { $project: {
                        //Self:
                        'createdAt': 0,
                        'updatedAt': 0,
                        '__v': 0,

                        //Person:
                        'person.createdAt': 0,
                        'person.updatedAt': 0,
                        'person.__v': 0,
                    }}
                    //------------------------------------------------------------------------------------------------//
                ); 

                //Set findByServiceCondition:
                const findByServiceCondition = { '$or': [
                    //Organization:
                    {
                        "permissions": {
                            "$elemMatch": {
                                "role": role,
                                "organization": completeDomain.organization
                            }
                        }
                    },

                    //Branch:
                    {
                        "permissions": {
                            "$elemMatch": {
                                "role": role,
                                "branch": completeDomain.branch
                            }
                        }
                    },

                    //Service:
                    {
                        "permissions": {
                            "$elemMatch": {
                                "role": role,
                                "service": completeDomain.service
                            }
                        }
                    }
                ]};

                //Correct data types for match operation:
                if(filter != undefined){
                    //Adjust data types for match aggregation (Schema):
                    filter = await moduleServices.adjustDataTypes(filter, 'users');
                    filter = await moduleServices.adjustDataTypes(filter, 'people', 'person');
                    
                    //Set condition:
                    const condition = await moduleServices.setCondition(filter, regex);
                    
                    //------------------------------------------------------------------------------------------------//
                    // ADD USER TYPE AND SERVICE CONDITION:
                    //------------------------------------------------------------------------------------------------//
                    //Create AND explicit operator if not exist (Prevent: Cannot set properties of undefined):
                    if(!condition.$and){ condition.$and = {}; }

                    //Add OR explicit operator in AND explicit operator (Last condition):
                    condition.$and.push(findByServiceCondition);
                    //------------------------------------------------------------------------------------------------//

                    //Add match operation to aggregations:
                    req.query.aggregate.push({ $match: condition });
                } else {
                    //Add match operation to aggregations (Only findByService condition | without filters):
                    req.query.aggregate.push({ $match: findByServiceCondition });
                }

                //Excecute main query:
                await moduleServices.findAggregation(req, res, currentSchema);

            } else {
                //Return the result (HTML Response):
                res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.ris.validate.service_invalid_ObjectId });
            }
        } else {
            //Return the result (HTML Response):
            res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.ris.validate.role_NaN });
        }
    } else {
        //Bad request:
        res.status(400).send({ success: false, message: currentLang.http.bad_request });
    }
}
//--------------------------------------------------------------------------------------------------------------------//