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
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var DOM = require("react-dom-factories");
var PropTypes = require("prop-types");
var invariant = require("invariant");
var private_views_glyph_1 = require("./private_views_glyph");
var private_chordUtil_1 = require("./private_chordUtil");
var private_smufl_1 = require("./private_smufl");
var $Glyph = react_1.createFactory(private_views_glyph_1.default);
var AccidentalView = /** @class */ (function (_super) {
    __extends(AccidentalView, _super);
    function AccidentalView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AccidentalView.prototype.render = function () {
        var spec = this.props.spec;
        var glyphName = private_chordUtil_1.accidentalGlyphs[this.props.spec.accidental];
        invariant(glyphName in private_smufl_1.bboxes, "Expected a glyph, got %s", glyphName);
        var originY = (this.context.originY || 0);
        var shift = spec.parentheses ? 4 : 0;
        var y = originY - (spec.defaultY + (spec.relativeY || 0));
        invariant(!isNaN(y), "Invalid accidental y-position");
        var accidental = $Glyph({
            fill: spec.color,
            glyphName: glyphName,
            x: (this.props.noteDefaultX || 0) + spec.defaultX + (spec.relativeX || 0) + shift,
            y: y,
        });
        if (spec.parentheses || spec.bracket) {
            var width = private_smufl_1.bboxes[glyphName][0] * 10; // TODO: it's actually 2 - 0!
            return DOM.g(null, $Glyph({
                fill: "#000000",
                glyphName: "accidentalParensLeft",
                x: (this.props.noteDefaultX || 0) + spec.defaultX + (spec.relativeX || 0) - 7 + shift,
                y: originY - (spec.defaultY + (spec.relativeY || 0))
            }), accidental, $Glyph({
                fill: "#000000",
                glyphName: "accidentalParensRight",
                x: (this.props.noteDefaultX || 0) + spec.defaultX + (spec.relativeX || 0) + width + shift,
                y: originY - (spec.defaultY + (spec.relativeY || 0))
            })
            /* DOM.g */ );
        }
        else {
            return accidental;
        }
    };
    AccidentalView.contextTypes = {
        originY: PropTypes.number,
    };
    return AccidentalView;
}(react_1.Component));
exports.default = AccidentalView;
//# sourceMappingURL=implAttributes_accidentalView.js.map