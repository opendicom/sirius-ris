//--------------------------------------------------------------------------------------------------------------------//
// ORGANIZATIONS STATS HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const mongoose      = require('mongoose');

//Import app modules:
const mainServices  = require('../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                            // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules/modules.services');

//Import schemas:
const appointment_requests  = require('../../modules/appointment_requests/schemas');
const appointments          = require('../../modules/appointments/schemas');
const performing            = require('../../modules/performing/schemas');
const reports               = require('../../modules/reports/schemas');

//Set ObjectId Regex to validate:
const regexObjectId = /^[0-9a-fA-F]{24}$/;

module.exports = async (req, res) => {
    //Check request fields:
    if(req.query.hasOwnProperty('start_date') && req.query.hasOwnProperty('end_date')){

      //Get query params:
      const { start_date, end_date, fk_organization } = req.query;

      //Initializate organization check:
      let organizationCheck = true;

      //Disable filter, proj, skip, limit, sort and pager request fields:
      delete req.query.filter;
      delete req.query.proj;
      delete req.query.skip;
      delete req.query.limit;
      delete req.query.sort;
      delete req.query.pager;

      /*
      CHECK SUPER USER IS LOGGED:
      //Check if exist and validate fk_organization in request (Superuser case):
      if(fk_organization !== undefined && fk_organization !== null && fk_organization !== '' && regexObjectId.test(fk_organization)){

        //Check if referenced organization exist in DB:
        organizationCheck = await moduleServices.ckeckElement(fk_organization, 'organizations', res);

        //Check references:
        if(organizationCheck == true){
                
        }
      } else {
        //Send not valid referenced object mensaje:
        res.status(405).send({ success: false, message: currentLang.db.not_valid_fk });
      }
      
      ELSE NORMAL USER...
      */

      //Simulate expected response:
      res.status(200).send({
        appointment_requests: {
          branch: {
            asseMACIEL  : 100,
            assePASTEUR : 50
          }
        },
        appointments : {
          branch: {
            asseMACIEL  : 220,
            assePASTEUR : 430
          },
          service: {
            tomografia: 520,
            resonancia: 130
          }
        },
        performing: {
          branch: {
            asseMACIEL  : 230,
            assePASTEUR : 480
          },
          service: {
            tomografia: 520,
            resonancia: 130
          }
        },
        reports: {
          branch: {
            asseMACIEL  : 60,
            assePASTEUR : 83
          },
          service: {
            tomografia: 520,
            resonancia: 130
          }
        }
      });

    } else {
        //Bad request:
        res.status(400).send({ success: false, message: currentLang.http.bad_request });
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//