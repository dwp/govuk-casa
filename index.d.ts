import SimpleField from './lib/validation/SimpleField';
import JourneyContext = require('./lib/JourneyContext');
import ValidationError from './lib/validation/ValidationError';
// import Plan from './lib/Plan';
/**
 * Place all global-scope types/interfaces here, and they should be picked up
 * automatically by IDE intellisense.
 */

/* ----------------------------------------------------------------- PageMeta */

declare interface PageMeta {
  view: string;
  fieldValidators?: PageMetaFieldValidatorMap;
  fieldGatherModifiers?: PageMetaGatherModifiersMap;
  hooks?: PageMetaHooksMap;
  reviewBlockView?: string;
  id?: string;
  fieldWriter?: PageMetaDataWriter;
  fieldReader?: PageMetaDataReader;
}

type PageMetaFieldValidatorMap = {
  [key: string]: typeof SimpleField;
};

type PageMetaGatherModifiersMap = {
  [key: string]: Function;
}

type PageMetaHooksMap = {
  [key in PageMetaHookName]: PageMetaHook;
}

type PageMetaHookName = "pregather" | "prevalidate" | "preredirect" | "prerender";

interface PageMetaHook {
  // Use real Express types? Will need to import relevant @types
  (req: object, res: object, next: Function): void;
}

// Function that returns object that will wholly overwrite CDO.
type PageMetaDataWriter = (args:{ waypointId: string, formData: { [key: string]: any }, contextData: object }) => object;

// Function that returns an object that maps form fields to values; suitable for
// HTML forms
type PageMetaDataReader = (args:{ waypointId: string, contextData: object }) => object;

/* --------------------------------------------------------------- Validators */

// The resolved Promise must return undefined
// The rejected Promise must return a ValidationError or Array<ValidationError>
export type ValidatorFunction = (fieldValue: any, context: ValidatorContext) => Promise<undefined>;

export type ValidatorConditionFunction = (context: ValidatorContext) => boolean;

export interface ValidatorContext {
  // Field under validation
  fieldName?: string;

  // Request journey context
  journeyContext?: JourneyContext;

  // Waypoint ID
  waypointId?: string;

  // Validator name
  validator?: string;
}

export interface ValidationErrorObject {
  summary: string;
  message?: string;
  inline?: string;
  focusSuffix?: string | Array<string>;
  fieldKeySuffix?: string;
  field?: string;
  fieldHref?: string;
  variables?: {
    [key: string]: string,
  }
}

export type ValidatorErrorObjectGenerator = (context: ValidatorContext) => ValidationErrorObject;

export declare class Plan {
  addSequence(...args: string[]): void;
  setRoute(start: string, end: string): void;
  setRoute(start: string, end: string, routeFunction: (r: any, c: any) => boolean): void;
  addOrigin(start: string, end: string): void;
}

export interface CasaApp {
  loadDefinitions(pages: object, plan: object): Promise<ValidationError>;
  router: object;
}
export function configure(app: object, config: object): CasaApp;

export { ValidationRules as validationRules } from './lib/validation/rules/ValidationRules';
export function simpleFieldValidation([]): void;

/* ---------------------------------------------------------------- Utilities */

export interface CasaRequestObject {
  waypoint?: string,
  editMode?: boolean,
  editOrigin?: string,
  contextId?: string,
  mountUrl?: string,
  skipTo?: string,
}