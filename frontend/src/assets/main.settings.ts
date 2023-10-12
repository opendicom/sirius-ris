export const mainSettings = {
    // Set app default settings:
    appSettings : {
        backend_url             : 'http://localhost:2000/',
        rabc_exclude_code       : 'exclude_code',
        secret_number           : 1618,    // Used on simple crypt
        file_max_size           : 10,      // Maximum size in MB allowed to upload files
      
        //Pager defaults:
        default_page_sizes      : [10, 25, 50, 100],
        check_in_default_size   : 1000,
      
        //Localization:
        default_country         : '858',
        default_country_isoCode : 'UY',
        default_country_name    : 'Uruguay',
        default_state_isoCode   : 'MO',
        default_state_name      : 'Montevideo',
        default_city_name       : 'Montevideo',
        default_doc_type        : '1',
        default_utc             : 'UTC-3' // To Fix Mongoose Timestamps in Pipes.
    },

    // Patient password keywords:
    passKeywords: ["eucalipto", "pino", "roble", "cedro", "romero", "ficus", "cactus", "tacuara", "manzano", "higuera", "tero", "carpincho", "mulita", "yacare", "cardenal", "golondrina", "benteveo", "chaja", "jaguar", "dorado"],

    // Defaul Localization:
    localization: {
        default_country         : '858',
        default_country_isoCode : 'UY',
        default_country_name    : 'Uruguay',
        default_state_isoCode   : 'MO',
        default_state_name      : 'Montevideo',
        default_city_name       : 'Montevideo',
        default_doc_type        : '1',
        default_utc             : 'UTC-3'
    },

    // Default FullCalendar configuration:
    fullCalendarOptions : {
        schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
        timeZone: 'local',
        allDaySlot: false,
        initialView: 'resourceTimeGridWeek',
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
        },
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
        },
        height: '650px',
        slotMinTime: '08:00:00',
        slotMaxTime: '18:00:00',
        slotDuration: '00:10:00',
        eventBorderColor: '#8244ee',
        eventColor: '#6130b6',
        eventTextColor: '#fff',
        headerToolbar: {
            start: 'datepicker today prev,next view_day,view_week',
            center: 'title',
            end: ''
        },
        resources: [],
        events: []
    },

    // Default CKEditor configuration:
    CKEditorConfig : {
        toolbar: {
          items: [
            //Heading:
            'heading',
            '|',
      
            //Alignment:
            'alignment',
            '|',
      
            //Basic styles
            'bold', 'italic', 'underline', 'strikethrough',
            '|',
            'subscript', 'superscript',
            '|',
      
            //Lists:
            'numberedList', 'bulletedList',
            '|',
      
            //Extra tools:
            'findAndReplace',
            'removeFormat'
          ],
      
          //Allow multiline in toolbar with '-':
          shouldNotGroupWhenFull: true
        },
      
        language: { ui: 'es', content: 'es' }
    }
};