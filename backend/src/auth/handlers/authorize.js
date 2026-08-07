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
const users         = require('../../modules/users/schemas');
const organizations = require('../../modules/organizations/schemas');
const branches      = require('../../modules/branches/schemas');
const services      = require('../../modules/services/schemas');

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

                //Store the matched permission entry (used below to resolve white_labeling):
                let matchedPermission = null;

                //Obtain permissions keys (await foreach):
                await Promise.all(userData.permissions.map(async (value, key) => {
                    //Check that the user really has the indicated domain:
                    if ((Object.keys(value).includes('organization') && value['organization'] == domain) ||
                        (Object.keys(value).includes('branch') && value['branch'] == domain) ||
                        (Object.keys(value).includes('service') && value['service'] == domain)){

                        //Check that the user really has the indicated role in the specific domain:
                        if(value['role'] == role){
                            permisionChecked = true;
                            matchedPermission = value;

                            //Set userPermission:
                            userPermission.domain = new mongoose.Types.ObjectId(domain);
                            userPermission.role = parseInt(role, 10);
                            userPermission.concession = value['concession'];
                        }
                    }
                }));

                //If contain the specific permission:
                if(permisionChecked){
                    //Resolve white_labeling from the organization ancestor:
                    let white_labeling = null;
                    try {
                        //Organization permission: read white_labeling directly:
                        if(matchedPermission && Object.keys(matchedPermission).includes('organization')){
                            const orgData = await organizations.Model.findById(matchedPermission['organization'], { white_labeling: 1 }).lean();
                            if(orgData && orgData.white_labeling) white_labeling = orgData.white_labeling;

                        //Branch permission: look up its parent organization:
                        } else if(matchedPermission && Object.keys(matchedPermission).includes('branch')){
                            const branchData = await branches.Model.findById(matchedPermission['branch'], { fk_organization: 1 }).lean();
                            if(branchData && branchData.fk_organization){
                                const orgData = await organizations.Model.findById(branchData.fk_organization, { white_labeling: 1 }).lean();
                                if(orgData && orgData.white_labeling) white_labeling = orgData.white_labeling;
                            }

                        //Service permission: look up its parent branch, then that branch's organization:
                        } else if(matchedPermission && Object.keys(matchedPermission).includes('service')){
                            const servData = await services.Model.findById(matchedPermission['service'], { fk_branch: 1 }).lean();
                            if(servData && servData.fk_branch){
                                const branchData = await branches.Model.findById(servData.fk_branch, { fk_organization: 1 }).lean();
                                if(branchData && branchData.fk_organization){
                                    const orgData = await organizations.Model.findById(branchData.fk_organization, { white_labeling: 1 }).lean();
                                    if(orgData && orgData.white_labeling) white_labeling = orgData.white_labeling;
                                }
                            }
                        }
                    } catch(err) {
                        //If lookup fails, continue without white_labeling instead of blocking signin:
                        mainServices.sendConsoleMessage('ERROR', 'Authorize [white_labeling resolution]: ' + err.message, err);
                        white_labeling = null;
                    }

                    //Build response_data only if there is white_labeling to send:
                    const response_data = white_labeling ? { white_labeling } : false;

                    //Create session:
                    authServices.createSession(userData._id, userPermission, req, res, response_data);
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