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
    documents.doc_type = parseInt(documents.doc_type, 10);

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
        //Users lookup:
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
                                    type: '',
                                    description: '',
                                    role: '',
                                    concession: []
                                };

                                //ORGANIZATIONS:
                                //If contain organizations permissions:
                                if (Object.keys(peopleData.user.permissions[0]).includes('organization')){
                                    userPermission.domain = mongoose.Types.ObjectId(peopleData.user.permissions[0].organization);
                                    userPermission.type = 'organization';

                                    //Find organization short_name (userPermission description):
                                    const resultObj = await simplifiedFindById(res, organizations, userPermission.domain, { 'short_name': 1 });
                                    userPermission.description = resultObj.short_name;

                                //BRANCHES:
                                //If contain branches permissions:
                                } else if (Object.keys(peopleData.user.permissions[0]).includes('branch')){
                                    userPermission.domain = mongoose.Types.ObjectId(peopleData.user.permissions[0].branch);
                                    userPermission.type = 'branch';

                                    //Find branch short_name (userPermission description):
                                    const resultObj = await simplifiedFindById(res, branches, userPermission.domain, { 'short_name': 1 });
                                    userPermission.description = resultObj.short_name;

                                //SERVICES:
                                //If contain services permissions:
                                } else if (Object.keys(peopleData.user.permissions[0]).includes('service')){
                                    userPermission.domain = mongoose.Types.ObjectId(peopleData.user.permissions[0].service);
                                    userPermission.type = 'service';

                                    //Find service name (userPermission description):
                                    const resultObj = await simplifiedFindById(res, services, userPermission.domain, { 'name': 1 });
                                    userPermission.description = resultObj.name;
                                }

                                //Set role & concession in userPermission:
                                userPermission.role = parseInt(peopleData.user.permissions[0].role, 10);
                                userPermission.concession = peopleData.user.permissions[0].concession;

                                //Set response data object:
                                const response_data = {
                                    person_id: peopleData._id,
                                    user_id: peopleData.user._id,
                                    name: peopleData.name_01,
                                    surname: peopleData.surname_01,
                                    permissions: [ userPermission ]
                                }

                                //Create session:
                                await authServices.createSession(peopleData.user._id, userPermission, req, res, response_data);

                            //Multiple permissions:
                            } else {
                                //Set First time expiration:
                                const first_time_exp = '1m';

                                //Create payload:
                                const payload = {
                                    sub: peopleData.user._id.toString(),   //Identify the subject of the token.
                                    iat: (Date.now() / 1000),              //Token creation date.
                                    //exp: (Declared in expiresIn)         //Token expiration date.
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
                                                            type: 'organization',
                                                            description: orgData.short_name,
                                                            role: value['role'],
                                                            concession: peopleData.user.permissions[key].concession
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
                                                        type: 'branch',
                                                        description: branchData.organization.short_name + ' - ' + branchData.short_name,
                                                        role: value['role'],
                                                        concession: peopleData.user.permissions[key].concession
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
                                                        type: 'service',
                                                        description: servData.organization.short_name + ' - ' + servData.branch.short_name + ' - ' + servData.name,
                                                        role: value['role'],
                                                        concession: peopleData.user.permissions[key].concession
                                                    };
                                                }
                                            })
                                            .catch((err) => {
                                                //Send error:
                                                mainServices.sendError(res, currentLang.db.query_error, err);
                                            });
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

    // Simplified Find by _id:
    async function simplifiedFindById(res, currentSchema, _id, proj){
        //Initialize result:
        let result = null;

        await currentSchema.Model.findById(_id, proj)
        .exec()
        .then((data) => {
            //Check for results (not empty):
            if(data){
                //Convert Mongoose object to Javascript object:
                data = data.toObject();

                //Set user permission description:
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
}


//--------------------------------------------------------------------------------------------------------------------//