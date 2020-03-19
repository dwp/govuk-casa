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
  [key: string]: SimpleField;
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
type ValidatorFunction = (fieldValue: any, context: ValidatorContext) => Promise;

type ValidatorConditionFunction = (context: ValidatorContext) => boolean;

interface ValidatorContext {
  // Field under validation
  fieldName?: string;

  // Request journey context
  journeyContext?: JourneyContext;

  // Waypoint ID
  waypointId?: string;

  // Validator name
  validator?: string;
};

interface ValidationErrorObject {
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

type ValidatorErrorObjectGenerator = (context: ValidatorContext) => ValidationErrorObject;