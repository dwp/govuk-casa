import ValidationError = require("./validation/ValidationError");
import PageMeta from '../index';

export = JourneyContext;

declare class JourneyContext {
  constructor(data?: object, validation?: { [key: string]: JourneyContextPageValidation }, nav?: object, identity?: object);

  toObject(): JourneyContextObject;

  static fromObject(obj: JourneyContextObject): JourneyContext;

  static fromContext(context: JourneyContext): JourneyContext;

  public data: object;

  public validation: JourneyContextPageValidation;

  public nav: JourneyContextNavObject;

  public identity: JourneyContextIdentityObject;

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

  getIdentity(): JourneyContextIdentityObject;

  isDefault(): boolean;

  static initContextStore(session: object): void;

  static validateContextId(id: string): string;

  static getContextById(session: object, id: string): JourneyContext;

  static getContextByName(session: object, name: string): JourneyContext;

  static getContextsByTag(session: object, tag: string): JourneyContext;

  static getContexts(session: object): Array<JourneyContext>;

  static putContext(session: object, context:JourneyContext): void;

  static removeContext(session: object, context:JourneyContext): void;

  static removeContextById(session: object, id:string): void;

  static removeContextByName(session: object, name:string): void;

  static removeContextsByTag(session: object, tag:string): void;

  static removeContexts(session: object): void;
}

interface JourneyContextObject {
  data?: object;
  validation?: JourneyContextPageValidation;
  nav?: JourneyContextNavObject;
  identity?: JourneyContextIdentityObject;
}

interface JourneyContextPageValidation {
  [key: string]: Array<ValidationError>
}

interface JourneyContextNavObject {
  language?: string;
}

interface JourneyContextIdentityObject {
  id: String,
  name?: String,
  tags?: Array<String>,
}
