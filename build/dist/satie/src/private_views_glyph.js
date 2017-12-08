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
var private_smufl_1 = require("./private_smufl");
var private_fontManager_1 = require("./private_fontManager");
/**
 * Most musical elements are rendered as glyphs. Exceptions include
 * slurs, ties, dots in dotted notes, ledger lines, and stave lines.
 */
var Glyph = /** @class */ (function (_super) {
    __extends(Glyph, _super);
    function Glyph() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Glyph.prototype.render = function () {
        var px = this.props.x;
        var py = this.props.y;
        if (this.context.renderTarget === "svg-export") {
            var pathData = private_fontManager_1.toPathData("Bravura", private_smufl_1.getGlyphCode(this.props.glyphName), px, py, 40 * (this.props.scale || 1));
            return DOM.path({ d: pathData }, null);
        }
        var text = DOM.text({
            className: "mn_",
            fill: this.props.fill,
            fillOpacity: this.props.opacity,
            fontSize: 40 * (this.props.scale || 1),
            strokeOpacity: this.props.opacity,
            transform: this.props.transform,
            x: px,
            y: py
        }, private_smufl_1.getGlyphCode(this.props.glyphName));
        return text;
    };
    Glyph.contextTypes = {
        renderTarget: PropTypes.oneOf(["svg-web", "svg-export"])
    };
    return Glyph;
}(react_1.Component));
exports.default = Glyph;
//# sourceMappingURL=private_views_glyph.js.map