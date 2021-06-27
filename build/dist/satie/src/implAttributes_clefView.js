/**
 * This file is part of Satie music engraver <https://github.com/emilyskidsister/satie>.
 * Copyright (C) Jocelyn Stericker <jocelyn@nettek.ca> 2015 - present.
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
import * as React from "react";
import { SymbolSize } from "musicxml-interfaces";
import { Component } from "react";
import * as PropTypes from "prop-types";
import Glyph from "./private_views_glyph";
import { bboxes } from "./private_smufl";
/**
 * Responsible for the rendering of a clef.
 */
var ClefView = /** @class */ (function (_super) {
    __extends(ClefView, _super);
    function ClefView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ClefView.prototype.render = function () {
        var spec = this.props.spec;
        if (spec.printObject === false) {
            return null;
        }
        var clefX = spec.defaultX + (spec.relativeX || 0);
        var clefY = (this.context.originY || 0) -
            (spec.defaultY + (spec.relativeY || 0) + (this.renderedLine() - 3) * 10);
        var clefSign = this.sign();
        if (!clefSign) {
            return null;
        }
        var clefGlyph = (React.createElement(Glyph, { fill: spec.color, glyphName: clefSign, x: clefX, y: clefY }));
        var clefOctaveChange = parseInt(spec.clefOctaveChange, 10);
        var clefDecorations = [];
        var clefSignBox = bboxes[clefSign];
        var left = clefSignBox[0];
        var top = clefSignBox[1];
        var right = clefSignBox[2];
        var bottom = clefSignBox[3]; // The linter doesn't like destructuring yet :(
        // We want it to actually touch, not just be outside the bbox
        var bScalingFactor = spec.sign.toUpperCase() === "F" ? 0.7 : 1;
        var topLeftOffset = spec.sign.toUpperCase() === "G" ? left * 2 : 0;
        top = -top * 10 + clefY;
        bottom = -bottom * 10 * bScalingFactor + clefY;
        left = left * 10 + clefX;
        right = right * 10 + clefX;
        var decorativeX = (left + right) / 2;
        if (clefOctaveChange === 2) {
            clefDecorations.push(React.createElement(Glyph, { fill: spec.color, glyphName: "clef15", key: "15ma", x: decorativeX -
                    (bboxes["clef15"][0] * 10 + bboxes["clef15"][2] * 10) / 2 +
                    topLeftOffset, y: top }));
        }
        else if (clefOctaveChange === 1) {
            clefDecorations.push(React.createElement(Glyph, { fill: spec.color, glyphName: "clef8", key: "8va", x: decorativeX -
                    (bboxes["clef8"][0] * 10 + bboxes["clef8"][2] * 10) / 2 +
                    topLeftOffset, y: top }));
        }
        else if (clefOctaveChange === -1) {
            clefDecorations.push(React.createElement(Glyph, { fill: spec.color, glyphName: "clef8", key: "8vb", x: decorativeX -
                    (bboxes["clef8"][0] * 10 + bboxes["clef8"][2] * 10) / 2, y: bottom + bboxes["clef8"][1] * 10 }));
        }
        else if (clefOctaveChange === -2) {
            clefDecorations.push(React.createElement(Glyph, { fill: spec.color, glyphName: "clef15", key: "15mb", x: decorativeX -
                    (bboxes["clef15"][0] * 10 + bboxes["clef15"][2] * 10) / 2, y: bottom + bboxes["clef15"][1] * 10 }));
        }
        if (clefDecorations) {
            return (React.createElement("g", null,
                clefGlyph,
                clefDecorations));
        }
        else {
            return clefGlyph;
        }
    };
    ClefView.prototype.sign = function () {
        var clef = this.props.spec.sign.toLowerCase();
        if (clef === "percussion") {
            return "unpitchedPercussionClef1";
        }
        else if (clef === "tab") {
            return "6stringTabClef";
        }
        else if (clef === "none") {
            return null;
        }
        else {
            return (clef +
                "Clef" +
                (this.props.spec.size === SymbolSize.Cue ? "Change" : ""));
        }
    };
    ClefView.prototype.renderedLine = function () {
        // The TAB glyph is higher than expected.
        if (this.props.spec.sign.toLowerCase() === "tab") {
            return this.props.spec.line - 2;
        }
        return this.props.spec.line;
    };
    ClefView.contextTypes = {
        originY: PropTypes.number,
    };
    return ClefView;
}(Component));
export default ClefView;
//# sourceMappingURL=implAttributes_clefView.js.map