"use strict";
/**
 * This file is part of Satie music engraver <https://github.com/jnetterf/satie>.
 * Copyright (C) Joshua Netterfield <joshua.ca> 2015 - present.
 *
 * Satie is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Satie is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Satie.  If not, see <http://www.gnu.org/licenses/>.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = __importStar(require("react"));
var musicxml_interfaces_1 = require("musicxml-interfaces");
var react_1 = require("react");
var PropTypes = __importStar(require("prop-types"));
var lodash_1 = require("lodash");
var private_views_glyph_1 = __importDefault(require("./private_views_glyph"));
var implAttributes_attributesData_1 = require("./implAttributes_attributesData");
/* private */
var TimeSignatureNumber = /** @class */ (function (_super) {
    __extends(TimeSignatureNumber, _super);
    function TimeSignatureNumber() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TimeSignatureNumber.prototype.render = function () {
        var _this = this;
        return (React.createElement("g", null, lodash_1.map(String(this.props.children).split(""), function (numberString, i) { return (React.createElement(private_views_glyph_1.default, { fill: _this.props.stroke, glyphName: "timeSig" + numberString, key: "ts-" + i, x: _this.props.x +
                i * 12 +
                (numberString === "1"
                    ? !i && parseInt(_this.props.children, 10) >= 10
                        ? -1
                        : 1
                    : 0), y: _this.props.y })); })));
    };
    return TimeSignatureNumber;
}(react_1.Component));
/**
 * Renders a simple, compound, or common time signature.
 */
var TimeSignatureView = /** @class */ (function (_super) {
    __extends(TimeSignatureView, _super);
    function TimeSignatureView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TimeSignatureView.prototype.render = function () {
        var _this = this;
        var spec = this.props.spec;
        if (spec.senzaMisura != null) {
            return null;
        }
        var ts = this._displayTimeSignature();
        if (ts.singleNumber && ts.beats.length === 1 && ts.beats[0].length === 1) {
            return (React.createElement(TimeSignatureNumber, { stroke: spec.color, x: spec.defaultX + (spec.relativeX || 0), y: (this.context.originY || 0) -
                    (spec.defaultY + (spec.relativeY || 0)) }, String(ts.beats[0])));
        }
        if (ts.commonRepresentation) {
            var beats = ts.beats;
            var beatType = ts.beatType;
            var hasSingleBeat = beats.length === 1 && beats[0].length === 1;
            var isCommon = hasSingleBeat && beats[0][0] === 4 && beatType[0] === 4;
            var isCut = hasSingleBeat && beats[0][0] === 2 && beatType[0] === 2;
            if (isCommon) {
                return (React.createElement(private_views_glyph_1.default, { fill: spec.color, glyphName: "timeSigCommon", x: spec.defaultX + (spec.relativeX || 0), y: (this.context.originY || 0) -
                        (spec.defaultY + (spec.relativeY || 0)) }));
            }
            else if (isCut) {
                return (React.createElement(private_views_glyph_1.default, { fill: spec.color, glyphName: "timeSigCutCommon", x: spec.defaultX + (spec.relativeX || 0), y: (this.context.originY || 0) -
                        (spec.defaultY + (spec.relativeY || 0)) }));
            }
            // Cannot be represented in common representation. Pass through.
        }
        var numOffsets = this.numOffsets();
        var denOffsets = this.denOffsets();
        var pos = 0;
        return (React.createElement("g", null, lodash_1.map(ts.beats, function (beatsOuter, idx) {
            var array = [
                lodash_1.map(beatsOuter, function (beats, jdx) { return [
                    React.createElement(TimeSignatureNumber, { key: "num_" + idx + "_" + jdx, stroke: spec.color, x: spec.defaultX +
                            (spec.relativeX || 0) +
                            numOffsets[idx] +
                            pos +
                            jdx * implAttributes_attributesData_1.NUMBER_SPACING, y: (_this.context.originY || 0) -
                            (spec.defaultY + (spec.relativeY || 0) + 10) }, String(beats)),
                    jdx + 1 !== beatsOuter.length && (React.createElement(private_views_glyph_1.default, { fill: "black", glyphName: "timeSigPlusSmall", key: "num_plus_numerator_" + idx + "_" + jdx, x: spec.defaultX +
                            (spec.relativeX || 0) +
                            numOffsets[idx] +
                            pos +
                            jdx * implAttributes_attributesData_1.NUMBER_SPACING +
                            17, y: (_this.context.originY || 0) -
                            spec.defaultY +
                            (spec.relativeY || 0) -
                            10 })),
                ]; }),
                React.createElement(TimeSignatureNumber, { key: "den", stroke: spec.color, x: spec.defaultX + (spec.relativeX || 0) + denOffsets[idx] + pos, y: (_this.context.originY || 0) -
                        (spec.defaultY + (spec.relativeY || 0) - 10) }, String(ts.beatType[idx])),
                idx + 1 !== ts.beats.length && (React.createElement(private_views_glyph_1.default, { fill: "black", glyphName: "timeSigPlus", key: "num_plus_" + idx, x: spec.defaultX +
                        (spec.relativeX || 0) +
                        numOffsets[idx] +
                        pos +
                        beatsOuter.length * implAttributes_attributesData_1.NUMBER_SPACING -
                        10, y: (_this.context.originY || 0) -
                        spec.defaultY +
                        (spec.relativeY || 0) })),
            ];
            pos += beatsOuter.length * implAttributes_attributesData_1.NUMBER_SPACING + implAttributes_attributesData_1.PLUS_SPACING;
            return array;
        })));
    };
    TimeSignatureView.prototype.numOffsets = function () {
        // This is sketchy.
        var ts = this._displayTimeSignature();
        return lodash_1.map(ts.beats, function (beats, idx) {
            if (beats.length > 1) {
                return 0;
            }
            var culm = 0;
            if (beats[0] < 10 && ts.beatType[idx] >= 10) {
                culm += 5;
            }
            return culm;
        });
    };
    TimeSignatureView.prototype.denOffsets = function () {
        // This is sketchy.
        var ts = this._displayTimeSignature();
        return lodash_1.map(ts.beatType, function (beatType, idx) {
            var culm = 0;
            var numToDenOffset = ((ts.beats[idx].length - 1) * implAttributes_attributesData_1.NUMBER_SPACING) / 2;
            culm += numToDenOffset;
            if (ts.beats[idx][0] >= 10 && beatType < 10) {
                culm += 7;
            }
            return culm;
        });
    };
    TimeSignatureView.prototype._displayTimeSignature = function () {
        var spec = this.props.spec;
        return {
            beatType: spec.beatTypes,
            beats: lodash_1.map(spec.beats, function (beats) {
                return beats.split("+").map(function (n) { return parseInt(n, 10); });
            }),
            commonRepresentation: spec.symbol === musicxml_interfaces_1.TimeSymbolType.Common ||
                spec.symbol === musicxml_interfaces_1.TimeSymbolType.Cut,
            singleNumber: spec.symbol === musicxml_interfaces_1.TimeSymbolType.SingleNumber,
        };
    };
    TimeSignatureView.contextTypes = {
        originY: PropTypes.number,
    };
    return TimeSignatureView;
}(react_1.Component));
exports.default = TimeSignatureView;
//# sourceMappingURL=implAttributes_timeSignatureView.js.map