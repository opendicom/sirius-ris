//--------------------------------------------------------------------------------------------------------------------//
// SINGIN HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Import schemas:
const people        = require('../../modules/people/schemas');
const users         = require('../../modules/users/schemas');
const organizations = require('../../modules/organizations/schemas');
const branches      = require('../../modules/branches/schemas');

module.exports = async function (req, res){
    //Get query params:
    const { documents, password } = req.body;

    //Create MongoDB arguments:
    const peopleFilter = { documents: documents };
    const peopleProj = { name_01: 1, surname_01: 1 };

    //Build query:
    const peopleQuery = people.Model.findOne(peopleFilter, peopleProj);

    //Execute query:
    await mainServices.queryMongoDB(peopleQuery, res, async (peopleData) => {
        //Check if the person exists:
        if(peopleData){
            //Create MongoDB arguments:
            const usersFilter = { fk_people: peopleData._id };
            const usersProj = { status: 1, permissions: 1, password: 1 };

            //Build query:
            const usersQuery = users.Model.findOne(usersFilter, usersProj);
            
            //Execute query:
            await mainServices.queryMongoDB(usersQuery, res, async (userData) => {
                //Check if the user exists:
                if(userData){
                    //Check user status:
                    if(userData.status === true){
                        //Check user password:
                        bcrypt.compare(password, userData.password, (err, same) => {
                            //If Passwords match:
                            if(same){
                                //Set First time expiration:
                                const first_time_exp = '1m';

                                //Create payload:
                                const payload = {
                                    sub: userData._id.toString(),   //Identify the subject of the token.
                                    iat: (Date.now() / 1000),       //Token creation date.
                                    //exp: (Declared in expiresIn)  //Token expiration date.
                                }

                                //Create JWT (Temp):
                                jwt.sign(payload, mainSettings.AUTH_JWT_SECRET, { expiresIn: first_time_exp }, async (err, token) => {
                                    if(err){
                                        res.status(500).send({ success: false, message: currentLang.jwt.sign_error,  error: err });
                                        return;
                                    }
                                    
                                    //Set user & patient permissions:
                                    let userPermissions = [];
                                    let patientPermissions = {};

                                    //Create obtained arrays (to prevent duplicates):
                                    let obtainedOrganizations = [];
                                    let obtainedBranches = [];

                                    //Obtain permissions keys (await foreach):
                                    await Promise.all(userData.permissions.map(async (value, key) => {
                                        //If contain organizations permissions:
                                        if (Object.keys(value).includes('organization')){ 
                                            //Create MongoDB arguments:
                                            const organizationFilter = { _id: value['organization'] };
                                            const organizationProj = { status: 1, short_name: 1 };

                                            //Build query:
                                            const organizationQuery = organizations.Model.findOne(organizationFilter, organizationProj);
                                            
                                            //Execute query:
                                            await mainServices.queryMongoDB(organizationQuery, res, (organizationData) => {
                                                //Check organization status:
                                                if(organizationData.status == true){
                                                    //Add organization like obtained (to prevent duplicates):
                                                    obtainedOrganizations[organizationData._id] = organizationData.short_name;

                                                    //Add permission in array:
                                                    userPermissions[key] = {
                                                        domain: organizationData._id,
                                                        description: organizationData.short_name,
                                                        role: value['role']
                                                    };
                                                }
                                            });

                                        //If contain branches permissions:
                                        } else if (Object.keys(value).includes('branch')){ 
                                            //Create MongoDB arguments:
                                            const branchFilter = { _id: value['branch'] };
                                            const branchProj = { status: 1, short_name: 1, fk_organization: 1 };

                                            //Build query:
                                            const branchQuery = branches.Model.findOne(branchFilter, branchProj);

                                            //Execute query:
                                            await mainServices.queryMongoDB(branchQuery, res, async (branchData) => {
                                                //Check branch status:
                                                if(branchData.status == true){
                                                    //Add branch like obtained (to prevent duplicates):
                                                    obtainedBranches[branchData._id] = branchData.short_name;

                                                    //Check if you already have the organization:
                                                    if(obtainedOrganizations[branchData.fk_organization]){
                                                        //Add permission in array:
                                                        userPermissions[key] = {
                                                            domain: branchData.fk_organization + '.' + branchData._id,
                                                            description: obtainedOrganizations[branchData.fk_organization] + ' - ' + branchData.short_name,
                                                            role: value['role']
                                                        };

                                                    //Obtain organization short_name and _id:
                                                    } else {
                                                        //Create MongoDB arguments:
                                                        const parent_organizationFilter = { _id: branchData.fk_organization };
                                                        const parent_organizationProj = { short_name: 1 };
                                                        
                                                        //Build query:
                                                        const parent_organizationQuery = organizations.Model.findOne(parent_organizationFilter, parent_organizationProj);

                                                        //Execute query:
                                                        await mainServices.queryMongoDB(parent_organizationQuery, res, (parent_organizationData) => {
                                                            //Add organization like obtained (to prevent duplicates):
                                                            obtainedOrganizations[parent_organizationData._id] = parent_organizationData.short_name;

                                                            //Add permission in array:
                                                            userPermissions[key] = {
                                                                domain: parent_organizationData._id + '.' + branchData._id,
                                                                description: parent_organizationData.short_name + ' - ' + branchData.short_name,
                                                                role: value['role']
                                                            };
                                                        });
                                                    }
                                                }
                                            });
                                            
                                        //If contain services permissions:
                                        } else if (Object.keys(value).includes('service')){
                                            //console.log('Contain service permissions');
                                        
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
                                        user_id: userData._id,
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
                                res.status(200).send({ success: false, message: 'Contraseña incorrecta.', error: err });
                            }
                        });
                    } else {
                        res.status(200).send({ success: false, message: 'La cuenta de usuario está desactivada.' });
                    }
                } else {
                    //Return result NO data (HTML Response):
                    res.status(200).send({ success: false, message: 'El usuario NO existe.' });
                }
            });
        } else {
            //Return result NO data (HTML Response):
            res.status(200).send({ success: false, message: 'La persona NO existe.' });
        }
    });
}
//--------------------------------------------------------------------------------------------------------------------//