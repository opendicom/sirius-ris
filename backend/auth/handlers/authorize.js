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
    const { domain, role } = req.body;

    //Get user ID the payload:
    const user_id = req.decoded.sub;

    //Create MongoDB arguments:
    const usersFilter = { _id: user_id };
    const usersProj = { status: 1, permissions: 1, settings: 1 };

    //Build query:
    await users.Model.findOne(usersFilter, usersProj)
    .exec()
    .then(async (userData) => {
        //Check if user exist:
        if(userData){

            //Convert Mongoose object to Javascript object:
            userData = userData.toObject();

            //Check user status:
            if(userData.status == true){

                //Initialize permisionChecked
                let permisionChecked = false;

                //Initialize user permission:
                let userPermission = {
                    domain: '', 
                    role: '',
                    concession: []
                };

                //Obtain permissions keys (await foreach):
                await Promise.all(userData.permissions.map(async (value, key) => {
                    //Check that the user really has the indicated domain:
                    if ((Object.keys(value).includes('organization') && value['organization'] == domain) || 
                        (Object.keys(value).includes('branch') && value['branch'] == domain) || 
                        (Object.keys(value).includes('service') && value['service'] == domain)){
                        
                        //Check that the user really has the indicated role in the specific domain:
                        if(value['role'] == role){
                            permisionChecked = true;

                            //Set userPermission:
                            userPermission.domain = mongoose.Types.ObjectId(domain);
                            userPermission.role = parseInt(role, 10);
                            userPermission.concession = value['concession'];
                        }
                    }
                }));
                
                //If contain the specific permission:
                if(permisionChecked){
                    //Create session:
                    authServices.createSession(userData._id, userPermission, req, res);
                } else {
                    res.status(200).send({ success: false, message: currentLang.auth.wrong_role_domain });
                }

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