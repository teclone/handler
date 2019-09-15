import Exception from '.';

export default class FieldRuleNotFoundException extends Exception {
  constructor(field: string) {
    super(`"${field}" field rule not found. did you forget to define it?`, FieldRuleNotFoundException);
  }
}
