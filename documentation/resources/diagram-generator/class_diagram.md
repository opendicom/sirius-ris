# Class diagram

_Automatically generated from Data dictionary._

---

```mermaid
classDiagram

class appointment_requests {
  imaging.organization : ObjectId
  imaging.branch : ObjectId
  referring.organization : ObjectId
  referring.branch : ObjectId
  flow_state : String
  urgency : Boolean
  annotations : String
  patient.doc_country_code : String
  patient.doc_type : Number
  patient.document : String
  patient.name_01 : String
  patient.name_02 : String
  patient.surname_01 : String
  patient.surname_02 : String
  patient.birth_date : Date
  patient.gender : Number
  patient.phone_numbers[x] : String
  patient.email : String
  study.fk_procedure : ObjectId
  study.snomed : String
  study.fk_modality : ObjectId
  anamnesis : String
  indications : String
  extra.patient_id : String
  extra.study_id : String
  extra.physician_id : String
  extra.physician_name : String
  extra.physician_prof_id : String
  extra.physician_contact : String
  extra.requesting_id : String
  extra.custom_fields[x] : String
}

class appointments {
  fk_appointment_request : ObjectId
  imaging.organization : ObjectId
  imaging.branch : ObjectId
  imaging.service : ObjectId
  referring.organization : ObjectId
  referring.branch : ObjectId
  referring.service : ObjectId
  referring.fk_referring : ObjectId
  reporting.organization : ObjectId
  reporting.branch : ObjectId
  reporting.service : ObjectId
  reporting.fk_reporting[x] : ObjectId
  fk_patient : ObjectId
  contact : String
  start : Date
  end : Date
  flow_state : String
  fk_slot : ObjectId
  fk_procedure : ObjectId
  extra_procedures[x] : ObjectId
  urgency : Boolean
  study_iuid : String
  accession_number : String
  accession_date : String
  anamnesis : String
  indications : String
  report_before : Date
  media.CD : Boolean
  media.DVD : Boolean
  media.acetate_sheets : Boolean
  contrast.use_contrast : Boolean
  contrast.description : String
  current_address.country : String
  current_address.state : String
  current_address.city : String
  current_address.neighborhood : String
  current_address.address : String
  private_health.height : Number
  private_health.weight : Number
  private_health.diabetes : Boolean
  private_health.hypertension : Boolean
  private_health.epoc : Boolean
  private_health.smoking : Boolean
  private_health.malnutrition : Boolean
  private_health.obesity : Boolean
  private_health.hiv : Boolean
  private_health.renal_insufficiency : Boolean
  private_health.heart_failure : Boolean
  private_health.ischemic_heart_disease : Boolean
  private_health.valvulopathy : Boolean
  private_health.arrhythmia : Boolean
  private_health.cancer : Boolean
  private_health.dementia : Boolean
  private_health.claustrophobia : Boolean
  private_health.asthma : Boolean
  private_health.hyperthyroidism : Boolean
  private_health.hypothyroidism : Boolean
  private_health.pregnancy : Boolean
  private_health.medication : String
  private_health.allergies : String
  private_health.other : String
  private_health.implants.cochlear_implant : Boolean
  private_health.implants.cardiac_stent : Boolean
  private_health.implants.metal_prostheses : Boolean
  private_health.implants.metal_shards : Boolean
  private_health.implants.pacemaker : Boolean
  private_health.implants.other : String
  private_health.covid19.had_covid : Boolean
  private_health.covid19.vaccinated : Boolean
  private_health.covid19.details : String
  consents.informed_consent : ObjectId
  consents.clinical_trial : ObjectId
  outpatient : Boolean
  inpatient.type : Number
  inpatient.where : String
  inpatient.room : String
  inpatient.contact : String
  attached_files[x] : ObjectId
  cancellation_reasons : Number
  status : Boolean
  overbooking : Boolean
}

class appointments_drafts {
  fk_appointment_request : ObjectId
  imaging.organization : ObjectId
  imaging.branch : ObjectId
  imaging.service : ObjectId
  fk_patient : ObjectId
  fk_coordinator : ObjectId
  start : Date
  end : Date
  fk_slot : ObjectId
  fk_procedure : ObjectId
  extra_procedures[x] : ObjectId
  urgency : Boolean
  friendly_pass : String
  overbooking : Boolean
}

class branches {
  fk_organization : ObjectId
  name : String
  short_name : String
  OID : String
  country_code : String
  structure_id : String
  suffix : String
  status : Boolean
  base64_logo : String
  appointment_footer : String
}

class equipments {
  fk_modalities[x] : ObjectId
  fk_branch : ObjectId
  name : String
  serial_number : String
  AET : String
  status : Boolean
}

class files {
  domain.organization : ObjectId
  domain.branch : ObjectId
  name : String
  base64 : String
}

class logs {
  fk_organization : ObjectId
  event : Number
  datetime : Date
  fk_user : ObjectId
  element.type : String
  element._id : ObjectId
  element.details : String
  ip_client : String
}

class modalities {
  code_meaning : String
  code_value : String
  status : Boolean
}

class organizations {
  name : String
  short_name : String
  OID : String
  country_code : String
  structure_id : String
  suffix : String
  status : Boolean
  base64_logo : String
  base64_cert : String
  password_cert : String
}

class pathologies {
  fk_organization : ObjectId
  name : String
  description : String
  status : Boolean
}

class people {
  documents[x].doc_country_code : String
  documents[x].doc_type : Number
  documents[x].document : String
  name_01 : String
  name_02 : String
  surname_01 : String
  surname_02 : String
  birth_date : Date
  gender : Number
  phone_numbers[x] : String
}

class performing {
  fk_appointment : ObjectId
  flow_state : String
  date : Date
  fk_equipment : ObjectId
  fk_procedure : ObjectId
  extra_procedures[x] : ObjectId
  cancellation_reasons : Number
  urgency : Boolean
  status : Boolean
  anesthesia.procedure : String
  anesthesia.professional_id : String
  anesthesia.document : String
  anesthesia.name : String
  anesthesia.surname : String
  injection.administered_volume : Number
  injection.administration_time : String
  injection.injection_user : ObjectId
  injection.pet_ct.batch : String
  injection.pet_ct.syringe_activity_full : Number
  injection.pet_ct.syringe_activity_empty : Number
  injection.pet_ct.administred_activity : Number
  injection.pet_ct.syringe_full_time : String
  injection.pet_ct.syringe_empty_time : String
  injection.pet_ct.laboratory_user : ObjectId
  acquisition.time : String
  acquisition.console_technician : ObjectId
  acquisition.observations : String
  observations : String
}

class procedure_categories {
  domain.organization : ObjectId
  domain.branch : ObjectId
  name : String
  fk_procedures[x] : ObjectId
}

class procedures {
  domain.organization : ObjectId
  domain.branch : ObjectId
  fk_modality : ObjectId
  name : String
  code : String
  snomed : String
  equipments[x].fk_equipment : ObjectId
  equipments[x].duration : Number
  preparation : String
  procedure_template : String
  report_template : String
  has_interview : Boolean
  informed_consent : Boolean
  status : Boolean
  coefficient : Number
  reporting_delay : Number
  wait_time : Number
}

class reports {
  fk_performing : ObjectId
  clinical_info : String
  procedure_description : String
  findings[x].fk_procedure : ObjectId
  findings[x].title : String
  findings[x].procedure_findings : String
  summary : String
  medical_signatures[x] : ObjectId
  fk_pathologies[x] : ObjectId
  authenticated.datetime : Date
  authenticated.fk_user : ObjectId
  authenticated.base64_report : String
}

class services {
  fk_branch : ObjectId
  fk_modality : ObjectId
  fk_equipments[x] : ObjectId
  name : String
  status : Boolean
}

class sessions {
  start : Date
  fk_user : ObjectId
  current_access.domain : ObjectId
  current_access.role : Number
  current_access.concession[x] : Number
}

class signatures {
  fk_organization : ObjectId
  fk_user : ObjectId
  sha2 : String
}

class slots {
  domain.organization : ObjectId
  domain.branch : ObjectId
  domain.service : ObjectId
  fk_equipment : ObjectId
  fk_procedure : ObjectId
  start : Date
  end : Date
  urgency : Boolean
}

class users {
  fk_person : ObjectId
  username : String
  password : String
  email : String
  permissions[x].organization : ObjectId
  permissions[x].branch : ObjectId
  permissions[x].service : ObjectId
  permissions[x].role : Number
  permissions[x].concession[x] : Number
  professional.id : String
  professional.description : String
  professional.workload : Number
  professional.vacation : Boolean
  settings.max_row : Number
  settings.viewer : String
  settings.language : String
  settings.theme : String
  status : Boolean
}

appointment_requests "1" --> "1" organizations
appointment_requests "1" --> "1" branches
appointment_requests "1" --> "1" procedures
appointment_requests "1" --> "1" modalities
appointments "1" --> "1" appointment_requests
appointments "1" --> "1" organizations
appointments "1" --> "1" branches
appointments "1" --> "1" services
appointments "1" --> "1" users
appointments "1" --> "1" slots
appointments "1" --> "*" procedures
appointments "1" --> "*" files
appointments_drafts "1" --> "1" appointment_requests
appointments_drafts "1" --> "1" organizations
appointments_drafts "1" --> "1" branches
appointments_drafts "1" --> "1" services
appointments_drafts "1" --> "1" users
appointments_drafts "1" --> "1" slots
appointments_drafts "1" --> "*" procedures
branches "1" --> "1" organizations
equipments "1" --> "*" modalities
equipments "1" --> "1" branches
files "1" --> "1" organizations
files "1" --> "1" branches
logs "1" --> "1" organizations
logs "1" --> "1" users
pathologies "1" --> "1" organizations
performing "1" --> "1" appointments
performing "1" --> "1" equipments
performing "1" --> "*" procedures
performing "1" --> "1" users
procedure_categories "1" --> "1" organizations
procedure_categories "1" --> "1" branches
procedure_categories "1" --> "*" procedures
procedures "1" --> "1" organizations
procedures "1" --> "1" branches
procedures "1" --> "1" modalities
procedures "1" --> "1" equipments
reports "1" --> "1" performing
reports "1" --> "1" procedures
reports "1" --> "*" signatures
reports "1" --> "*" pathologies
reports "1" --> "1" users
services "1" --> "1" branches
services "1" --> "1" modalities
services "1" --> "*" equipments
sessions "1" --> "1" users
signatures "1" --> "1" organizations
signatures "1" --> "1" users
slots "1" --> "1" organizations
slots "1" --> "1" branches
slots "1" --> "1" services
slots "1" --> "1" equipments
slots "1" --> "1" procedures
users "1" --> "1" people
