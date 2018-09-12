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
var musicxml_interfaces_1 = require("musicxml-interfaces");
var react_1 = require("react");
var DOM = __importStar(require("react-dom-factories"));
var PropTypes = __importStar(require("prop-types"));
var lodash_1 = require("lodash");
var invariant_1 = __importDefault(require("invariant"));
var private_renderUtil_1 = require("./private_renderUtil");
var private_views_textMixin_1 = require("./private_views_textMixin");
var CreditView = /** @class */ (function (_super) {
    __extends(CreditView, _super);
    function CreditView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CreditView.prototype.render = function () {
        var _this = this;
        var image = this.props.creditImage;
        var words = this.props.creditWords;
        var scale40 = this.context.scale40;
        invariant_1.default(!image, "Not implemented"); // There is either words or image, but not both
        invariant_1.default(!!words, "Unknown component type");
        if (!!words && !words.length) {
            return DOM.g({});
        }
        var initX = (words[0].defaultX + (words[0].relativeX || 0));
        var initY = (this.context.originY - (words[0].defaultY + (words[0].relativeY || 0)));
        return DOM.text({
            x: initX,
            y: initY
        }, lodash_1.map(words, function (words, idx) {
            var isItalic = words.fontStyle === musicxml_interfaces_1.NormalItalic.Italic;
            var isBold = words.fontWeight === musicxml_interfaces_1.NormalBold.Bold;
            var fontSize = private_renderUtil_1.cssSizeToTenths(scale40, words.fontSize);
            return lodash_1.map(words.words.split("\n"), function (line, lineNum) { return DOM.tspan({
                alignmentBaseline: "hanging",
                fill: words.color || "black",
                direction: _this.getDirection(words),
                dx: _this.getDX(words, initX, lineNum),
                dy: _this.getDY(words, initY, lineNum),
                fontStyle: isItalic ? "italic" : "normal",
                fontWeight: isBold ? "bold" : "normal",
                fontFamily: words.fontFamily || "Alegreya",
                fontSize: fontSize,
                key: idx + "l" + lineNum,
                letterSpacing: words.letterSpacing && words.letterSpacing !== "normal" ?
                    ("" + private_renderUtil_1.cssSizeToTenths(_this.context.scale40, words.letterSpacing)) : "normal",
                textDecoration: _this.getTextDecoration(words),
                textAnchor: _this.getTextAnchor(words),
                transform: _this.getTransform(words),
                x: _this.getX(lineNum)
            }, line); });
        })
        /* DOM.text */ );
    };
    CreditView.contextTypes = {
        originY: PropTypes.number.isRequired,
        scale40: PropTypes.number.isRequired
    };
    return CreditView;
}(react_1.Component));
exports.default = CreditView;
lodash_1.extend(CreditView.prototype, private_views_textMixin_1.Prototype);
//# sourceMappingURL=implPage_creditView.js.map