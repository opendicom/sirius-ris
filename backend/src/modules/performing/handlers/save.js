//--------------------------------------------------------------------------------------------------------------------//
// PERFORMING SAVE HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res, currentSchema, operation) => {
    //Initialize duplicated control var:
    let duplicated = false;

    //Initializate fk_appointment and date:
    let fk_appointment = undefined;
    let date = undefined;

    //Set fk_appointment - Insert or update case:
    if(req.body.fk_appointment != ''){
        fk_appointment = req.body.fk_appointment;

    //Set fk_appointment - Update case:
    } else if(req.body._id != ''){
        //Find performing by _id:
        await currentSchema.Model.findById(req.body._id, { fk_appointment: 1, date: 1 })
        .exec()
        .then((data) => {
            //Check for results (not empty):
            if(data){
                //Convert Mongoose object to Javascript object:
                data = data.toObject();

                //Set FK appointment:
                fk_appointment = data.fk_appointment;

                //Set performing date (To check duplicates):
                date = data.date;
            }
        })
        .catch((err) => {
            //Send error:
            mainServices.sendError(res, currentLang.db.query_error, err);
        });
    }
    
    //Check if request has checkin_time:
    if(req.body.checkin_time){
        //Create Check-in Time Regular Expresión to test format HH:MM | 24hs:
        const checkin_time_regex = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;

        //If it does not comply with the regular expression in case of update it will remain as a blocked attribute.
        if(checkin_time_regex.test(req.body.checkin_time)){
            //Set performing date preserving the appointment date:
            req.body.date = await moduleServices.setPerformingDate(fk_appointment, req.body.checkin_time);

            //Check duplicates with setted date:
            date = req.body.date;

            //Update set checking_time case:
            if(req.validatedResult){
                //Adjust update set for multiple fields to set:
                if(req.validatedResult.set != false){
                    req.validatedResult.set['date'] = req.body.date;

                //Create update set for date field:
                } else {
                    req.validatedResult['set'] = {
                        date: req.body.date
                    }
                }

                //Delete property checkin_time from blocked to avoid sending wrong message as response:
                delete req.validatedResult.blocked.checkin_time;
            }
        }
    }

    //Set params for check duplicates:
    const params = { fk_appointment: fk_appointment, date: date };

    //Search for duplicates:
    duplicated = await moduleServices.isDuplicated(req, res, currentSchema, params);

    //Check for duplicates:
    if(duplicated == false){
        //Set referenced elements (FKs - Check existence):
        let referencedElements = [];
        if(req.body.fk_appointment){ referencedElements.push([ req.body.fk_appointment, 'appointments' ]); }
        if(req.body.fk_equipment){ referencedElements.push([ req.body.fk_equipment, 'equipments' ]); }
        if(req.body.fk_procedure){ referencedElements.push([ req.body.fk_procedure, 'procedures' ]); }

        //Nested references:
        if(req.body.injection){
            if(req.body.injection.injection_user){ referencedElements.push([ req.body.injection.injection_user, 'users' ]); }    

            //PET-CT | Laboratory user:
            if(req.body.injection.pet_ct){
                if(req.body.injection.pet_ct.laboratory_user){ referencedElements.push([ req.body.injection.pet_ct.laboratory_user, 'users' ]); }    
            }
        }

        if(req.body.acquisition){
            if(req.body.acquisition.console_technician){ referencedElements.push([ req.body.acquisition.console_technician, 'users' ]); }    
        }
        
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