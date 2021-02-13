import DateObject from './dateObject';
import Email from './email';
import InArray from './inArray';
import Nino from './nino';
import PostalAddressObject from './postalAddressObject';
import Regex from './dateObject';
import Required from './required';
import Strlen from './strlen';

export namespace ValidationRules {
  export type dateObject = DateObject;
  export type email = Email;
  export type inArray = InArray;
  export type nino = Nino;
  export function optional(value: any):boolean;
  export type postalAddressObject = PostalAddressObject;
  export type regex = Regex;
  export type required = Required;
  export type strlen = Strlen;
}
