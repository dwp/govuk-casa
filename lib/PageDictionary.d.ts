export = PageDictionary;

declare class PageDictionary {
  constructor(pages: { [key: string]: PageMeta });

  getAllPageIds(): Array<string>;

  getPageMeta(pageId: string): PageMeta;

  getPages(): PageMetaMap;
}
