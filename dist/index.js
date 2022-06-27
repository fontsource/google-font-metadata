'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var jsonfile = require('jsonfile');
require('consola');
require('got');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var jsonfile__default = /*#__PURE__*/_interopDefaultLegacy(jsonfile);

const APIDirect = jsonfile__default["default"].readFileSync("../data/api-response.json");

exports.APIDirect = APIDirect;
