//--------------------------------------------------------------------------------------------------------------------//
// REPORTS SAVE HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res, currentSchema, operation) => {
    //Set referenced elements (FKs - Check existence):
    let referencedElements = [];
    if(req.body.fk_performing){ referencedElements.push([ req.body.fk_performing, 'performing' ]); }
        
    //Set referenced elements (FKs - Check existence) [Arrays case]:
    if(req.body.fk_pathologies){
        for(let currentKey in req.body.fk_pathologies){
            referencedElements.push([ req.body.fk_pathologies[currentKey], 'pathologies' ]);
        }
    }
    
    //Delete medical signatures:
    //Not required in request, managed from reports and signatures handlers.
    if(req.body.medical_signatures){ delete req.body.medical_signatures }

    //Excecute main query:
    switch(operation){
        case 'insert':
            //Create handler object (insert_report):
            const handlerObjInsert = {
                fk_performing: req.body.fk_performing,
                amend: req.body.amend,
                error_message: currentLang.ris.wrong_performing_flow_state
            };

            //Check and update performing flow_state to 'P07 - Informe borrador':
            const insertResult = await moduleServices.reportsSaveController('insert_report', handlerObjInsert);

            //Check result:
            if(insertResult.success){
                //Save report data:
                const insertController = await moduleServices.insert(req, res, currentSchema, referencedElements);

                //Check insertController:
                if(insertController === false){
                    //Return to 'P06 - Para informar' status recently changed to 'P07 - Informe borrador':
                    await moduleServices.setPerformingFS(req.body.fk_performing, 'P06');
                }
            } else {
                //Send error message:
                res.status(422).send({ success: false, message: insertResult.message });
            }
                
            break;

        case 'update':
            //Validate report revision in request:
            if(req.body.revision === undefined || req.body.revision === null){
                return res.status(422).send({
                    success: false,
                    message: 'Missing report revision'
                });
            }

            //Parse revision to number and validate:
            const requestRevision = Number(req.body.revision);
            if(Number.isNaN(requestRevision)){
                return res.status(422).send({
                    success: false,
                    message: 'Invalid report revision'
                });
            }

            //Find current report by _id and get current revision with signatures and performing reference:
            await currentSchema.Model.findById(req.body._id, { fk_performing: 1, medical_signatures: 1, revision: 1 })
            .exec()
            .then(async (reportData) => {
                //Check for results (not empty):
                if(reportData){
                    //Convert Mongoose object to Javascript object:
                    reportData = reportData.toObject();

                    //Validate revision conflict before applying updates:
                    if(reportData.revision !== requestRevision){
                        return res.status(409).send({
                            success: false,
                            conflict: true,
                            current_revision: reportData.revision,
                            message: 'El informe fue modificado por otro usuario. Recargue el informe antes de continuar.'
                        });
                    }

                    //Create handler object (insert_report):
                    const handlerObjUpdate = {
                        fk_performing: reportData.fk_performing,
                        error_message: currentLang.ris.wrong_performing_flow_state
                    };

                    //Check and update performing flow_state to 'P07 - Informe borrador':
                    const updateResult = await moduleServices.reportsSaveController('update_report', handlerObjUpdate);

                    //Check result:
                    if(updateResult.success){
                        //Check if the report has signatures to remove:
                        const hasSignatures = reportData.medical_signatures.length > 0;

                        //Build atomic update object without allowing client to override revision:
                        const setData = req.validatedResult.set ? { ...req.validatedResult.set } : {};
                        const unsetData = req.validatedResult.unset ? { ...req.validatedResult.unset } : {};

                        delete setData.revision;
                        if(unsetData.revision !== undefined) { delete unsetData.revision; }

                        const updateObj = {};
                        if(Object.keys(setData).length > 0){ updateObj.$set = setData; }
                        if(Object.keys(unsetData).length > 0){ updateObj.$unset = unsetData; }
                        updateObj.$inc = { revision: 1 };

                        //Atomic update with optimistic locking using revision filter:
                        await currentSchema.Model.findOneAndUpdate({ _id: req.body._id, revision: requestRevision }, updateObj, { new: true })
                        .then(async (data) => {
                            if(data){
                                //Check if the report has signatures to remove:
                                if(hasSignatures){
                                    //Remove and delete all previous signatures from the report:
                                    await moduleServices.removeAllSignaturesFromReport(reportData);
                                    data.medical_signatures = [];
                                }

                                //Delete _id of blocked items for message:
                                delete req.validatedResult.blocked._id;

                                //Set empty blocked format:
                                if(Object.keys(req.validatedResult.blocked).length === 0){ req.validatedResult.blocked = false; }

                                //Set log element:
                                const element = {
                                    type: currentSchema.Model.modelName,
                                    _id: data._id
                                };

                                //Save registry in Log DB:
                                const logResult = await moduleServices.insertLog(req, res, 3, element);

                                //Check log registry result:
                                if(logResult){
                                    //Send successfully response:
                                    res.status(200).send({
                                        success: true,
                                        data: data,
                                        blocked_attributes: req.validatedResult.blocked,
                                        blocked_unset: req.validatedResult.blocked_unset
                                    });
                                } else {
                                    //Send log error response:
                                    res.status(500).send({ success: false, message: currentLang.db.insert_error_log });
                                }
                            } else {
                                //Conflict detected (report was modified by another user):
                                res.status(409).send({
                                    success: false,
                                    conflict: true,
                                    message: currentLang.ris.modified_by_another_user
                                });
                            }
                        })
                        .catch((err) => {
                            //Dont match (empty result findOneAndUpdate):
                            mainServices.sendError(res, currentLang.db.update_error, err);
                        });

                    } else {
                        //Send error message:
                        res.status(422).send({ success: false, message: updateResult.message });
                    }

                } else {
                    //Dont match (empty result):
                    res.status(200).send({ success: true, message: currentLang.db.id_no_results });
                }
            })
            .catch((err) => {
                //Send error:
                mainServices.sendError(res, currentLang.db.query_error, err);
            });
            break;

        default:
            res.status(500).send({ success: false, message: currentLang.db.not_allowed_save });
            break;
    }
}
//--------------------------------------------------------------------------------------------------------------------//