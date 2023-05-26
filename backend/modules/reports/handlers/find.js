//--------------------------------------------------------------------------------------------------------------------//
// REPORTS FIND HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

//Import reports aggregate:
let reports_aggregate = require('../aggregate');

module.exports = async (req, res, currentSchema) => {
    //Get query params:
    let { filter, regex } = req.query;

    //Add aggregate to request:
    if(!req.query.hasOwnProperty('aggregate')){ delete req.query.aggregate };
    req.query['aggregate'] = [ ... reports_aggregate ];

    //Correct data types for match operation:
    if(filter != undefined){
        //Adjust data types for match aggregation (Schema):
        filter = await moduleServices.adjustDataTypes(filter, 'reports');
        filter = await moduleServices.adjustDataTypes(filter, 'performing', 'performing');
        filter = await moduleServices.adjustDataTypes(filter, 'appointments', 'appointment');
        filter = await moduleServices.adjustDataTypes(filter, 'equipments', 'equipment');
        filter = await moduleServices.adjustDataTypes(filter, 'procedures', 'procedure');
        filter = await moduleServices.adjustDataTypes(filter, 'modalities', 'modality');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'patient');
        filter = await moduleServices.adjustDataTypes(filter, 'people', 'patient.person');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'performing.injection.injection_user');
        filter = await moduleServices.adjustDataTypes(filter, 'people', 'performing.injection.injection_user.person');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'performing.acquisition.console_technician');
        filter = await moduleServices.adjustDataTypes(filter, 'people', 'performing.acquisition.console_technician.person');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'authenticated.user');
        filter = await moduleServices.adjustDataTypes(filter, 'people', 'authenticated.user.person');
        filter = await moduleServices.adjustDataTypes(filter, 'users', 'medical_signatures.user');
        filter = await moduleServices.adjustDataTypes(filter, 'people', 'medical_signatures.user.person');

        //Set condition:
        const condition = await moduleServices.setCondition(filter, regex);

        //Add match operation to aggregations:
        req.query.aggregate.push({ $match: condition });
    }

    //Excecute main query:
    await moduleServices.findAggregation(req, res, currentSchema);
}
//--------------------------------------------------------------------------------------------------------------------//