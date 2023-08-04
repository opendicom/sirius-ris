//--------------------------------------------------------------------------------------------------------------------//
// APPOINTMENT REQUESTS SAVE HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

//Import Schemas:
const proccedures = require('../../procedures/schemas');
const modalities = require('../../modalities/schemas');

//Set ObjectId Regex to validate:
const regexObjectId = /^[0-9a-fA-F]{24}$/;

module.exports = async (req, res, currentSchema, operation) => {
    //Initializate study object:
    let studyChecked = false;

    //Set projections:
    const procedureProj = { fk_modality: 1, snomed: 1, status: 1 };
    const modalityProj  = { status: 1 };

    //FIND AND CHECK STUDY TYPE (PROCEDURE OR MODALITY):
    //Check fk_procedure, snomed and modality (at least one of the three must be set).

    //SET BY FK_PROCEDURE:
    if(req.body.study && req.body.study.fk_procedure && regexObjectId.test(req.body.study.fk_procedure)){
        //Find procedure by _id:
        await proccedures.Model.findById(req.body.study.fk_procedure, procedureProj)
        .exec()
        .then((procedureData) => {
            //Check if have results:
            if(procedureData && procedureData.status){
                //Set study object:
                studyChecked = true;

                //Set procedure snomed:
                if(procedureData.snomed !== undefined && procedureData.snomed !== null && procedureData.snomed !== ''){
                    req.body.study['snomed'] = procedureData.snomed;
                }

                //Set procedure modality:
                if(procedureData.fk_modality !== undefined && procedureData.fk_modality !== null && procedureData.fk_modality !== ''){
                    req.body.study['fk_modality'] = procedureData.fk_modality;
                }
            } else {
                //Procedure not found:
                res.status(200).send({ success: false, message: currentLang.ris.procedure_not_found });
            }
        })
        .catch((err) => {
            //Send error:
            mainServices.sendError(res, currentLang.db.query_error, err);
        });

    //SET BY SNOMED:
    } else if(req.body.study && req.body.study.snomed){
        //Find procedure by snomed:
        await proccedures.Model.findOne({ snomed: req.body.study.snomed }, procedureProj)
        .exec()
        .then((procedureData) => {
            //Check if have results:
            if(procedureData && procedureData.status){
                //Set study object:
                studyChecked = true;

                //Set procedure fk_procedure:
                if(procedureData._id !== undefined && procedureData._id !== null && procedureData._id !== ''){
                    req.body.study['fk_procedure'] = procedureData._id;
                }

                //Set procedure modality:
                if(procedureData.fk_modality !== undefined && procedureData.fk_modality !== null && procedureData.fk_modality !== ''){
                    req.body.study['fk_modality'] = procedureData.fk_modality;
                }
            } else {
                //Procedure not found:
                res.status(200).send({ success: false, message: currentLang.ris.procedure_not_found });
            }
        })
        .catch((err) => {
            //Send error:
            mainServices.sendError(res, currentLang.db.query_error, err);
        });

    //SET BY MODALITY (CODE VALUE):
    } else if(req.body.study && req.body.study.modality !== undefined && req.body.study.modality !== null && req.body.study.modality !== '' ){
        //Find modality by code_value:
        await modalities.Model.findOne({ code_value: req.body.study.modality.toUpperCase() }, modalityProj)
        .exec()
        .then((modalityData) => {
            //Check if have results:
            if(modalityData && modalityData.status){
                //Set study object:
                studyChecked = true;

                //Set procedure modality:
                req.body.study['fk_modality'] = modalityData._id;

                //Remove modality from the request:
                delete req.body.study.modality;
            } else {
                //Modality not found:
                res.status(200).send({ success: false, message: currentLang.ris.modalitiy_not_found });
            }
        })
        .catch((err) => {
            //Send error:
            mainServices.sendError(res, currentLang.db.query_error, err);
        });        

    } else {
        //Bad request:
        res.status(400).send({ success: false, message: currentLang.http.bad_request });
    }

    //Remove no digits chars in document for doc_type case 1 [ID Nacional (DNI, CI, CURP, RUT)]:
    if(req.body.patient && req.body.patient.doc_type == 1){
        req.body.patient.document = req.body.patient.document.replace(/\D/g, '');
    }

    //Set Flow state:
    req.body['flow_state'] = 'AR01';

    //Check study object:
    if(studyChecked){
        //Set referenced elements (FKs - Check existence):
        //Referenced elements note: fk_procedure and fk_modality are checked before (Study Check).
        let referencedElements = [];
        //Imaging
        if(req.body.imaging.organization){ referencedElements.push([ req.body.imaging.organization, 'organizations' ]); }
        if(req.body.imaging.branch){ referencedElements.push([ req.body.imaging.branch, 'branches' ]); }

        //Referring:
        if(req.body.referring.organization){ referencedElements.push([ req.body.referring.organization, 'organizations' ]); }
        if(req.body.referring.branch){ referencedElements.push([ req.body.referring.branch, 'branches' ]); }

        //Excecute main query:
        switch(operation){
            case 'insert':
                await moduleServices.insert(req, res, currentSchema, referencedElements);
                break;
            case 'update':
                await moduleServices.update(req, res, currentSchema, referencedElements);
                break;
            default:
                res.status(500).send({ success: false, message: currentLang.db.not_allowed_save });
                break;
        }
    }
}
//--------------------------------------------------------------------------------------------------------------------//