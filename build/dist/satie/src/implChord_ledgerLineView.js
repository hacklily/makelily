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
    }
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
var react_1 = require("react");
var PropTypes = __importStar(require("prop-types"));
var private_views_line_1 = __importDefault(require("./private_views_line"));
var private_smufl_1 = require("./private_smufl");
var $Line = react_1.createFactory(private_views_line_1.default);
/**
 * Renders a ledger line at (x, y + line).
 */
var LedgerLine = /** @class */ (function (_super) {
    __extends(LedgerLine, _super);
    function LedgerLine() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LedgerLine.prototype.render = function () {
        var spec = this.props.spec;
        var west = private_smufl_1.bboxes[this.props.notehead][3];
        var east = private_smufl_1.bboxes[this.props.notehead][0];
        var xOffset = (east - west) * 10;
        return $Line({
            stroke: spec.color,
            strokeWidth: 2.2,
            // Ledger lines should be thicker than regular lines.
            x1: spec.defaultX + (spec.relativeX || 0) - 3.2,
            x2: spec.defaultX + (spec.relativeX || 0) + xOffset - 0.2,
            y1: this.context.originY - spec.defaultY - (spec.relativeX || 0),
            y2: this.context.originY - spec.defaultY - (spec.relativeX || 0)
        });
    };
    LedgerLine.contextTypes = {
        originY: PropTypes.number.isRequired
    };
    return LedgerLine;
}(react_1.Component));
exports.default = LedgerLine;
//# sourceMappingURL=implChord_ledgerLineView.js.map