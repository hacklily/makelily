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
var lodash_1 = require("lodash");
var private_views_line_1 = require("./private_views_line");
var private_smufl_1 = require("./private_smufl");
var $Line = react_1.createFactory(private_views_line_1.default);
/**
 * Renders the (usually 5) lines that make up a staff.
 */
var StaffLines = /** @class */ (function (_super) {
    __extends(StaffLines, _super);
    function StaffLines() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    StaffLines.prototype.render = function () {
        var _this = this;
        var middle = this.context.originY - this.props.defaultY;
        var staffDetails = this.props.staffDetails;
        var offset = (staffDetails.staffLines - 1) / 2;
        return DOM.g(null, lodash_1.times(staffDetails.staffLines, function (i) { return $Line({
            key: "staff-" + i,
            stroke: "#6A6A6A",
            // TODO: Use print
            strokeWidth: private_smufl_1.bravura.engravingDefaults.staffLineThickness * 10,
            x1: _this.props.defaultX,
            x2: _this.props.defaultX + _this.props.width,
            y1: middle - 10 * (i - offset),
            y2: middle - 10 * (i - offset)
        }); })
        /* DOM.g */ );
    };
    StaffLines.contextTypes = {
        originY: PropTypes.number.isRequired
    };
    return StaffLines;
}(react_1.Component));
exports.default = StaffLines;
//# sourceMappingURL=implAttributes_staffLinesView.js.map