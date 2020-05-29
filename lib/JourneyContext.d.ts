import ValidationError = require("./validation/ValidationError");
import PageMeta from '../index';

export = JourneyContext;

declare class JourneyContext {
  constructor(data?: object, validation?: { [key: string]: JourneyContextPageValidation }, nav?: object);

  toObject(): JourneyContextObject;

  static fromObject(obj: JourneyContextObject): JourneyContext;

  public data: object;

  public validation: object;

  public nav: JourneyContextNavObject;

  getData(): object;

  getDataForPage(pageId: string | typeof PageMeta): object;

  setData(data: object): JourneyContext;

  setDataForPage(page: string | typeof PageMeta, data: object): JourneyContext;

  getValidationErrors(): { [key: string]: JourneyContextPageValidation };

  removeValidationStateForPage(pageId: string): JourneyContext;

  clearValidationErrorsForPage(pageId: string): JourneyContext;

  setValidationErrorsForPage(pageId: string, errors: JourneyContextPageValidation): JourneyContext;

  getValidationErrorsForPage(pageId: string): JourneyContextPageValidation;

  hasValidationErrorsForPage(pageId: string): boolean;

  getNavigation(): JourneyContextNavObject;

  setNavigationLanguage(language: string): JourneyContext;

  isPageValid(pageId: string): boolean;
}

interface JourneyContextObject {
  data: object;
  validation: JourneyContextPageValidation;
  nav: object;
}

interface JourneyContextPageValidation {
  [key: string]: Array<ValidationError>
}

interface JourneyContextNavObject {
  language?: string;
}
