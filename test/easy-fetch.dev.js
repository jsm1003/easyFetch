(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Easyfetch = factory());
}(this, (function () { 'use strict';

var toString = Object.prototype.toString;

/**
 * 合并路径
 * @param {string} baseURL 基础路径
 * @param {string} relativeURL 相对路径
 * @returns {string} 合并后的路径
 */
var combineURLs = function (baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};

/**
 * 判断是否绝对路径
 * @param {string} url 路径
 * @returns {boolean} 返回真值表示绝对路径，假值表示非绝对路径
 */
var isAbsoluteURL = function (url) {
  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
};

/**
 * 判断是否是数组
 * @param {Array} value 
 * @return {Boolean} true: 是数组，false: 不是数组
 */
var isArray = function (value) {
  return Array.isArray(value);
};

/**
 * 判断是否是对象
 * @param {Object} value 
 * @return {Boolean} true: 是对象, false: 不是对象
 */
var isObject = function (value) {
  return value !== null && typeof value === 'object';
};

/**
 * 判断是否是数字
 * @param {Number} value 
 * @return {Boolean} true: 是数字， false: 不是数字
 */
var isNumber = function (value) {
  return typeof value === 'number';
};

/**
 * 判断是否是时间
 * @param {Date} value 
 * @return {Boolean} true: 是时间， false: 不是时间
 */
var isDate = function (value) {
  return toString(value) === '[object Date]';
};

/**
 * 判断是否是未定义
 * @param {Undefined} value 
 * @return {Boolean} true: 是， false: 不是
 */
var isUndefined = function (value) {
  return typeof value === 'undefined';
};

/**
 * 将对象转换为 JSON 字符串
 * @param {Object} obj 将要序列化的对象
 * @param {Number, String} pretty 控制缩进的间距
 * @return {String} 转换后的JSON
 */
var toJson = function (obj, pretty) {
  if (isUndefined(obj)) { return undefined; }
  if (!isNumber(pretty)) {
    pretty = pretty ? 2 : null;
  }
  return JSON.stringify(obj, null, pretty);
};

/**
 * 序列化
 * @param {Object} value  序列化 
 */
var serializeValue = function (value) {
  if (isObject(value)) { return isDate(value) ? value.toISOString() : toJson(value); }
  return value;
};

var encodeUriQuery = function (value, pctEncodeSpaces) {
  return encodeURIComponent(value)
    .replace(/%40/gi, '@')
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%3B/gi, ';')
    .replace(/%20/g, pctEncodeSpaces ? '%20' : '+');
};

var paramSerializer = function (obj) {
  if (!obj) { return ''; }
  var parts = [];
  var loop = function ( key ) {
    var value = obj[key];
    if (value === null || isUndefined(value)) { return {}; }
    if (isArray(value)) {
      value.forEach(function (v) {
        parts.push(encodeUriQuery(key) + '=' + encodeUriQuery(serializeValue(v)));
      });
    } else {
      parts.push(encodeUriQuery(key) + '=' + encodeUriQuery(serializeValue(value)));
    }
  };

  for (var key in obj) {
    var returned = loop( key );

    if ( returned ) return returned.v;
  }
  return parts.join('&');
};

var buildUrl = function (url, obj) {
  var serializedParams = paramSerializer(obj);
  if (serializedParams.length > 0) {
    url += (url.indexOf('?') == -1 ? '?' : '&') + serializedParams;
  }
  return url;
};

var Utils = {
  combineURLs: combineURLs,
  isAbsoluteURL: isAbsoluteURL,
  isArray: isArray,
  isObject: isObject,
  isNumber: isNumber,
  isDate: isDate,
  isUndefined: isUndefined,
  toJson: toJson,
  serializeValue: serializeValue,
  encodeUriQuery: encodeUriQuery,
  paramSerializer: paramSerializer,
  buildUrl: buildUrl
};

var Easyfetch = function Easyfetch(defaults) {
  if ( defaults === void 0 ) defaults = {};

  this.defaults = defaults;
  this.__init();
};

/**
  * 初始化
  */
Easyfetch.prototype.__init = function __init () {
  this.__initInterceptor();
  this.__initDefaults();
  this.__initMethods();
};

/**
  * 初始化默认拦截器
  */
Easyfetch.prototype.__initInterceptor = function __initInterceptor () {};

/**
  * 初始化默认参数
  */
Easyfetch.prototype.__initDefaults = function __initDefaults () {
  var defaults = {
    // 基础请求路径
    baseURL: '',
    // 请求路径
    url: '',
    // 请求头
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    method: 'get',
    body: {},

    /* fetch专有参数 */
    mode: 'cors',
    catch: 'default',
    credentials: 'same-origin',

    /* 额外参数 */
    // 验证返回状态码
    validateStatus: function (status) { return status === 304 || (status >= 200 && status < 300); },
    suffix: ''
  };
  // 合并参数
  this.defaults = Object.assign({}, defaults, this.defaults);
};

/**
 * 遍历对象构造方法,
 */
Easyfetch.prototype.__initMethods = function __initMethods () {
    var this$1 = this;

  var methods = ['get', 'post', 'put', 'delete'];
  methods.forEach(function (method) {
    this$1[method] = function (url, body, config) {
        if ( body === void 0 ) body = {};

      return this$1.__defaultRequest(Object.assign({}, config, { url: url, body: body, method: method }));
      // return this.__defaultRequest({ ...config, url, body, method });
    };
  });

  // request - 基础请求方法
  this.request = function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      return (ref = this$1).__defaultRequest.apply(ref, args)
      var ref;
    };

  // Promise.all - 合并处理请求
  this.all = function (promises) { return Promise.all(promises); };
};

/**
 * 以fetch作为底层方法
 */
Easyfetch.prototype.__defaultRequest = function __defaultRequest (config) {
  // 合并参数
  // const defaults = { ...this.defautls, ...config };
  var defaults = Object.assign({}, this.defaults, config);

  // 下面这里也要改一改
  var $$config = {
    url: defaults.url,
    mode: defaults.mode,
    cache: defaults.cache,
    method: defaults.method,
    headers: defaults.headers,
    credentials: defaults.credentials
  };

  // 配置请求路径 baseURL
  if (defaults.baseURL && !Utils.isAbsoluteURL($$config.url)) {
    $$config.url = Utils.combineURLs(defaults.baseURL, $$config.url);
  }

  // 在这里转换请求体
  // 随便改一个东西看看
  if (config.method === 'get') {
    $$config.url = Utils.buildUrl($$config.url, defaults.body);
  } else {
    $$config.body = defaults.body;
  }

  // 转换相应数据
  return fetch($$config.url, $$config);
};

return Easyfetch;

})));
//# sourceMappingURL=easy-fetch.dev.js.map
