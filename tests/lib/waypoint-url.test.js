import { expect } from "chai";
import fastCheck from "fast-check";
import JourneyContext from "../../src/lib/JourneyContext.js";
import waypointUrl from "../../src/lib/waypoint-url.js";

describe("waypointUrl()", () => {
  it("prefixes the waypoint with the mountUrl", () => {
    expect(waypointUrl({ mountUrl: "/", waypoint: "waypoint" })).to.equal(
      "/waypoint",
    );
    expect(waypointUrl({ mountUrl: "/mount/", waypoint: "waypoint" })).to.equal(
      "/mount/waypoint",
    );
  });

  it("strips invalid characters from the waypoint", () => {
    // Valid
    expect(waypointUrl()).to.equal("/");
    expect(waypointUrl({ waypoint: "base/9-sub_slug" })).to.equal(
      "/base/9-sub_slug",
    );

    // Invalid
    expect(waypointUrl({ waypoint: "//base/9-sub_slug" })).to.equal(
      "/base/9-sub_slug",
    ); // double slashes
    expect(waypointUrl({ waypoint: "/@/base/9-sub_slug" })).to.equal(
      "/base/9-sub_slug",
    ); // double slash separator
    expect(waypointUrl({ waypoint: "/%2F/base/9-sub_slug" })).to.equal(
      "/2F/base/9-sub_slug",
    ); // encoding
    expect(waypointUrl({ waypoint: "//base /9-sub_slug" })).to.equal(
      "/base/9-sub_slug",
    );
    expect(waypointUrl({ waypoint: "%252F/base/9-sub_slug" })).to.equal(
      "/252F/base/9-sub_slug",
    ); // double encoding
    expect(waypointUrl({ waypoint: "/\u200Bbase/9-sub_slug" })).to.equal(
      "/base/9-sub_slug",
    ); // encoding non-visibles
    expect(
      waypointUrl({ waypoint: ":!@£$%^&*()_-+={}[]:\";'|\\~`<,>.?" }),
    ).to.equal("/_-"); // various disallowed
    expect(waypointUrl({ waypoint: "\r\n123\r\n456" })).to.equal("/123456"); // LF/CR disallowed
  });

  it("doesn't allow waypoint URL parameters to override named parameters", () => {
    // contextid
    const journeyContext = new JourneyContext({}, {}, {}, { id: "real-id" });
    expect(
      waypointUrl({ waypoint: "wp?contextid=123", journeyContext }),
    ).to.equal("/wp?contextid=real-id");

    // edit, editorigin
    expect(
      waypointUrl({ waypoint: "wp?edit=false&editorigin=/test/bad" }),
    ).to.equal("/wp");
    expect(
      waypointUrl({
        waypoint: "wp?edit=false&editorigin=/test/bad",
        edit: true,
        editOrigin: "/test/good",
      }),
    ).to.equal("/wp?edit=true&editorigin=%2Ftest%2Fgood");

    // skipto
    expect(waypointUrl({ waypoint: "wp?skipto=/test/bad" })).to.equal("/wp");
    expect(
      waypointUrl({ waypoint: "wp?skipto=/test/bad", skipTo: "/test/good" }),
    ).to.equal("/wp?skipto=%2Ftest%2Fgood");
  });

  it('generates a sub-app "root" URL for waypoints using the url:// protocol', () => {
    const e = (s) => encodeURIComponent(s);
    expect(waypointUrl({ waypoint: "url://" })).to.equal("/url/"); // missing url; only protocol listed here
    expect(waypointUrl({ waypoint: "url:///" })).to.equal(
      `/_/?refmount=${e("url:///")}&route=next`,
    );
    expect(waypointUrl({ waypoint: "url:///test" })).to.equal(
      `/test/_/?refmount=${e("url:///")}&route=next`,
    );
    expect(
      waypointUrl({ mountUrl: "/mount/", waypoint: "url:///test" }),
    ).to.equal(`/test/_/?refmount=${e("url:///mount/")}&route=next`);

    // Allows onlt contextid URL parameter to be passed
    expect(waypointUrl({ waypoint: "url:///test?test=1" })).to.equal(
      `/test/_/?refmount=${e("url:///")}&route=next`,
    );
    expect(waypointUrl({ waypoint: "url:///test?contextid=1" })).to.equal(
      `/test/_/?refmount=${e("url:///")}&route=next&contextid=1`,
    );
  });

  it('includes "contextid" parameter when not using the default JourneyContext', () => {
    const defaultContext = new JourneyContext();
    defaultContext.identity.id = JourneyContext.DEFAULT_CONTEXT_ID;

    const customContext = new JourneyContext();
    customContext.identity.id = "text/context";

    expect(waypointUrl({ journeyContext: new JourneyContext() })).to.equal("/");

    expect(waypointUrl({ journeyContext: defaultContext })).to.equal("/");
    expect(
      waypointUrl({ journeyContext: defaultContext, waypoint: "wp" }),
    ).to.equal("/wp");

    expect(waypointUrl({ journeyContext: customContext })).to.equal(
      "/?contextid=text%2Fcontext",
    );
    expect(
      waypointUrl({ journeyContext: customContext, waypoint: "wp" }),
    ).to.equal("/wp?contextid=text%2Fcontext");
  });

  it('excludes the "contextid" parameter when it is already present in the mountUrl', () => {
    const journeyContext = new JourneyContext();
    journeyContext.identity.id = "test-context";

    expect(
      waypointUrl({ mountUrl: "/path/test-context/", journeyContext }),
    ).to.not.contain("contextid=");
    expect(
      waypointUrl({
        mountUrl: "/path/test-context/",
        waypoint: "wp",
        edit: true,
        editOrigin: "/test/",
        journeyContext,
      }),
    ).to.not.contain("contextid=");
  });

  it('includes an "edit" parameter when required', () => {
    expect(waypointUrl({ edit: true })).to.equal("/?edit=true");
    expect(waypointUrl({ edit: 1 })).to.equal("/");
  });

  it('includes a sanitised "editorigin" parameter when set, but only when in conjunction with "edit" parameter', () => {
    expect(waypointUrl({ edit: true, editOrigin: "/test/origin/" })).to.equal(
      "/?edit=true&editorigin=%2Ftest%2Forigin%2F",
    );
    expect(waypointUrl({ editorigin: "/test/" })).to.equal("/");

    expect(waypointUrl({ edit: true, editOrigin: "//test" })).to.equal(
      "/?edit=true&editorigin=%2Ftest",
    ); // double slashes
    expect(
      waypointUrl({ edit: true, editOrigin: "http://other.test/" }),
    ).to.equal("/?edit=true&editorigin=http%2Fothertest%2F");
    expect(waypointUrl({ edit: true, editOrigin: "/\r\n123\r\n456" })).to.equal(
      "/?edit=true&editorigin=%2F123456",
    ); // LF/CR disallowed

    // Allow 'contextid' URL params on edit origin
    expect(
      waypointUrl({ edit: true, editOrigin: "test?contextid=cid&next=two" }),
    ).to.equal("/?edit=true&editorigin=test%3Fcontextid%3Dcid");

    // Disallow any other URL parameters on edit origin
    expect(waypointUrl({ edit: true, editOrigin: "test?other=1" })).to.equal(
      "/?edit=true&editorigin=test",
    );

    // Treat URLs with multiple "?" as a path
    expect(
      waypointUrl({ edit: true, editOrigin: "test?param=?test=fail" }),
    ).to.equal("/?edit=true&editorigin=testparamtestfail");
  });

  it('includes a sanitised "skipto" parameter when required', () => {
    expect(waypointUrl({ skipTo: "waypoint" })).to.equal("/?skipto=waypoint");

    expect(waypointUrl({ skipTo: "//waypoint" })).to.equal(
      "/?skipto=%2Fwaypoint",
    );
    expect(waypointUrl({ skipTo: "\r\n123\r\n456" })).to.equal(
      "/?skipto=123456",
    ); // LF/CR disallowed
  });

  /* --------------------------------------------------- property-based tests */

  it("sanitises mountUrl and waypoint", () => {
    // Check that the resulting url doesn't contain any unexpected characters
    const urlOk = (url) => !url.match(/[^/a-z0-9_-]/i) && !url.match(/\/{2,}/);

    fastCheck.assert(
      fastCheck.property(
        fastCheck.webUrl({
          withFragments: true,
          withQueryParameters: true,
        }),
        (waypoint) => urlOk(waypointUrl({ waypoint })),
      ),
    );

    fastCheck.assert(
      fastCheck.property(
        fastCheck.webSegment(),
        fastCheck.webUrl({
          withFragments: true,
          withQueryParameters: true,
        }),
        (mountUrl, waypoint) => urlOk(waypointUrl({ mountUrl, waypoint })),
      ),
    );
  });

  it("sanitises editorigin", () => {
    // Check that the resulting url param doesn't contain any unexpected characters
    const urlOk = (url) => {
      const u = new URL(url, "https://placeholder.test/");
      return (
        u.searchParams.has("editorigin") &&
        u.searchParams.get("editorigin").match(/[^/a-z0-9_-]/i) === null
      );
    };

    fastCheck.assert(
      fastCheck.property(
        fastCheck.webUrl({
          withFragments: true,
          withQueryParameters: true,
        }),
        (editOrigin) => urlOk(waypointUrl({ edit: true, editOrigin })),
      ),
    );
  });

  it("sanitises skipto", () => {
    // Check that the resulting url param doesn't contain any unexpected characters
    const urlOk = (url) => {
      const u = new URL(url, "https://placeholder.test/");
      return (
        u.searchParams.has("skipto") &&
        u.searchParams.get("skipto").match(/[^/a-z0-9_-]/i) === null
      );
    };

    fastCheck.assert(
      fastCheck.property(
        fastCheck.webUrl({
          withFragments: true,
          withQueryParameters: true,
        }),
        (skipTo) => urlOk(waypointUrl({ edit: true, skipTo })),
      ),
    );
  });
});
