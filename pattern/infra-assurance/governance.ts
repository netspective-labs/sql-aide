#!/usr/bin/env -S deno run --allow-all

export enum OrganizationRoleType {
  PROJECT_MANAGER_TECHNOLOGY = "Project Manager Technology",
  PROJECT_MANAGER_QUALITY = "Project Manager Quality",
  PROJECT_MANAGER_DEVOPS = "Project Manager DevOps",
  ASSOCIATE_MANAGER_TECHNOLOGY = "Associated Manager Technology",
  ASSOCIATE_MANAGER_QUALITY = "Associate Manager Quality",
  ASSOCIATE_MANAGER_DEVOPS = "Associate Manager DevOps",
  SENIOR_LEAD_SOFTWARE_ENGINEER_ARCHITECT =
    "Senior Lead Software Engineer Architect",
  LEAD_SOFTWARE_ENGINEER_ARCHITECT = "Lead Software Engineer Architect",
  SENIOR_LEAD_SOFTWARE_QUALITY_ENGINEER =
    "Senior Lead Software Quality Engineer",
  SENIOR_LEAD_SOFTWARE_DEVOPS_ENGINEER = "Senior Lead Software DevOps Engineer",
  LEAD_SOFTWARE_ENGINEER = "Lead Software Engineer",
  LEAD_SOFTWARE_QUALITY_ENGINEER = "Lead Software Quality Engineer",
  LEAD_SOFTWARE_DEVOPS_ENGINEER = "Lead Software DevOps Engineer",
  LEAD_SYSTEM_NETWORK_ENGINEER = "Lead System Network Engineer",
  SENIOR_SOFTWARE_ENGINEER = "Senior Software Engineer",
  SENIOR_SOFTWARE_QUALITY_ENGINEER = "Senior Software Quality Engineer",
  SOFTWARE_QUALITY_ENGINEER = "Software Quality Engineer",
  SECURITY_ENGINEER = "Security Engineer",
}

export enum PartyType {
  PERSON = "Person",
  ORGANIZATION = "Organization",
}

export enum PartyRole {
  CUSTOMER = "Customer",
  VENDOR = "Vendor",
}

export enum PartyRelationType {
  PERSON_TO_PERSON = "Person To Person",
  ORGANIZATION_TO_PERSON = "Organization To Person",
  ORGANIZATION_TO_ORGANIZATION = "Organization To Organization",
}

export enum PartyIdentifierType {
  UUID = "UUID",
  DRIVING_LICENSE = "Driving License",
  PASSPORT = "Passport",
}

export enum PersonType {
  INDIVIDUAL = "Individual",
  PROFESSIONAL = "Professional",
}

export enum ContactType {
  HOME_ADDRESS = "Home Address",
  OFFICIAL_ADDRESS = "Official Address",
  MOBILE_PHONE_NUMBER = "Mobile Phone Number",
  LAND_PHONE_NUMBER = "Land Phone Number",
  OFFICIAL_EMAIL = "Official Email",
  PERSONAL_EMAIL = "Personal Email",
}

export enum TrainingSubject {
  HIPAA = "HIPAA",
  CYBER_SECURITY = "Cyber Security",
  OBSERVABILITY_OPEN_TELEMETRY = "Observability Open Telemetry",
  BEST_PRACTICES_OF_AGILE = "Practices of Agile Workflow",
}

export enum StatusValues {
  YES = "Yes",
  NO = "No",
}

/**
 * Reference URL: https://schema.org/ratingValue
 */

export enum RatingValue {
  ONE = "1",
  TWO = "2",
  THREE = "3",
  FOUR = "4",
  FIVE = "5",
}

export enum ContractType {
  GENERAL_CONTRACT_FOR_SERVICES = "General Contract for Services",
  EMPLOYMENT_AGREEMENT = "Employment Agreement",
  NONCOMPETE_AGREEMENT = "Noncompete Agreement",
  VENDOR_SLA = "Vendor SLA",
  VENDOR_NDA = "Vendor NDA",
}

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/enum_project_risk_type_enum.html
 */

export enum RiskType {
  BUDGET = "Budget",
  QUALITY = "Quality",
  SCHEDULE = "Schedule",
  SCHEDULE_AND_BUDGET = "Schedule And Budget",
}

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/enum_payment_type_enum.html
 */

export enum PaymentType {
  BOTH = "Both",
  LOANS = "Loans",
  NONE = "None",
  RENTS = "Rents",
}

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */

export enum Periodicity {
  ANNUAL = "Annual",
  BI_MONTHLY = "Bi Monthly",
  BI_WEEKLY = "Bi Weekly",
  DAILY = "Daily",
  MONTHLY = "Monthly",
  OTHER = "Other",
  QUARTERLY = "Quarterly",
  SEMI_ANNUAL = "Semi Annual",
  SEMI_MONTHLY = "Semi Monthly",
  WEEKLY = "Weekly",
}

export enum BoundaryNature {
  REGULATORY_TAX_ID = "Regulatory Tax ID", // like an "official" company (something with a Tax ID)
}

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */

export enum TimeEntryCategory {
  MISC_MEETINGS = "Misc Meetings",
  MISC_OTHER = "Misc Other",
  MISC_VACATION = "Misc Vacation",
  MISC_WORK_ITEM = "Misc Work Item",
  PACKAGE = "Package",
  PROJECT = "Project",
  REQUEST = "Request",
  TASK = "Task",
}

export enum RaciMatrixSubject {
  PROJECT_LEADERSHIP = "Project Leadership",
  PROJECT_MANAGEMENT = "Project Management",
  APPLICATION_DEVELOPMENT = "Application Development",
  DEV_OPERATIONS = "Dev Operations",
  QUALITY_ASSURANCE = "Quality Assurance",
  SEARCH_ENGINE_OPTIMIZATION = "Search Engine Optimization",
  USER_INTERFASE_USABILITY = "User Interfase And Usability",
  BUSINESS_ANALYST = "Business Analyst (Abm)",
  CURATION_COORDINATION = "Curation Coordination",
  KNOWLEDGE_REPRESENTATION = "Knowledge Representation",
  MARKETING_OUTREACH = "Marketing Outreach",
  CURATION_WORKS = "Curation Works",
}

/**
 * Reference URL: https://advisera.com/27001academy/blog/2018/11/05/raci-matrix-for-iso-27001-implementation-project/
 */

export enum RaciMatrixAssignmentNature {
  RESPONSIBLE = "Responsible",
  ACCOUNTABLE = "Accountable",
  CONSULTED = "Consulted",
  INFORMED = "Informed",
}

// TODO:
// - [ ] Need to update it to the standard way with the skill registry url

export enum SkillNature {
  SOFTWARE = "Software",
  HARDWARE = "Hardware",
}

export enum Skill {
  ANGULAR = "Angular",
  DENO = "Deno",
  TYPESCRIPT = "Typescript",
  POSTGRESQL = "Postgresql",
  MYSQL = "Mysql",
  HUGO = "Hugo",
  PHP = "Php",
  JAVASCRIPT = "JavaScript",
  PYTHON = "Python",
  DOT_NET = ".Net",
  ORACLE = "Oracle",
  JAVA = "Java",
  JQUERY = "JQuery",
  OSQUERY = "Osquery",
  REACTJS = "ReactJs",
}

/**
 * Reference URL: https://hr.nih.gov/about/faq/working-nih/competencies/what-nih-proficiency-scale
 */
export enum ProficiencyScale {
  NA = "Not Applicable",
  FUNDAMENTAL_AWARENESS = "Fundamental Awareness (basic knowledge)",
  NOVICE = "Novice (limited experience)",
  INTERMEDIATE = "Intermediate (practical application)",
  ADVANCED = "Advanced (applied theory)",
  EXPERT = "Expert (recognized authority)",
}

/**
 * Reference URL: https://source.whitehatsec.com/help/sentinel/secops/vulnerability-status.html
 */
export enum VulnerabilityStatus {
  OPEN = "Open",
  CLOSED = "Closed",
  ACCEPTED = "Accepted",
  OUT_OF_SCOPE = "Out of Scope",
  MITIGATED = "Mitigated",
  INVALID = "Invalid",
}

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/enum_asset_status_enum.html
 */
export enum AssetStatus {
  AWAITING_RECEIPT = "Awaiting Receipt",
  IN_STOCK = "In Stock",
  IN_USE = "In Use",
  MISSING = "Missing",
  RETIRED = "Retired",
  RETURNED_FOR_MAINTENANCE = "Returned For Maintenance",
  RETURNED_TO_SUPPLIER = "Returned To Supplier	",
  UNDEFINED = "Undefined",
}

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */
export enum AssetType {
  ACCOUNT = "Account",
  BUSINESS_SERVICE = "Business Service",
  CABLE = "Cable",
  CABLE_DEVICE = "Cable Device",
  COLLECTIVE_EQUIPMENT = "Collective Equipment",
  COMPUTER = "Computer",
  CPU = "Cpu",
  DOMAIN = "Domain",
  SERVER = "Server",
  EXTENSION_CARD = "Extension Card",
  GLOBAL_SOFTWARE_LICENSE = "Global Software License",
  LAPTOP = "Laptop",
  LASER_PRINTER = "Laser Printer",
  LICENSE_CONTRACT = "License Contract",
  MAINTENANCE_CONTRACT = "Maintenance Contract",
  MASS_STORAGE = "Mass Storage",
  MOBILE_DEVICE = "Mobile Device",
  MONITOR = "Monitor",
  NETWORK_HARDWARE = "Network Hardware",
  NETWORK_INTERFACE = "Network Interface",
  OEM_SOFTWARE_LICENSE = "Oem Software License",
  PRINTER = "Printer",
  RACKMOUNT_MONITOR = "Rackmount Monitor",
  SCANNER = "Scanner",
  SOFTWARE_ACCESS_AUTHORIZATION = "Software Access Authorization",
  SOFTWARE_ACCESS_REMOVAL = "Software Access Removal",
  SOFTWARE_ADD_WORK_ORDER = "Software Add Work Order",
  SOFTWARE_INSTALLATION = "Software Installation",
  SOFTWARE_LICENSE = "Software License",
  SOFTWARE_REMOVAL_WORK_ORDER = "Software Removal Work Order",
  STANDARD_ASSET = "Standard Asset",
  TELECOMMUNICATION_EQUIPMENT = "Telecommunication Equipment",
  TELEPHONE = "Telephone",
  VIRTUAL_MACHINE = "Virtual Machine",
  SECURITY_POLICY = "Security Policy",
  EMPLOYEE_DATA = "Employee Data",
  API = "Api",
  FIREWALL = "Firewall",
}

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */
export enum Assignment {
  AWAITING_RECEIPT = "Awaiting receipt",
  IN_STOCK = "In Stock",
  IN_USE = "In Use",
  MISSING = "Missing",
  RETURNED_FOR_MAINTENANCE = "Returned For Maintenance",
  RETURNED_TO_SUPPLIER = "Returned To Supplier",
}

export enum Probability {
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low",
}

/**
 * Reference URL:
https://www.imperva.com/learn/application-security/cyber-security-threats/
https://www.imperva.com/learn/application-security/cyber-security-threats/
https://www.cisa.gov/uscert/ics/content/cyber-threat-source-descriptions
https://www.fortinet.com/resources/cyberglossary/threat-protection
https://www.code42.com/glossary/types-of-insider-threats/
https://www.fortinet.com/resources/cyberglossary/what-is-hacktivism
https://owasp.org/www-project-top-ten/
*/

export enum ThreatSourceType {
  PHISHING = "Phishing",
  SPAM = "Spam",
  SPYWARE_AND_MALWARE_FOR_EXTORTION = "Spyware and malware for extortion",
  THEFT_OF_PRIVATE_INFORMATION = "Theft of private information",
  ONLINE_SCAMS = "Online scams",
  DESTROY_OR_ABUSE_CRITICAL_INFRASTRUCTURE =
    "Destroy or abuse critical infrastructure",
  THREATEN_NATIONAL_SECURITY = "Threaten national security",
  DISRUPT_ECONOMIES = "Disrupt economies",
  CAUSE_BODILY_HARM_TO_CITIZENS = "Cause bodily harm to citizens",
  DENIAL_OF_SERVICE_ATTACKS = "Denial-of-Service Attacks",
  DOXING = "Doxing",
  LEAKING_INFORMATION = "Leaking Information",
  THE_USE_OF_THE_SOFTWARE_RECAP = "The Use of the Software RECAP",
  BLOGGING_ANONYMOUSLY = "Blogging Anonymously",
  GEO_BOMBING = "Geo-bombing",
  WEBSITE_MIRRORING = "Website Mirroring",
  CHANGING_THE_CODE_FOR_WEBSITES_OR_WEBSITE_DEFACEMENTS =
    "Changing the Code for Websites or website defacements",
}

export enum ThreatEventType {
  VIRUSES = "Viruses",
  WORMS = "Worms",
  TROJANS = "Trojans",
  RANSOMWARE = "Ransomware",
  CRYPTOJACKING = "Cryptojacking",
  SPYWARE = "Spyware",
  ADWARE = "Adware",
  FILELESS_MALWARE = "Fileless malware",
  ROOTKITS = "Rootkits",
  BAITING = "Baiting",
  PRETEXTING = "Pretexting",
  PHISHING = "Phishing",
  VISHING = "Vishing",
  SMISHING = "Smishing",
  PIGGYBACKING = "Piggybacking",
  TAILGATING = "Tailgating",
  EMAIL_HIJACKING = "Email Hijacking",
  DNS_SPOOFING = "DNS spoofing",
  IP_SPOOFING = "IP spoofing",
  HTTPS_SPOOFING = "HTTPS spoofing",
  HTTP_FLOOD_DDOS = "HTTP flood DDoS",
  SYN_FLOOD_DDOS = "SYN flood DDoS",
  UDP_FLOOD_DDOS = "UDP flood DDoS",
  ICMP_FLOOD = "ICMP flood",
  NTP_AMPLIFICATION = "NTP amplification",
  SQL_INJECTION = "SQL injection",
  CODE_INJECTION = "Code injection",
  OS_COMMAND_INJECTION = "OS Command Injection",
  LDAP_INJECTION = "LDAP injection",
  XML_EXTERNAL_ENTITIES_INJECTION = "XML eXternal Entities (XXE) Injection",
  CROSS_SITE_SCRIPTING = "Cross Site Scripting (XSS)",
  BROKEN_ACCESS_CONTROL = "Broken Access Control",
  CRYPTOGRAPHIC_FAILURES = "Cryptographic Failures",
  INSECURE_DESIGN = "Insecure Design",
  SECURITY_MISCONFIGURATION = "Security Misconfiguration",
  VULNERABLE_AND_OUTDATED_COMPONENTS = "Vulnerable and Outdated Components",
  IDENTIFICATION_AND_AUTHENTICATION_FAILURES =
    "Identification and Authentication Failures",
  SOFTWARE_AND_DATA_INTEGRITY_FAILURES = "Software and Data Integrity Failures",
  SECURITY_LOGGING_AND_MONITORING_FAILURES =
    "Security Logging and Monitoring Failures",
  SERVER_SIDE_REQUEST_FORGERY = "Server Side Request Forgery",
}

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/enum_calendar_period_enum.html
 */
export enum CalendarPeriod {
  TWENTY_FOUR_HOURS_SEVEN_DAYS = "24x7",
  BUSINESS_HOURS = "Business hours",
  NON_BUSINESS_HOURS = "Non-business hours",
}
/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/enum_comparison_operator_enum.html
 */
export enum ComparisonOperator {
  GREATER_THAN = "<",
  GREATER_THAN_EQUAL_TO = "<=",
  EQUAL_TO = "=",
  LESS_THAN = ">",
  LESS_THAN_EQUAL_TO = ">=",
  NA = "na",
}
/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/enum_kpi_measurement_type_enum.html
 */
export enum KpiMeasurementType {
  BANDWIDTH = "Bandwidth",
  CAPACITY = "Capacity",
  CURRENCY = "Currency",
  PERCENTAGE = "Percentage",
  TIME = "Time",
  UNITLESS = "Unitless",
}

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/enum_kpi_status_enum.html
 */
export enum KpiStatus {
  CRITICAL = "Critical",
  MAJOR = "Major",
  MINOR = "Minor",
  OK = "Ok",
  WARNING = "Warning",
}
/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/enum_tracking_period_enum.html
 */
export enum TrackingPeriod {
  DAY = "Day",
  HOUR = "Hour",
  MONTH = "Month",
  OTHER = "Other",
  QUARTER = "Quarter",
  WEEK = "Week",
  YEAR = "Year",
}
/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/enum_trend_enum.html
 */
export enum Trend {
  DOWN = "Down",
  NO_CHANGE = "No Change	",
  UP = "Up",
}

export enum AuditorType {
  EXTERNAL = "external",
  INTERNAL = "internal",
}

export enum AuditPurpose {
  MEANING_DRY_RUN = "exmeaning dry runternal",
  OFFICIAL = "official",
}

export enum AuditorStatusType {
  OUTSTANDING = "Outstanding",
  FULFILLED = "Fulfilled",
  REJECTED = "Rejected",
  ACCEPTED = "Accepted",
}

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/enum_contract_status_enum.html
 */

export enum ContractStatus {
  ACTIVE = "Active",
  AWAITING_APPROVAL = "Awaiting Approval",
  AWAITING_APPROVAL_FOR_RENEWAL = "Awaiting Approval For Renewal",
  CANCELED = "Canceled",
  DENIED = "Denied",
  FINISHED = "Finished",
  IN_PREPARATION = "In Preparation",
  QUOTE_REQUESTED = "Quote Requested",
  QUOTED = "Quoted",
  STANDARD_CONTRACT = "Standard Contract",
  SUSPENDED = "Suspended",
  VALIDATED = "Validated",
}

export enum GraphNature {
  SERVICE = "Service",
  APP = "Application",
}

export enum Severity {
  CRITICAL = "Critical",
  MAJOR = "Major",
  MINOR = "Minor",
  LOW = "Low",
}

export enum AssetRiskType {
  SECURITY = "Security",
}

export enum Priority {
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low",
}

export enum RiskSubject {
  TECHNICAL_RISK = "Technical Risk",
}

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */

export enum IncidentCategory {
  ACCESS = "Access",
  DATA = "Data",
  FACILITIES = "Facilities",
  FAILURE = "Failure",
  GENERAL_INFORMATION = "General Information",
  HARDWARE = "Hardware",
  HOW_TO = "How To",
  OTHER = "Other",
  PERFORMANCE = "Performance",
  SECURITY = "Security",
  SERVICE_DELIVERY = "Service Delivery",
  SERVICE_PORTFOLIO = "Service Portfolio",
  STATUS = "Status",
  SUPPORT = "Support",
  THRIFTY = "Thrifty",
}

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */
export enum IncidentSubCategory {
  AUTHORIZATION_ERROR = "Authorization Error",
  AVAILABILITY = "Availability",
  DATA_OR_FILE_CORRUPTED = "Data Or File Corrupted",
  DATA_OR_FILE_INCORRECT = "Data Or File Incorrect",
  DATA_OR_FILE_MISSING = "Data Or File Missing",
  ERROR_MESSAGE = "Error Message",
  FUNCTION_OR_FEATURE_NOT_WORKING = "Function Or Feature Not Working",
  FUNCTIONALITY = "Functionality",
  GENERAL_INFORMATION = "General Information",
  HARDWARE_FAILURE = "Hardware Failure",
  HOW_TO = "How To",
  INCIDENT_RESOLUTION_QUALITY = "Incident Resolution Quality",
  INCIDENT_RESOLUTION_TIME = "Incident Resolution Time",
  JOB_FAILED = "Job Failed",
  LOGIN_FAILURE = "Login Failure",
  MISSING_OR_STOLEN = "Missing Or Stolen",
  NEW_SERVICE = "New Service",
  PERFORMANCE = "Performance",
  PERFORMANCE_DEGRADATION = "Performance Degradation",
  PERSON = "Person",
  SECURITY_BREACH = "Security Breach",
  SECURITY_EVENT = "Security Event/Message",
  STATUS = "Status",
  STORAGE_LIMIT_EXCEEDED = "Storage Limit Exceeded",
  SYSTEM_DOWN = "System Down",
  SYSTEM_OR_APPLICATION_HANGS = "System Or Application Hangs",
  UPGRADE_NEW_RELEASE = "Upgrade/New Release",
  VIRUS_ALERT = "Virus Alert",
}

/**
 * Reference URL: https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */
export enum IncidentType {
  COMPLAINT = "Complaint",
  INCIDENT = "Incident",
  REQUEST_FOR_INFORMATION = "Request For Information",
}

/**
 * Reference URL:https://docs.microfocus.com/UCMDB/11.0/cp-docs/docs/eng/class_model/html/index.html
 */
export enum IncidentStatus {
  ACCEPTED = "Accepted",
  ASSIGNED = "Assigned",
  CANCELLED = "Cancelled",
  CATEGORIZE = "Categorize",
  CLOSED = "Closed",
  OPEN = "Open",
  PENDING_CHANGE = "Pending Change",
  PENDING_CUSTOMER = "Pending Customer",
  PENDING_EVIDENCE = "Pending Evidence",
  PENDING_OTHER = "Pending Other",
  PENDING_VENDOR = "Pending Vendor",
  REFERRED = "Referred",
  REJECTED = "Rejected",
  REOPENED = "Reopened",
  REPLACED_PROBLEM = "Replaced Problem",
  RESOLVED = "Resolved",
  SUSPENDED = "Suspended",
  WORK_IN_PROGRESS = "Work In Progress",
}
