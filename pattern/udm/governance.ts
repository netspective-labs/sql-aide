#!/usr/bin/env -S deno run --allow-all

export enum ExecutionContext {
  PRODUCTION = "production",
  TEST = "test",
  DEVELOPMENT = "devl",
  SANDBOX = "sandbox",
  EXPERIMENTAL = "experimental",
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
