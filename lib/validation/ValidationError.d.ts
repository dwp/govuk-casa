import { ValidationErrorObject, ValidatorErrorObjectGenerator, ValidatorContext } from '../../index';

export = ValidationError;

declare class ValidationError {
  constructor(errorParam: ValidationErrorObject | string);

  static make(params: {
    errorMsg: string | ValidationErrorObject | ValidatorErrorObjectGenerator | Error,
    dataContext?: ValidatorContext
  }): ValidationError;

  withContext(context: ValidatorContext): ValidationError;
}
