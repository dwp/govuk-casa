export = SimpleField;

declare function SimpleField (validators: Array<ValidatorFunction>, condition?: ValidatorConditionFunction): SimpleFieldValidatorConfig | never;

interface SimpleFieldValidatorConfig {
  readonly type: 'simple',
  readonly condition: ValidatorConditionFunction,
  readonly validators: Array<ValidatorFunction>,
};
