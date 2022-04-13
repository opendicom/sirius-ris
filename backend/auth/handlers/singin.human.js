//--------------------------------------------------------------------------------------------------------------------//
// SINGIN HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const jwt = require('jsonwebtoken');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Import schemas:
const people        = require('../../modules/people/schemas');
const organizations = require('../../modules/organizations/schemas');
const branches      = require('../../modules/branches/schemas');
const services      = require('../../modules/services/schemas');

module.exports = async function (req, res){
    //Get query params:
    const { documents, password } = req.body;

    //Set doc_type format (Integer base 10):
    documents.doc_type = parseInt(documents.doc_type);

    //Create MongoDB arguments:
    const peopleMatch = { documents: documents };
    const peopleProj = {
        'name_01': 1,
        'surname_01': 1,
        'user_data._id': 1,
        'user_data.password': 1,
        'user_data.permissions': 1,
        'user_data.status': 1
    };

    //PEOPLE & USERS:
    //Execute query:
    await people.Model.aggregate([
        //Branches lookup:
        { $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'fk_people',
            as: 'user_data',
        }},

        //Unwind:
        { $unwind: '$user_data' },

        //Operations:
        { $match: peopleMatch },
        { $project: peopleProj },
    ])
    .exec()
    .then((peopleData) => {
        //Clarification: in aggregate doc it is an array:
        peopleData = peopleData[0];

        //Check if the person & user exists:
        if(peopleData){

            //Check user status:
            if(peopleData.user_data.status === true){
                        
                //Check user password:
                mainServices.verifyPass(peopleData.user_data.password, password)
                    .then((same) => {
                        //If Passwords match:
                        if(same){
                            //Set First time expiration:
                            const first_time_exp = '1m';

                            //Create payload:
                            const payload = {
                                sub: peopleData.user_data._id.toString(),   //Identify the subject of the token.
                                iat: (Date.now() / 1000),                   //Token creation date.
                                //exp: (Declared in expiresIn)              //Token expiration date.
                            }

                            //Create JWT (Temp):
                            jwt.sign(payload, mainSettings.AUTH_JWT_SECRET, { expiresIn: first_time_exp }, async (err, token) => {
                                if(err){
                                    res.status(500).send({ success: false, message: currentLang.jwt.sign_error, error: err });
                                    return;
                                }

                                //Set user & patient permissions:
                                let userPermissions = [];
                                let patientPermissions = {};

                                //Obtain permissions keys (await foreach):
                                await Promise.all(peopleData.user_data.permissions.map(async (value, key) => {
                                    //ORGANIZATIONS:
                                    //If contain organizations permissions:
                                    if (Object.keys(value).includes('organization')){
                                        //Create MongoDB arguments:
                                        const orgFilter = { _id: value['organization'] };
                                        const orgProj = { status: 1, short_name: 1 };

                                        //Execute query:
                                        await organizations.Model.findOne(orgFilter, orgProj)
                                        .exec()
                                        .then((orgData) => {
                                            //Check for results (not empty):
                                            if(orgData){
                                                //Convert Mongoose object to Javascript object:
                                                orgData = orgData.toObject();

                                                //Check values projected (strictCheck): 
                                                //mainServices.strictCheck(orgProj, orgData);

                                                //Check organization status:
                                                if(orgData.status == true){
                                                    //Add permission in array:
                                                    userPermissions[key] = {
                                                        domain: orgData._id,
                                                        description: orgData.short_name,
                                                        role: value['role']
                                                    };
                                                }
                                            }
                                        })
                                        .catch((err) => {
                                            //Send error:
                                            mainServices.sendError(res, currentLang.db.query_error, err);
                                        });

                                    //BRANCHES:
                                    //If contain branches permissions:
                                    } else if (Object.keys(value).includes('branch')){
                                        //Create MongoDB arguments:
                                        const branchMatch = { _id: value['branch'] };
                                        const branchProj = {
                                            'status': 1,
                                            'short_name': 1,
                                            'fk_organization': 1,
                                            'org_data._id': 1,
                                            'org_data.short_name': 1,
                                            'org_data.status': 1
                                        };

                                        //Execute query:
                                        await branches.Model.aggregate([
                                            //Branches lookup:
                                            { $lookup: {
                                                from: 'organizations',
                                                localField: 'fk_organization',
                                                foreignField: '_id',
                                                as: 'org_data',
                                            }},

                                            //Unwind:
                                            { $unwind: '$org_data' },

                                            //Operations:
                                            { $match: branchMatch },
                                            { $project: branchProj },
                                        ])
                                        .exec()
                                        .then((branchData) => {
                                            //Clarification: in aggregate doc it is an array:
                                            branchData = branchData[0];

                                            //Check branch and organization (parent) status:
                                            if(branchData.status == true && branchData.org_data.status == true){
                                                //Add permission in array:
                                                userPermissions[key] = {
                                                    domain: branchData._id,
                                                    description: branchData.org_data.short_name + ' - ' + branchData.short_name,
                                                    role: value['role']
                                                };
                                            }
                                        })
                                        .catch((err) => {
                                            //Send error:
                                            mainServices.sendError(res, currentLang.db.query_error, err);
                                        });

                                    //SERVICES:
                                    //If contain services permissions:
                                    } else if (Object.keys(value).includes('service')){
                                        //Create MongoDB arguments:
                                        const servMatch = { _id: value['service'] };
                                        const servProj = {
                                            'status': 1,
                                            'name': 1,
                                            'fk_branch': 1,
                                            'branch_data._id': 1,
                                            'branch_data.status': 1,
                                            'branch_data.short_name': 1,
                                            'branch_data.fk_organization': 1,
                                            'org_data._id': 1,
                                            'org_data.short_name': 1,
                                            'org_data.status': 1
                                        };

                                        //Execute query:
                                        await services.Model.aggregate([
                                            //Branches lookup:
                                            { $lookup: {
                                                from: 'branches',
                                                localField: 'fk_branch',
                                                foreignField: '_id',
                                                as: 'branch_data',
                                            }},

                                            //Organizations lookup:
                                            { $lookup: {
                                                from: 'organizations',
                                                localField: 'branch_data.fk_organization',
                                                foreignField: '_id',
                                                as: 'org_data',
                                            }},

                                            //Unwind:
                                            { $unwind: '$branch_data' },
                                            { $unwind: '$org_data' },

                                            //Operations:
                                            { $match: servMatch },
                                            { $project: servProj },
                                        ])
                                        .exec()
                                        .then((servData) => {
                                            //Clarification: in aggregate doc it is an array:
                                            servData = servData[0];

                                            //Check values projected (strictCheck): 
                                            //mainServices.strictCheck(servProj, servData);

                                            //Check service, branch (parent) and organization (parent) status:
                                            if(servData.status == true && servData.branch_data.status == true && servData.org_data.status == true){
                                                //Add permission in array:
                                                userPermissions[key] = {
                                                    domain: servData._id,
                                                    description: servData.org_data.short_name + ' - ' + servData.branch_data.short_name + ' - ' + servData.name,
                                                    role: value['role']
                                                };
                                            }
                                        })
                                        .catch((err) => {
                                            //Send error:
                                            mainServices.sendError(res, currentLang.db.query_error, err);
                                        });

                                    //PATIENTS:
                                    //If contain patient permissions:
                                    } else if (Object.keys(value).includes('patient')){
                                        //Set patient permissions:
                                        patientPermissions.is_patient = true;
                                        patientPermissions.people_in_charge = value.patient.people_in_charge;
                                    }
                                }));

                                //Set response data object:
                                const response_data = {
                                    people_id: peopleData._id,
                                    user_id: peopleData.user_data._id,
                                    name: peopleData.name_01,
                                    surname: peopleData.surname_01,
                                    permissions: userPermissions
                                }
    
                                //If contain patient permissions:
                                if(patientPermissions){
                                    response_data.patient_permissions = patientPermissions;
                                }
                                
                                //Send successfully response:
                                res.status(200).send({ success: true, data: response_data, token: token });
                            });
                        } else {
                            //Passwords don't match:
                            res.status(200).send({ success: false, message: currentLang.auth.password_dont_match });
                        }
                    })
                    .catch((err) => {
                        res.status(200).send({ success: false, message: currentLang.auth.password_error, error: err });
                    });
            } else {
                res.status(200).send({ success: false, message: currentLang.auth.user_disabled });
            }
        } else {
            //Return result NO data (HTML Response):
            res.status(200).send({ success: false, message: currentLang.auth.wrong_user });
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });
}
//--------------------------------------------------------------------------------------------------------------------//