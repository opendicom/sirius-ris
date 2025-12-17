# Data dictionary

_Automatically generated from Mongoose schemas._

---

## appointment_requests

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| imaging.organization | ObjectId | Yes | No |  | _id.organizations |
| imaging.branch | ObjectId | No | No |  | _id.branches |
| referring.organization | ObjectId | Yes | No |  | _id.organizations |
| referring.branch | ObjectId | No | No |  | _id.branches |
| flow_state | String | No | No |  |  |
| urgency | Boolean | No | No | false |  |
| annotations | String | No | No |  |  |
| patient.doc_country_code | String | No | No |  |  |
| patient.doc_type | Number | Yes | No |  |  |
| patient.document | String | Yes | No |  |  |
| patient.name_01 | String | Yes | No |  |  |
| patient.name_02 | String | No | No |  |  |
| patient.surname_01 | String | Yes | No |  |  |
| patient.surname_02 | String | No | No |  |  |
| patient.birth_date | Date | Yes | No |  |  |
| patient.gender | Number | Yes | No |  |  |
| patient.phone_numbers[x] | String | No | No |  |  |
| patient.email | String | No | No |  |  |
| study.fk_procedure | ObjectId | No | No |  | _id.procedures |
| study.snomed | String | No | No |  |  |
| study.fk_modality | ObjectId | No | No |  | _id.modalities |
| anamnesis | String | No | No |  |  |
| indications | String | No | No |  |  |
| extra.patient_id | String | No | No |  |  |
| extra.study_id | String | No | No |  |  |
| extra.physician_id | String | No | No |  |  |
| extra.physician_name | String | No | No |  |  |
| extra.physician_prof_id | String | No | No |  |  |
| extra.physician_contact | String | No | No |  |  |
| extra.requesting_id | String | No | No |  |  |
| extra.custom_fields[x] | String | No | No |  |  |

---

## appointments

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| fk_appointment_request | ObjectId | No | No |  | _id.appointment_requests |
| imaging.organization | ObjectId | Yes | No |  | _id.organizations |
| imaging.branch | ObjectId | Yes | No |  | _id.branches |
| imaging.service | ObjectId | Yes | No |  | _id.services |
| referring.organization | ObjectId | Yes | No |  | _id.organizations |
| referring.branch | ObjectId | No | No |  | _id.branches |
| referring.service | ObjectId | No | No |  | _id.services |
| referring.fk_referring | ObjectId | No | No |  | _id.users |
| reporting.organization | ObjectId | Yes | No |  | _id.organizations |
| reporting.branch | ObjectId | Yes | No |  | _id.branches |
| reporting.service | ObjectId | Yes | No |  | _id.services |
| reporting.fk_reporting[x] | ObjectId | No | No |  | _id.users |
| fk_patient | ObjectId | Yes | No |  | _id.users |
| contact | String | Yes | No |  |  |
| start | Date | Yes | No |  |  |
| end | Date | Yes | No |  |  |
| flow_state | String | Yes | No |  |  |
| fk_slot | ObjectId | Yes | No |  | _id.slots |
| fk_procedure | ObjectId | Yes | No |  | _id.procedures |
| extra_procedures[x] | ObjectId | No | No |  | _id.procedures |
| urgency | Boolean | Yes | No |  |  |
| study_iuid | String | No | No |  |  |
| accession_number | String | No | Yes |  |  |
| accession_date | String | No | No |  |  |
| anamnesis | String | No | No |  |  |
| indications | String | No | No |  |  |
| report_before | Date | Yes | No |  |  |
| media.CD | Boolean | No | No |  |  |
| media.DVD | Boolean | No | No |  |  |
| media.acetate_sheets | Boolean | No | No |  |  |
| contrast.use_contrast | Boolean | Yes | No |  |  |
| contrast.description | String | No | No |  |  |
| current_address.country | String | No | No |  |  |
| current_address.state | String | No | No |  |  |
| current_address.city | String | No | No |  |  |
| current_address.neighborhood | String | No | No |  |  |
| current_address.address | String | No | No |  |  |
| private_health.height | Number | Yes | No |  |  |
| private_health.weight | Number | Yes | No |  |  |
| private_health.diabetes | Boolean | Yes | No | false |  |
| private_health.hypertension | Boolean | Yes | No | false |  |
| private_health.epoc | Boolean | Yes | No | false |  |
| private_health.smoking | Boolean | Yes | No | false |  |
| private_health.malnutrition | Boolean | Yes | No | false |  |
| private_health.obesity | Boolean | Yes | No | false |  |
| private_health.hiv | Boolean | Yes | No | false |  |
| private_health.renal_insufficiency | Boolean | Yes | No | false |  |
| private_health.heart_failure | Boolean | Yes | No | false |  |
| private_health.ischemic_heart_disease | Boolean | Yes | No | false |  |
| private_health.valvulopathy | Boolean | Yes | No | false |  |
| private_health.arrhythmia | Boolean | Yes | No | false |  |
| private_health.cancer | Boolean | Yes | No | false |  |
| private_health.dementia | Boolean | Yes | No | false |  |
| private_health.claustrophobia | Boolean | Yes | No | false |  |
| private_health.asthma | Boolean | Yes | No | false |  |
| private_health.hyperthyroidism | Boolean | Yes | No | false |  |
| private_health.hypothyroidism | Boolean | Yes | No | false |  |
| private_health.pregnancy | Boolean | Yes | No | false |  |
| private_health.medication | String | No | No | No |  |
| private_health.allergies | String | No | No | No |  |
| private_health.other | String | No | No | No |  |
| private_health.implants.cochlear_implant | Boolean | Yes | No | false |  |
| private_health.implants.cardiac_stent | Boolean | Yes | No | false |  |
| private_health.implants.metal_prostheses | Boolean | Yes | No | false |  |
| private_health.implants.metal_shards | Boolean | Yes | No | false |  |
| private_health.implants.pacemaker | Boolean | Yes | No | false |  |
| private_health.implants.other | String | No | No | No |  |
| private_health.covid19.had_covid | Boolean | Yes | No | false |  |
| private_health.covid19.vaccinated | Boolean | Yes | No | false |  |
| private_health.covid19.details | String | No | No |  |  |
| consents.informed_consent | ObjectId | No | No |  | _id.files |
| consents.clinical_trial | ObjectId | No | No |  | _id.files |
| outpatient | Boolean | Yes | No |  |  |
| inpatient.type | Number | No | No |  |  |
| inpatient.where | String | No | No |  |  |
| inpatient.room | String | No | No |  |  |
| inpatient.contact | String | No | No |  |  |
| attached_files[x] | ObjectId | No | No |  | _id.files |
| cancellation_reasons | Number | No | No |  |  |
| status | Boolean | Yes | No | false |  |
| overbooking | Boolean | No | No |  |  |

---

## appointments_drafts

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| fk_appointment_request | ObjectId | No | No |  | _id.appointment_requests |
| imaging.organization | ObjectId | Yes | No |  | _id.organizations |
| imaging.branch | ObjectId | Yes | No |  | _id.branches |
| imaging.service | ObjectId | Yes | No |  | _id.services |
| fk_patient | ObjectId | Yes | No |  | _id.users |
| fk_coordinator | ObjectId | Yes | No |  | _id.users |
| start | Date | Yes | No |  |  |
| end | Date | Yes | No |  |  |
| fk_slot | ObjectId | Yes | No |  | _id.slots |
| fk_procedure | ObjectId | Yes | No |  | _id.procedures |
| extra_procedures[x] | ObjectId | No | No |  | _id.procedures |
| urgency | Boolean | Yes | No |  |  |
| friendly_pass | String | No | No |  |  |
| overbooking | Boolean | No | No |  |  |

---

## branches

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| fk_organization | ObjectId | Yes | No |  | _id.organizations |
| name | String | Yes | No |  |  |
| short_name | String | Yes | No |  |  |
| OID | String | No | No |  |  |
| country_code | String | Yes | No |  |  |
| structure_id | String | No | No |  |  |
| suffix | String | No | No |  |  |
| status | Boolean | Yes | No | false |  |
| base64_logo | String | No | No |  |  |
| appointment_footer | String | No | No |  |  |

---

## equipments

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| fk_modalities[x] | ObjectId | Yes | No |  | _id.modalities |
| fk_branch | ObjectId | Yes | No |  | _id.branches |
| name | String | Yes | No |  |  |
| serial_number | String | No | No |  |  |
| AET | String | No | No |  |  |
| status | Boolean | Yes | No | false |  |

---

## files

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| domain.organization | ObjectId | Yes | No |  | _id.organizations |
| domain.branch | ObjectId | Yes | No |  | _id.branches |
| name | String | No | No |  |  |
| base64 | String | No | No |  |  |

---

## logs

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| fk_organization | ObjectId | Yes | No |  | _id.organizations |
| event | Number | Yes | No |  |  |
| datetime | Date | Yes | No |  |  |
| fk_user | ObjectId | Yes | No |  | _id.users |
| element.type | String | Yes | No |  |  |
| element._id | ObjectId | Yes | No |  |  |
| element.details | String | No | No |  |  |
| ip_client | String | Yes | No |  |  |

---

## modalities

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| code_meaning | String | Yes | No |  |  |
| code_value | String | Yes | No |  |  |
| status | Boolean | Yes | No | false |  |

---

## organizations

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| name | String | Yes | No |  |  |
| short_name | String | Yes | No |  |  |
| OID | String | No | No |  |  |
| country_code | String | Yes | No |  |  |
| structure_id | String | No | No |  |  |
| suffix | String | No | No |  |  |
| status | Boolean | Yes | No | false |  |
| base64_logo | String | No | No |  |  |
| base64_cert | String | No | No |  |  |
| password_cert | String | No | No |  |  |

---

## pathologies

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| fk_organization | ObjectId | Yes | No |  | _id.organizations |
| name | String | Yes | No |  |  |
| description | String | No | No |  |  |
| status | Boolean | Yes | No | false |  |

---

## people

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| documents[x].doc_country_code | String | Yes | No |  |  |
| documents[x].doc_type | Number | Yes | No |  |  |
| documents[x].document | String | Yes | No |  |  |
| name_01 | String | Yes | No |  |  |
| name_02 | String | No | No |  |  |
| surname_01 | String | Yes | No |  |  |
| surname_02 | String | No | No |  |  |
| birth_date | Date | Yes | No |  |  |
| gender | Number | Yes | No |  |  |
| phone_numbers[x] | String | No | No |  |  |

---

## performing

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| fk_appointment | ObjectId | Yes | No |  | _id.appointments |
| flow_state | String | Yes | No |  |  |
| date | Date | Yes | No |  |  |
| fk_equipment | ObjectId | Yes | No |  | _id.equipments |
| fk_procedure | ObjectId | Yes | No |  | _id.procedures |
| extra_procedures[x] | ObjectId | No | No |  | _id.procedures |
| cancellation_reasons | Number | No | No |  |  |
| urgency | Boolean | Yes | No |  |  |
| status | Boolean | Yes | No | false |  |
| anesthesia.procedure | String | Yes | No |  |  |
| anesthesia.professional_id | String | Yes | No |  |  |
| anesthesia.document | String | Yes | No |  |  |
| anesthesia.name | String | Yes | No |  |  |
| anesthesia.surname | String | Yes | No |  |  |
| injection.administered_volume | Number | Yes | No |  |  |
| injection.administration_time | String | Yes | No |  |  |
| injection.injection_user | ObjectId | Yes | No |  |  |
| injection.pet_ct.batch | String | No | No |  |  |
| injection.pet_ct.syringe_activity_full | Number | Yes | No |  |  |
| injection.pet_ct.syringe_activity_empty | Number | Yes | No |  |  |
| injection.pet_ct.administred_activity | Number | Yes | No |  |  |
| injection.pet_ct.syringe_full_time | String | Yes | No |  |  |
| injection.pet_ct.syringe_empty_time | String | Yes | No |  |  |
| injection.pet_ct.laboratory_user | ObjectId | Yes | No |  | _id.users |
| acquisition.time | String | Yes | No |  |  |
| acquisition.console_technician | ObjectId | Yes | No |  | _id.users |
| acquisition.observations | String | No | No |  |  |
| observations | String | No | No |  |  |

---

## procedure_categories

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| domain.organization | ObjectId | Yes | No |  | _id.organizations |
| domain.branch | ObjectId | Yes | No |  | _id.branches |
| name | String | Yes | No |  |  |
| fk_procedures[x] | ObjectId | Yes | No |  | _id.procedures |

---

## procedures

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| domain.organization | ObjectId | Yes | No |  | _id.organizations |
| domain.branch | ObjectId | Yes | No |  | _id.branches |
| fk_modality | ObjectId | Yes | No |  | _id.modalities |
| name | String | Yes | No |  |  |
| code | String | No | No |  |  |
| snomed | String | No | No |  |  |
| equipments[x].fk_equipment | ObjectId | Yes | No |  | _id.equipments |
| equipments[x].duration | Number | Yes | No |  |  |
| preparation | String | No | No |  |  |
| procedure_template | String | No | No |  |  |
| report_template | String | No | No |  |  |
| has_interview | Boolean | Yes | No |  |  |
| informed_consent | Boolean | Yes | No |  |  |
| status | Boolean | Yes | No | false |  |
| coefficient | Number | No | No |  |  |
| reporting_delay | Number | No | No |  |  |
| wait_time | Number | No | No |  |  |

---

## reports

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| fk_performing | ObjectId | Yes | No |  | _id.performings |
| clinical_info | String | Yes | No |  |  |
| procedure_description | String | Yes | No |  |  |
| findings[x].fk_procedure | ObjectId | Yes | No |  | _id.procedures |
| findings[x].title | String | Yes | No |  |  |
| findings[x].procedure_findings | String | Yes | No |  |  |
| summary | String | No | No |  |  |
| medical_signatures[x] | ObjectId | No | No |  | _id.signatures |
| fk_pathologies[x] | ObjectId | No | No |  | _id.pathologies |
| authenticated.datetime | Date | No | No |  |  |
| authenticated.fk_user | ObjectId | No | No |  | _id.users |
| authenticated.base64_report | String | No | No |  |  |

---

## services

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| fk_branch | ObjectId | Yes | No |  | _id.branches |
| fk_modality | ObjectId | Yes | No |  | _id.modalities |
| fk_equipments[x] | ObjectId | Yes | No |  | _id.equipments |
| name | String | Yes | No |  |  |
| status | Boolean | Yes | No | false |  |

---

## sessions

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| start | Date | Yes | No |  |  |
| fk_user | ObjectId | Yes | No |  | _id.users |
| current_access.domain | ObjectId | Yes | No |  |  |
| current_access.role | Number | Yes | No |  |  |
| current_access.concession[x] | Number | No | No |  |  |

---

## signatures

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| fk_organization | ObjectId | No | No |  | _id.organizations |
| fk_user | ObjectId | Yes | No |  | _id.users |
| sha2 | String | No | No |  |  |

---

## slots

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| domain.organization | ObjectId | Yes | No |  | _id.organizations |
| domain.branch | ObjectId | Yes | No |  | _id.branches |
| domain.service | ObjectId | Yes | No |  | _id.services |
| fk_equipment | ObjectId | Yes | No |  | _id.equipments |
| fk_procedure | ObjectId | No | No |  | _id.procedures |
| start | Date | Yes | No |  |  |
| end | Date | Yes | No |  |  |
| urgency | Boolean | Yes | No | false |  |

---

## users

| Field | Type | Required | Unique | Default | References |
|------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | PK |
| fk_person | ObjectId | No | No |  | _id.people |
| username | String | No | No |  |  |
| password | String | Yes | No |  |  |
| email | String | No | No |  |  |
| permissions[x].organization | ObjectId | No | No |  |  |
| permissions[x].branch | ObjectId | No | No |  |  |
| permissions[x].service | ObjectId | No | No |  |  |
| permissions[x].role | Number | Yes | No |  |  |
| permissions[x].concession[x] | Number | No | No |  |  |
| professional.id | String | No | No |  |  |
| professional.description | String | No | No |  |  |
| professional.workload | Number | No | No |  |  |
| professional.vacation | Boolean | No | No |  |  |
| settings.max_row | Number | No | No |  |  |
| settings.viewer | String | No | No |  |  |
| settings.language | String | No | No |  |  |
| settings.theme | String | No | No |  |  |
| status | Boolean | Yes | No | false |  |

---

