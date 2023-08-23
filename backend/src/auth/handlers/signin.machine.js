//--------------------------------------------------------------------------------------------------------------------//
// SIGNIN HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const mongoose  = require('mongoose');

//Import app modules:
const mainServices  = require('../../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);   // Language Module

//Import auth services:
const authServices  = require('../services');

//Import schemas:
const users     = require('../../modules/users/schemas');

module.exports = async (req, res) => {
    //Get query params:
    const { username, password } = req.body;

    //Create MongoDB arguments:
    const usersFilter = { username: username };
    const usersProj = { status: 1, password: 1, permissions: 1 };

    //Execute query:
    await users.Model.findOne(usersFilter, usersProj)
    .exec()
    .then((userData) => {
        //Check values projected (strictCheck): 
        //mainServices.strictCheck(usersProj, userData);

        //Check if user exist:
        if(userData){
            //Convert Mongoose object to Javascript object:
            userData = userData.toObject();

            //Check user status:
            if(userData.status == true){
                //Check user password:
                mainServices.verifyPass(userData.password, password)
                .then(async (same) => {
                    //If Passwords match:
                    if(same){
                        //Initialize user permission (Machine has only one permission):
                        let userPermission = {
                            domain: '', 
                            role: '',
                            concession: []
                        };

                        //Set domain:
                        if(userData.permissions[0].organization){
                            userPermission.domain = mongoose.Types.ObjectId(userData.permissions[0].organization);
                        } else if(userData.permissions[0].branch){
                            userPermission.domain = mongoose.Types.ObjectId(userData.permissions[0].branch);
                        } else if(userData.permissions[0].service){
                            userPermission.domain = mongoose.Types.ObjectId(userData.permissions[0].service);
                        }

                        //Set role:
                        userPermission.role = userData.permissions[0].role;

                        //Set concessions:
                        if(userData.permissions[0].concession){
                            userPermission.concession = userData.permissions[0].concession;
                        }
                        
                        //Create session:
                        authServices.createSession(userData._id, userPermission, req, res);

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