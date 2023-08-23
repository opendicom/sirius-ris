//--------------------------------------------------------------------------------------------------------------------//
// EXPORTER REPORTS HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                            // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices  = require('../../modules/modules.services');

//Import reports schemas:
const reports = require('../../modules/reports/schemas');

//Import reports find handler:
const reportsFindHandler = require('../../modules/reports/handlers/find');

module.exports = async (req, res) => {
    //Get authenticated user information (Decoded JWT):
    const userAuth = {
        _id: req.decoded.sub,
        domain: req.decoded.session.domain,
        role: req.decoded.session.role,
        concession: req.decoded.session.concession
    };

    //Obtain domain type from decoded JWT domain:
    const domainType = await moduleServices.domainIs(userAuth.domain, res);
    
    //Force project - Overwrite:
    req.query['proj'] = {
        'performing.date'                   : 1,
        'patient.person.documents'          : 1,
        'patient.person.name_01'            : 1,
        'patient.person.name_02'            : 1,
        'patient.person.surname_01'         : 1,
        'patient.person.surname_02'         : 1,
        'patient.person.gender'             : 1,
        'patient.person.birth_date'         : 1,
        'authenticated.base64_report'       : 1,
        'appointment.study_iuid'            : 1,
        'authenticated.datetime'            : 1,
        'appointment.appointment_request'   : 1,
    };

    //Force filters - Overwrite:
    req.query['filter'] = {
        'performing.status'     : 'true',
        'performing.flow_state' : 'P09'
    };

    //Check pager (set max limit or set default value):
    if(req.query.hasOwnProperty('pager')){
        if(req.query.pager.hasOwnProperty('page_limit')){
            //Check page_limit:
            if(parseInt(req.query.pager.page_limit, 10) <= 0){
                //Set default pager limit:
                req.query.pager['page_limit'] = 10;
            } else if(parseInt(req.query.pager.page_limit, 10) > 100){
                //Set max page_limit:
                req.query.pager['page_limit'] = 50;
            }
        } else {
            //Set default pager limit:
            req.query.pager['page_limit'] = 10;
        }
    } else {
        //Set default pager values:
        req.query['pager'] = {
            page_number : 1,
            page_limit  : 10
        };
    };

    //Check domain type:
    if(domainType !== null && domainType !== undefined){
        //Add domain condition in filter according domain type:
        switch(domainType){
            case 'organizations':
                req.query.filter['appointment.referring.organization._id'] = userAuth.domain;
                break;
            
            case 'branches':
                req.query.filter['appointment.referring.branch._id'] = userAuth.domain;
                break;

            case 'services':
                req.query.filter['appointment.referring.service._id'] = userAuth.domain;
                break;
        }

        //Set optional filters - Date:
        if(req.query.hasOwnProperty('date')){
            req.query.filter['performing.date'] = {
                '$gte': req.query.date + 'T00:00:00.000Z',
                '$lte': req.query.date + 'T23:59:59.000Z'
            };
        
        //Set optional filters - Start date and End date:
        } else if(req.query.hasOwnProperty('start_date') && req.query.hasOwnProperty('end_date')){
            req.query.filter['performing.date'] = {
                '$gte': req.query.start_date + 'T00:00:00.000Z',
                '$lte': req.query.end_date + 'T23:59:59.000Z'
            };
        }

        //Set optional filters - Documents:
        //Complete document (ISO-3166):
        if(req.query.hasOwnProperty('doc_country_code') && req.query.hasOwnProperty('doc_type') && req.query.hasOwnProperty('document')){
            //Set elemMatch condition:
            req.query.filter['elemMatch'] = {
                'patient.person.documents' : {
                    'doc_country_code' : req.query.doc_country_code,
                    'doc_type'         : req.query.doc_type,
                    'document'         : req.query.document
                }
            };

        //Incomplete document:
        } else {
            //Set separated condition::
            if(req.query.hasOwnProperty('doc_country_code')){ req.query.filter['patient.person.documents.doc_country_code'] = req.query.doc_country_code }
            if(req.query.hasOwnProperty('doc_type')){ req.query.filter['patient.person.documents.doc_type'] = req.query.doc_type }
            if(req.query.hasOwnProperty('document')){ req.query.filter['patient.person.documents.document'] = req.query.document }
        }

        //Send to reports find Handler:
        await reportsFindHandler(req, res, reports);
    } else {
        //Send JWT Domain type error:
        res.status(401).send({ success: false, message: currentLang.jwt.check_invalid_token, error: 'Domain type error.' });
    }
}
//--------------------------------------------------------------------------------------------------------------------//