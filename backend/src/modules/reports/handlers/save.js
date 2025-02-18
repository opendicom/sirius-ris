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
            //Find current report by _id:
            await currentSchema.Model.findById(req.body._id, { fk_performing: 1, medical_signatures: 1 })
            .exec()
            .then(async (reportData) => {
                //Check for results (not empty):
                if(reportData){
                    //Convert Mongoose object to Javascript object:
                    reportData = reportData.toObject();

                    //Create handler object (insert_report):
                    const handlerObjUpdate = {
                        fk_performing: reportData.fk_performing,
                        error_message: currentLang.ris.wrong_performing_flow_state
                    };

                    //Check and update performing flow_state to 'P07 - Informe borrador':
                    const updateResult = await moduleServices.reportsSaveController('update_report', handlerObjUpdate);

                    //Check result:
                    if(updateResult.success){

                        //Check if the report is signed:
                        if(reportData.medical_signatures.length > 0){
                            //Remove and delete all previous signatures from the report:
                            await moduleServices.removeAllSignaturesFromReport(reportData);
                        }

                        //Update report data:
                        await moduleServices.update(req, res, currentSchema, referencedElements);

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