import ValidationError from '../../../lib/validation/ValidationError';

export namespace ValidationRules {
  export function email(): Promise<ValidationError>;
  export function required(): Promise<ValidationError>;
  export function inArray(): Promise<ValidationError>;
}
