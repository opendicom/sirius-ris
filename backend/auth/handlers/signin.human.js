//--------------------------------------------------------------------------------------------------------------------//
// SIGNIN HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const jwt       = require('jsonwebtoken');
const mongoose  = require('mongoose');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Import auth services:
const authServices  = require('../services');

//Import schemas:
const people        = require('../../modules/people/schemas');
const organizations = require('../../modules/organizations/schemas');
const branches      = require('../../modules/branches/schemas');
const services      = require('../../modules/services/schemas');

module.exports = async (req, res) => {
    //Get query params:
    const documents = {
        doc_country_code:   req.body.doc_country_code,
        doc_type:           req.body.doc_type,
        document:           req.body.document
    }

    const password = req.body.password;

    //Set doc_type format (Integer base 10):
    documents.doc_type = parseInt(documents.doc_type);

    //Create MongoDB arguments:
    const peopleMatch = { documents: documents };
    const peopleProj = {
        'name_01': 1,
        'surname_01': 1,
        'user._id': 1,
        'user.password': 1,
        'user.permissions': 1,
        'user.status': 1
    };

    //PEOPLE & USERS:
    //Execute query:
    await people.Model.aggregate([
        //Branches lookup:
        { $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'fk_person',
            as: 'user',
        }},

        //Unwind:
        { $unwind: '$user' },

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
            if(peopleData.user.status === true){
                        
                //Check user password:
                mainServices.verifyPass(peopleData.user.password, password)
                    .then(async (same) => {
                        //If Passwords match:
                        if(same){
                            //If user signin with only one permission:
                            if(peopleData.user.permissions.length == 1){
                                //Initialize user permission:
                                let userPermission = {
                                    domain: '', 
                                    role: '',
                                    consession: []
                                };

                                //ORGANIZATIONS:
                                //If contain organizations permissions:
                                if (Object.keys(peopleData.user.permissions[0]).includes('organization')){
                                    userPermission.domain = mongoose.Types.ObjectId(peopleData.user.permissions[0].organization);
                                //BRANCHES:
                                //If contain branches permissions:
                                } else if (Object.keys(peopleData.user.permissions[0]).includes('branch')){
                                    userPermission.domain = mongoose.Types.ObjectId(peopleData.user.permissions[0].branch);
                                //SERVICES:
                                //If contain services permissions:
                                } else if (Object.keys(peopleData.user.permissions[0]).includes('service')){
                                    userPermission.domain = mongoose.Types.ObjectId(peopleData.user.permissions[0].service);
                                //PATIENTS:
                                //If contain patient permissions:
                                } else if (Object.keys(peopleData.user.permissions[0]).includes('patient')){
                                    mainServices.sendConsoleMessage('WARN', 'Patient autorization request, to be continue..');
                                }

                                //Set role & consession in userPermission:
                                userPermission.role = parseInt(peopleData.user.permissions[0].role);
                                userPermission.consession = peopleData.user.permissions[0].concession;

                                //Create session:
                                await authServices.createSession(peopleData.user._id, userPermission, res);

                            //Multiple permissions:
                            } else {
                                //Set First time expiration:
                                const first_time_exp = '1m';

                                //Create payload:
                                const payload = {
                                    sub: peopleData.user._id.toString(),   //Identify the subject of the token.
                                    iat: (Date.now() / 1000),                   //Token creation date.
                                    //exp: (Declared in expiresIn)              //Token expiration date.
                                }

                                //Create JWT (Temp):
                                jwt.sign(payload, mainSettings.AUTH_JWT_SECRET, { expiresIn: first_time_exp }, async (err, token) => {
                                    if(err){
                                        res.status(500).send({ success: false, message: currentLang.jwt.sign_error, error: err });

                                        //Send error:
                                        mainServices.sendError(res, currentLang.jwt.sign_error, err);

                                        return;
                                    }

                                    //Set user & patient permissions:
                                    let userPermissions = [];
                                    let patientPermissions = {};

                                    //Obtain permissions keys (await foreach):
                                    await Promise.all(peopleData.user.permissions.map(async (value, key) => {
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
                                                'organization._id': 1,
                                                'organization.short_name': 1,
                                                'organization.status': 1
                                            };

                                            //Execute query:
                                            await branches.Model.aggregate([
                                                //Branches lookup:
                                                { $lookup: {
                                                    from: 'organizations',
                                                    localField: 'fk_organization',
                                                    foreignField: '_id',
                                                    as: 'organization',
                                                }},

                                                //Unwind:
                                                { $unwind: '$organization' },

                                                //Operations:
                                                { $match: branchMatch },
                                                { $project: branchProj },
                                            ])
                                            .exec()
                                            .then((branchData) => {
                                                //Clarification: in aggregate doc it is an array:
                                                branchData = branchData[0];

                                                //Check branch and organization (parent) status:
                                                if(branchData.status == true && branchData.organization.status == true){
                                                    //Add permission in array:
                                                    userPermissions[key] = {
                                                        domain: branchData._id,
                                                        description: branchData.organization.short_name + ' - ' + branchData.short_name,
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
                                                'branch._id': 1,
                                                'branch.status': 1,
                                                'branch.short_name': 1,
                                                'branch.fk_organization': 1,
                                                'organization._id': 1,
                                                'organization.short_name': 1,
                                                'organization.status': 1
                                            };

                                            //Execute query:
                                            await services.Model.aggregate([
                                                //Branches lookup:
                                                { $lookup: {
                                                    from: 'branches',
                                                    localField: 'fk_branch',
                                                    foreignField: '_id',
                                                    as: 'branch',
                                                }},

                                                //Organizations lookup:
                                                { $lookup: {
                                                    from: 'organizations',
                                                    localField: 'branch.fk_organization',
                                                    foreignField: '_id',
                                                    as: 'organization',
                                                }},

                                                //Unwind:
                                                { $unwind: '$branch' },
                                                { $unwind: '$organization' },

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
                                                if(servData.status == true && servData.branch.status == true && servData.organization.status == true){
                                                    //Add permission in array:
                                                    userPermissions[key] = {
                                                        domain: servData._id,
                                                        description: servData.organization.short_name + ' - ' + servData.branch.short_name + ' - ' + servData.name,
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

                                    //Remove undefined values (status false cases - key):
                                    userPermissions = userPermissions.filter(element => {
                                        return element !== undefined;
                                    });

                                    //Set response data object:
                                    const response_data = {
                                        person_id: peopleData._id,
                                        user_id: peopleData.user._id,
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
                            }
                        } else {
                            //Passwords don't match:
                            res.status(200).send({ success: false, message: currentLang.auth.password_dont_match });
                        }
                    })
                    .catch((err) => {
                        //Send error:
                        mainServices.sendError(res, currentLang.auth.password_error, err);
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