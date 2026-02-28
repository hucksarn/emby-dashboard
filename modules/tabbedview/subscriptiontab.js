define([
  "exports",
  "./basetab.js",
  "./../common/globalize.js",
  "./../dom.js",
  "./../emby-elements/emby-button/emby-button.js",
  "./../emby-apiclient/connectionmanager.js",
  "./../emby-apiclient/events.js"
], function (_exports, _basetab, _globalize, _dom, _embyButton, _connectionmanager, _events) {
  Object.defineProperty(_exports, "__esModule", { value: !0 });
  _exports.default = void 0;

  function SubscriptionTab(view, params, options) {
    _basetab.default.apply(this, arguments);
    this.view = view;
    this.params = params;
    this.options = options;
    this._initialized = !1;
    this._iframe = null;
    this._currentUserKey = "";
    this._onUserChanged = this._onUserChanged.bind(this);
    _events.default.on(_connectionmanager.default, "localusersignedin", this._onUserChanged);
    _events.default.on(_connectionmanager.default, "localusersignedout", this._onUserChanged);
  }

  Object.assign(SubscriptionTab.prototype, _basetab.default.prototype);

  SubscriptionTab.prototype._buildUrl = function () {
    var apiClient = _connectionmanager.default.currentApiClient();
    var url = "http://79.127.235.178:5002";
    if (!apiClient) return url;

    var userId = apiClient.getCurrentUserId ? apiClient.getCurrentUserId() : null;
    var token = apiClient.accessToken ? apiClient.accessToken() : null;
    var parts = ["embedded=1"];

    if (userId) parts.push("embyUserId=" + encodeURIComponent(userId));
    if (token) parts.push("embyToken=" + encodeURIComponent(token));

    return parts.length ? url + "?" + parts.join("&") : url;
  };

  SubscriptionTab.prototype._getUserKey = function () {
    var apiClient = _connectionmanager.default.currentApiClient();
    if (!apiClient) return "";

    var userId = apiClient.getCurrentUserId ? apiClient.getCurrentUserId() : "";
    var token = apiClient.accessToken ? apiClient.accessToken() : "";
    return String(userId || "") + "|" + String(token || "");
  };

  SubscriptionTab.prototype._reloadIframe = function (force) {
    if (!this._iframe) return;

    var nextKey = this._getUserKey();
    if (!force && nextKey === this._currentUserKey) return;

    this._currentUserKey = nextKey;

    var url = this._buildUrl();
    url += (url.indexOf("?") >= 0 ? "&" : "?") + "cb=" + Date.now();

    // Reset iframe to ensure session changes are picked up.
    this._iframe.src = "about:blank";
    setTimeout(function () {
      if (this._iframe) this._iframe.src = url;
    }.bind(this), 0);
  };

  SubscriptionTab.prototype._onUserChanged = function () {
    this._reloadIframe(!0);
  };

  SubscriptionTab.prototype.onTemplateLoaded = function () {
    _basetab.default.prototype.onTemplateLoaded.apply(this, arguments);

    if (!this._initialized) {
      this._initialized = !0;
      this.view.innerHTML = '<div style="position:fixed;top:var(--header-height);left:0;right:0;bottom:-9px;">' +
        '<iframe class="subscription-iframe" src="" style="width:100%;height:100%;border:0;display:block;overflow:hidden;" allowfullscreen></iframe>' +
        '</div>';

      this._iframe = this.view.querySelector(".subscription-iframe") || this.view.querySelector("iframe");
      this._reloadIframe(!0);
    }
  };

  SubscriptionTab.prototype.onResume = function (options) {
    this._reloadIframe(!1);
    return _basetab.default.prototype.onResume.apply(this, arguments);
  };

  SubscriptionTab.prototype.onPause = function () {
    return _basetab.default.prototype.onPause.apply(this, arguments);
  };

  SubscriptionTab.prototype.destroy = function () {
    _events.default.off(_connectionmanager.default, "localusersignedin", this._onUserChanged);
    _events.default.off(_connectionmanager.default, "localusersignedout", this._onUserChanged);
    this._initialized = null;
    this._iframe = null;
    this._currentUserKey = "";
    _basetab.default.prototype.destroy.apply(this, arguments);
  };

  _exports.default = SubscriptionTab;
});
