//--------------------------------------------------------------------------------------------------------------------//
// SLOTS BATCH SAVE HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

module.exports = async (req, res, currentSchema) => {
    //Set referenced elements (FKs - Check existence):
    let referencedElements = [];
    if(req.body.domain.organization){ referencedElements.push([ req.body.domain.organization, 'organizations' ]); }
    if(req.body.domain.branch){ referencedElements.push([ req.body.domain.branch, 'branches' ]); }
    if(req.body.domain.service){ referencedElements.push([ req.body.domain.service, 'services' ]); }
    if(req.body.fk_equipment){ referencedElements.push([ req.body.fk_equipment, 'equipments' ]); }
    if(req.body.fk_procedure){ referencedElements.push([ req.body.fk_procedure, 'procedures' ]); } //Optional in schema

    //Get day into week for the request:
    const week_day = req.body.day;

    //Make sure week_day has boolean content:
    week_day.forEach((current, key) => {
        //Check current is NOT a boolean type:
        if(!(current === true || current === false)){
            week_day[key] = mainServices.stringToBoolean(current);
        }
    });

    //Validate week day:
    //Check that the days are not undefined (string NOT true or false):
    if(week_day.includes(undefined)){
        //Return the result (HTML Response):
        res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.ris.validate.weekday_boolean });
    
    //Check that the days are not all false:
    } else if(week_day.includes(true)){

        //Set urgency to boolean:
        if(!(req.body.urgency === true || req.body.urgency === false)){
            req.body.urgency = mainServices.stringToBoolean(req.body.urgency);
        }

        //Validate urgency type:
        if(req.body.urgency !== undefined){
        
            //Parse range_start and range_end to date formats:
            const range_start = mainServices.parseDate(req.body.range_start);
            const range_end = mainServices.parseDate(req.body.range_end);

            //Get time start and end:
            const time_start = req.body.start;
            const time_end = req.body.end;

            //Create time regex (HH:MM 24-hour with leading 0):
            const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

            //Check start and end format with time regex:
            if(timeRegex.test(time_start) && timeRegex.test(time_end)){
                //Convert start and end to date formats for comparison:
                //Fixed date only to time comparison.
                const start = new Date('1988-05-24T' + time_start + ':00Z');
                const end = new Date('1988-05-24T' + time_end + ':00Z');

                //Check that end is greater than start:
                if(start < end){
                    
                    //Create loop date (to increment):
                    let loop = new Date(range_start);

                    //Check that range_end is greater than range_start:
                    if(loop < range_end){

                        //Remove properties to avoid sending wrong request to insert:
                        delete req.body.range_start;
                        delete req.body.range_end;
                        delete req.body.day;

                        //Set header sent (First time):
                        res.headerSent = false;

                        //Loop through a date range:
                        while (loop <= range_end) {

                            //Check that the current day is marked as true (string or boolean):
                            if(week_day[loop.getDay()] === true){

                                //Fix Eastern Daylight Time (TimezoneOffset):
                                loop.getTimezoneOffset();

                                //Separate date:
                                let year = loop.getFullYear();
                                let month = ('0' + (loop.getMonth() + 1)).slice(-2);
                                let day = ('0' + loop.getDate()).slice(-2);

                                //Set current start and end into the request (prepare insert):
                                req.body.start = new Date(year + "-" + month + "-" + day + "T" + time_start + ":00.000Z");
                                req.body.end = new Date(year + "-" + month + "-" + day + "T" + time_end + ":00.000Z");

                                //Check if header have already been sent (Posibly validation errors):
                                if(res.headerSent == false){
                                    //Excecute main query:
                                    await moduleServices.insert(req, res, currentSchema, referencedElements, false);
                                }
                            }

                            //Increment Date:
                            let incrementDate = loop.setDate(loop.getDate() + 1);
                            loop = new Date(incrementDate);
                        }

                        //Check if header have already been sent (Posibly validation errors):
                        if(res.headerSent == false){
                            //Send successfully response:
                            res.status(200).send({ success: true, message: currentLang.ris.batch_processed });
                        }
                    } else {
                        //Return the result (HTML Response):
                        res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.ris.validate.start_date_lte_end_date });
                    }
                } else {
                    //Return the result (HTML Response):
                    res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.ris.validate.start_time_lte_end_time });
                }
            } else {
                //Return the result (HTML Response):
                res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.ris.validate.time_format });
            }

        } else {
            //Return the result (HTML Response):
            res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.ris.validate.urgency_boolean });
        }

    } else {
        //Return the result (HTML Response):
        res.status(422).send({ success: false, message: currentLang.db.validate_error, validate_errors: currentLang.ris.validate.weekday_required });
    }
}
//--------------------------------------------------------------------------------------------------------------------//