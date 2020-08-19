import ValidationError from '../../../lib/validation/ValidationError';

export namespace ValidationRules {
  export function dateObject(): Promise<ValidationError | void>;
  export function email(): Promise<ValidationError | void>;
  export function inArray(): Promise<ValidationError | void>;
  export function nino(): Promise<ValidationError | void>;
  export function optional(): boolean;
  export function postalAddressObject(): Promise<ValidationError | void>;
  export function regex(): Promise<ValidationError | void>;
  export function required(): Promise<ValidationError | void>;
  export function strlen(): Promise<ValidationError | void>;
}
