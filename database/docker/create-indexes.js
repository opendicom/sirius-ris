db = db.getSiblingDB("sirius_db");

try { db.users.createIndex({ fk_person: 1 }); print("Índice creado: users.fk_person"); } catch (e) { print("Error en users.fk_person: " + e); }

try { db.logs.createIndex({ fk_organization: 1 }); print("Índice creado: logs.fk_organization"); } catch (e) { print("Error en logs.fk_organization: " + e); }
try { db.logs.createIndex({ fk_user: 1 }); print("Índice creado: logs.fk_user"); } catch (e) { print("Error en logs.fk_user: " + e); }

try { db.sessions.createIndex({ fk_user: 1 }); print("Índice creado: sessions.fk_user"); } catch (e) { print("Error en sessions.fk_user: " + e); }

try { db.branches.createIndex({ fk_organization: 1 }); print("Índice creado: branches.fk_organization"); } catch (e) { print("Error en branches.fk_organization: " + e); }

try { db.services.createIndex({ fk_branch: 1 }); print("Índice creado: services.fk_branch"); } catch (e) { print("Error en services.fk_branch: " + e); }
try { db.services.createIndex({ fk_modality: 1 }); print("Índice creado: services.fk_modality"); } catch (e) { print("Error en services.fk_modality: " + e); }
try { db.services.createIndex({ fk_equipments: 1 }); print("Índice creado: services.fk_equipments"); } catch (e) { print("Error en services.fk_equipments: " + e); }

try { db.equipments.createIndex({ fk_branch: 1 }); print("Índice creado: equipments.fk_branch"); } catch (e) { print("Error en equipments.fk_branch: " + e); }
try { db.equipments.createIndex({ fk_modalities: 1 }); print("Índice creado: equipments.fk_modalities"); } catch (e) { print("Error en equipments.fk_modalities: " + e); }

try { db.procedures.createIndex({ "domain.organization": 1 }); print("Índice creado: procedures.domain.organization"); } catch (e) { print("Error en procedures.domain.organization: " + e); }
try { db.procedures.createIndex({ "domain.branch": 1 }); print("Índice creado: procedures.domain.branch"); } catch (e) { print("Error en procedures.domain.branch: " + e); }
try { db.procedures.createIndex({ fk_modality: 1 }); print("Índice creado: procedures.fk_modality"); } catch (e) { print("Error en procedures.fk_modality: " + e); }

try { db.procedure_categories.createIndex({ "domain.organization": 1 }); print("Índice creado: procedure_categories.domain.organization"); } catch (e) { print("Error en procedure_categories.domain.organization: " + e); }
try { db.procedure_categories.createIndex({ "domain.branch": 1 }); print("Índice creado: procedure_categories.domain.branch"); } catch (e) { print("Error en procedure_categories.domain.branch: " + e); }
try { db.procedure_categories.createIndex({ fk_procedures: 1 }); print("Índice creado: procedure_categories.fk_procedures"); } catch (e) { print("Error en procedure_categories.fk_procedures: " + e); }

try { db.slots.createIndex({ "domain.organization": 1 }); print("Índice creado: slots.domain.organization"); } catch (e) { print("Error en slots.domain.organization: " + e); }
try { db.slots.createIndex({ "domain.branch": 1 }); print("Índice creado: slots.domain.branch"); } catch (e) { print("Error en slots.domain.branch: " + e); }
try { db.slots.createIndex({ "domain.service": 1 }); print("Índice creado: slots.domain.service"); } catch (e) { print("Error en slots.domain.service: " + e); }
try { db.slots.createIndex({ fk_equipment: 1 }); print("Índice creado: slots.fk_equipment"); } catch (e) { print("Error en slots.fk_equipment: " + e); }
try { db.slots.createIndex({ fk_procedure: 1 }); print("Índice creado: slots.fk_procedure"); } catch (e) { print("Error en slots.fk_procedure: " + e); }

try { db.files.createIndex({ "domain.organization": 1 }); print("Índice creado: files.domain.organization"); } catch (e) { print("Error en files.domain.organization: " + e); }
try { db.files.createIndex({ "domain.branch": 1 }); print("Índice creado: files.domain.branch"); } catch (e) { print("Error en files.domain.branch: " + e); }

try { db.appointment_requests.createIndex({ "imaging.organization": 1 }); print("Índice creado: appointment_requests.imaging.organization"); } catch (e) { print("Error en appointment_requests.imaging.organization: " + e); }
try { db.appointment_requests.createIndex({ "imaging.branch": 1 }); print("Índice creado: appointment_requests.imaging.branch"); } catch (e) { print("Error en appointment_requests.imaging.branch: " + e); }
try { db.appointment_requests.createIndex({ "referring.organization": 1 }); print("Índice creado: appointment_requests.referring.organization"); } catch (e) { print("Error en appointment_requests.referring.organization: " + e); }
try { db.appointment_requests.createIndex({ "referring.branch": 1 }); print("Índice creado: appointment_requests.referring.branch"); } catch (e) { print("Error en appointment_requests.referring.branch: " + e); }
try { db.appointment_requests.createIndex({ "study.fk_procedure": 1 }); print("Índice creado: appointment_requests.study.fk_procedure"); } catch (e) { print("Error en appointment_requests.study.fk_procedure: " + e); }
try { db.appointment_requests.createIndex({ "study.fk_modality": 1 }); print("Índice creado: appointment_requests.study.fk_modality"); } catch (e) { print("Error en appointment_requests.study.fk_modality: " + e); }

try { db.appointments_drafts.createIndex({ "imaging.organization": 1 }); print("Índice creado: appointments_drafts.imaging.organization"); } catch (e) { print("Error en appointments_drafts.imaging.organization: " + e); }
try { db.appointments_drafts.createIndex({ "imaging.branch": 1 }); print("Índice creado: appointments_drafts.imaging.branch"); } catch (e) { print("Error en appointments_drafts.imaging.branch: " + e); }
try { db.appointments_drafts.createIndex({ "imaging.service": 1 }); print("Índice creado: appointments_drafts.imaging.service"); } catch (e) { print("Error en appointments_drafts.imaging.service: " + e); }
try { db.appointments_drafts.createIndex({ fk_patient: 1 }); print("Índice creado: appointments_drafts.fk_patient"); } catch (e) { print("Error en appointments_drafts.fk_patient: " + e); }
try { db.appointments_drafts.createIndex({ fk_coordinator: 1 }); print("Índice creado: appointments_drafts.fk_coordinator"); } catch (e) { print("Error en appointments_drafts.fk_coordinator: " + e); }
try { db.appointments_drafts.createIndex({ fk_slot: 1 }); print("Índice creado: appointments_drafts.fk_slot"); } catch (e) { print("Error en appointments_drafts.fk_slot: " + e); }
try { db.appointments_drafts.createIndex({ fk_procedure: 1 }); print("Índice creado: appointments_drafts.fk_procedure"); } catch (e) { print("Error en appointments_drafts.fk_procedure: " + e); }
try { db.appointments_drafts.createIndex({ fk_appointments_request: 1 }); print("Índice creado: appointments_drafts.fk_appointments_request"); } catch (e) { print("Error en appointments_drafts.fk_appointments_request: " + e); }

try { db.appointments.createIndex({ "imaging.organization": 1 }); print("Índice creado: appointments.imaging.organization"); } catch (e) { print("Error en appointments.imaging.organization: " + e); }
try { db.appointments.createIndex({ "imaging.branch": 1 }); print("Índice creado: appointments.imaging.branch"); } catch (e) { print("Error en appointments.imaging.branch: " + e); }
try { db.appointments.createIndex({ "imaging.service": 1 }); print("Índice creado: appointments.imaging.service"); } catch (e) { print("Error en appointments.imaging.service: " + e); }
try { db.appointments.createIndex({ "referring.organization": 1 }); print("Índice creado: appointments.referring.organization"); } catch (e) { print("Error en appointments.referring.organization: " + e); }
try { db.appointments.createIndex({ "referring.branch": 1 }); print("Índice creado: appointments.referring.branch"); } catch (e) { print("Error en appointments.referring.branch: " + e); }
try { db.appointments.createIndex({ "referring.service": 1 }); print("Índice creado: appointments.referring.service"); } catch (e) { print("Error en appointments.referring.service: " + e); }
try { db.appointments.createIndex({ "reporting.organization": 1 }); print("Índice creado: appointments.reporting.organization"); } catch (e) { print("Error en appointments.reporting.organization: " + e); }
try { db.appointments.createIndex({ "reporting.branch": 1 }); print("Índice creado: appointments.reporting.branch"); } catch (e) { print("Error en appointments.reporting.branch: " + e); }
try { db.appointments.createIndex({ "reporting.service": 1 }); print("Índice creado: appointments.reporting.service"); } catch (e) { print("Error en appointments.reporting.service: " + e); }
try { db.appointments.createIndex({ "reporting.fk_reporting": 1 }); print("Índice creado: appointments.reporting.fk_reporting"); } catch (e) { print("Error en appointments.reporting.fk_reporting: " + e); }
try { db.appointments.createIndex({ fk_patient: 1 }); print("Índice creado: appointments.fk_patient"); } catch (e) { print("Error en appointments.fk_patient: " + e); }
try { db.appointments.createIndex({ fk_slot: 1 }); print("Índice creado: appointments.fk_slot"); } catch (e) { print("Error en appointments.fk_slot: " + e); }
try { db.appointments.createIndex({ fk_procedure: 1 }); print("Índice creado: appointments.fk_procedure"); } catch (e) { print("Error en appointments.fk_procedure: " + e); }
try { db.appointments.createIndex({ fk_appointment_request: 1 }); print("Índice creado: appointments.fk_appointment_request"); } catch (e) { print("Error en appointments.fk_appointment_request: " + e); }

try { db.performing.createIndex({ fk_appointment: 1 }); print("Índice creado: performing.fk_appointment"); } catch (e) { print("Error en performing.fk_appointment: " + e); }
try { db.performing.createIndex({ fk_equipment: 1 }); print("Índice creado: performing.fk_equipment"); } catch (e) { print("Error en performing.fk_equipment: " + e); }
try { db.performing.createIndex({ fk_procedure: 1 }); print("Índice creado: performing.fk_procedure"); } catch (e) { print("Error en performing.fk_procedure: " + e); }

try { db.reports.createIndex({ fk_performing: 1 }); print("Índice creado: reports.fk_performing"); } catch (e) { print("Error en reports.fk_performing: " + e); }
try { db.reports.createIndex({ "authenticated.fk_user": 1 }); print("Índice creado: reports.authenticated.fk_user"); } catch (e) { print("Error en reports.authenticated.fk_user: " + e); }
try { db.reports.createIndex({ medical_signatures: 1 }); print("Índice creado: reports.medical_signatures"); } catch (e) { print("Error en reports.medical_signatures: " + e); }
try { db.reports.createIndex({ fk_pathologies: 1 }); print("Índice creado: reports.fk_pathologies"); } catch (e) { print("Error en reports.fk_pathologies: " + e); }

try { db.pathologies.createIndex({ fk_organization: 1 }); print("Índice creado: pathologies.fk_organization"); } catch (e) { print("Error en pathologies.fk_organization: " + e); }

try { db.signatures.createIndex({ fk_organization: 1 }); print("Índice creado: signatures.fk_organization"); } catch (e) { print("Error en signatures.fk_organization: " + e); }
try { db.signatures.createIndex({ fk_user: 1 }); print("Índice creado: signatures.fk_user"); } catch (e) { print("Error en signatures.fk_user: " + e); }

