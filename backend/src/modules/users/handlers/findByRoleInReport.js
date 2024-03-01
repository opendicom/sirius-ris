//--------------------------------------------------------------------------------------------------------------------//
// FIND BY ROLE IN REPORT HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res, currentSchema) => {
    //Get query params:
    let { filter, regex, role_in_report } = req.query;

    //Check role_in_report property:
    if(role_in_report){
        //Validate role in report value:
        if(role_in_report === 'signer' || role_in_report === 'authenticator'){
            //For both cases the Superuser and Supervisor role is allowed:
            const alowed_roles = [1, 3];

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

            //Initializate roleInReportCondition:
            let roleInReportCondition = undefined;

            //Switch by role:
            switch(role_in_report){
                case 'signer':
                    //Set role in report condition:
                    roleInReportCondition = { '$or': [
                        //Alowed roles:
                        { "permissions.role": { "$in": alowed_roles } },

                        //Allowed concessions:
                        { "permissions.concession": 7 }
                    ] };
                    break;

                case 'authenticator':
                    //Set role in report condition:
                    roleInReportCondition = { '$or': [
                        //Alowed roles:
                        { "permissions.role": { "$in": alowed_roles } },

                        //Allowed concessions:
                        { "permissions.concession": 8 }
                    ] };
                    break;
            }

            //Correct data types for match operation:
            if(filter != undefined){
                //Adjust data types for match aggregation (Schema):
                filter = await moduleServices.adjustDataTypes(filter, 'users');
                filter = await moduleServices.adjustDataTypes(filter, 'people', 'person');
                
                //Set condition:
                const condition = await moduleServices.setCondition(filter, regex);
                
                //------------------------------------------------------------------------------------------------//
                // ADD ROLE IN REPORT CONDITION:
                //------------------------------------------------------------------------------------------------//
                //Create AND explicit operator if not exist (Prevent: Cannot set properties of undefined):
                if(!condition.$and){ condition.$and = {}; }

                //Add OR explicit operator in AND explicit operator (Last condition):
                condition.$and.push(roleInReportCondition);
                //------------------------------------------------------------------------------------------------//

                //Add match operation to aggregations:
                req.query.aggregate.push({ $match: condition });
            } else {
                //Add match operation to aggregations (Only role in report condition | without filters):
                req.query.aggregate.push({ $match: roleInReportCondition });
            }

            //Excecute main query:
            await moduleServices.findAggregation(req, res, currentSchema);

        } else {
            //Return the result (HTML Response):
            res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.ris.validate.invalid_role_in_report });
        }
    } else {
        //Bad request:
        res.status(400).send({ success: false, message: currentLang.http.bad_request });
    }
}
//--------------------------------------------------------------------------------------------------------------------//