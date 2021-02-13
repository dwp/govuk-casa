import { ValidatorConditionFunction, ValidatorFunction } from '../../index';

export = SimpleField;

declare function SimpleField (validators: Array<ValidatorFunction | ValidatorFactory>, condition?: ValidatorConditionFunction): SimpleFieldValidatorConfig | never;

interface SimpleFieldValidatorConfig {
  readonly type: 'simple',
  readonly condition: ValidatorConditionFunction,
  readonly validators: Array<ValidatorFunction | ValidatorFactory>,
}
