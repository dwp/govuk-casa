import { ValidationErrorObject, ValidatorContext } from '../../index';

export = ValidatorFactory;

declare class ValidatorFactory {
  public config: config;

  static make(config?: object): {
    validate: Function,
    sanitise: Function,
    config: config,
  }

  static coerceToValidatorObject(input: ValidatorFactory | Function | any): validatorObject;

  constructor(config?: config);

  validate(fieldValue: any, context: ValidatorContext): Promise<null | ValidationErrorObject>;

  sanitise(fieldValue: any, context: ValidatorContext): any;
}

type config = {
  [key: string]: any,
};

type validatorObject = {
  name?: string,
  config?: config,
  sanitise?: Function,
  validate?: Function,
};
