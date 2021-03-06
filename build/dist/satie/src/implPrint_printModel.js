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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { NormalItalic, NormalBold, serializePrint, OddEvenBoth, } from "musicxml-interfaces";
import { forEach, defaultsDeep } from "lodash";
import invariant from "invariant";
import { Type } from "./document";
import { calculateLineBounds } from "./private_lineBounds";
var PrintModel = /** @class */ (function () {
    /*---- Implementation -----------------------------------------------------------------------*/
    function PrintModel(spec) {
        var _this = this;
        this._class = "Print";
        /*---- I.1 IModel ---------------------------------------------------------------------------*/
        this.divCount = 0;
        this.divisions = 0;
        forEach(spec, function (value, key) {
            _this[key] = value;
        });
    }
    PrintModel.prototype.refresh = function (cursor) {
        invariant(!!cursor.header, "Cursor must have a valid header");
        if (!this.measureNumbering) {
            cursor.patch(function (staff) {
                return staff.print(function (print) {
                    return print.measureNumbering({
                        data: "system",
                    });
                });
            });
        }
        if (this.pageNumber !== "1") {
            // XXX: Make this the actual page number
            cursor.patch(function (staff) { return staff.print(function (print) { return print.pageNumber("1"); }); });
        }
        if (!this.systemLayout) {
            cursor.patch(function (staff) { return staff.print(function (print) { return print.systemLayout({}); }); });
        }
        var atStart = this.pageNumber === "1" && cursor.measureInstance.idx === 0;
        if (!this.systemLayout.systemMargins ||
            (atStart && !this.systemLayout.systemMargins.leftMargin)) {
            cursor.patch(function (staff) {
                return staff.print(function (print) {
                    return print.systemLayout(function (systemLayout) {
                        return systemLayout.systemMargins({
                            leftMargin: atStart ? 70 : 0,
                            rightMargin: 0,
                        });
                    });
                });
            });
        }
        var defaultPrint = extractDefaultPrintFromHeader(cursor.header);
        this._snapshot = this.getSnapshot(defaultPrint, cursor.singleLineMode, cursor.header);
    };
    PrintModel.prototype.getLayout = function (cursor) {
        return new PrintModel.Layout(this, cursor);
    };
    PrintModel.prototype.getSnapshot = function (parent, singleLineMode, header) {
        var print = defaultsDeep({
            measureNumbering: this.measureNumbering,
            partNameDisplay: this.partNameDisplay,
            newSystem: this.newSystem,
            newPage: this.newPage,
            blankPage: this.blankPage,
            measureLayout: this.measureLayout,
            partAbbreviationDisplay: this.partAbbreviationDisplay,
            pageLayout: this.pageLayout,
            systemLayout: this.systemLayout,
            staffSpacing: this.staffSpacing,
            staffLayouts: this.staffLayouts,
            pageNumber: this.pageNumber,
        }, parent);
        if (singleLineMode) {
            var defaults = header.defaults;
            var scale40 = (defaults.scaling.millimeters / defaults.scaling.tenths) * 40;
            var firstLineBounds = calculateLineBounds(print, 0, defaults.scaling);
            var systems = 1; // FIXME
            return __assign(__assign({}, print), { systemLayout: {
                    systemDistance: 20,
                    systemDividers: print.systemLayout.systemDividers,
                    systemMargins: {
                        leftMargin: 0,
                        rightMargin: 0,
                    },
                    topSystemDistance: 0,
                }, pageLayout: __assign(__assign({}, print.pageLayout), { pageHeight: scale40 * 10 * systems +
                        firstLineBounds.systemLayout.systemDistance * (systems - 1) +
                        80, pageMargins: [
                        {
                            bottomMargin: 40,
                            leftMargin: 0,
                            rightMargin: 0,
                            topMargin: 40,
                            type: OddEvenBoth.Both,
                        },
                    ] }) });
        }
        return print;
    };
    PrintModel.prototype.toXML = function () {
        return serializePrint(this) + "\n<forward><duration>" + this.divCount + "</duration></forward>\n";
    };
    PrintModel.prototype.toJSON = function () {
        var _a = this, _class = _a._class, measureNumbering = _a.measureNumbering, partNameDisplay = _a.partNameDisplay, newSystem = _a.newSystem, newPage = _a.newPage, blankPage = _a.blankPage, measureLayout = _a.measureLayout, partAbbreviationDisplay = _a.partAbbreviationDisplay, pageLayout = _a.pageLayout, systemLayout = _a.systemLayout, staffSpacing = _a.staffSpacing, staffLayouts = _a.staffLayouts, pageNumber = _a.pageNumber;
        return {
            _class: _class,
            measureNumbering: measureNumbering,
            partNameDisplay: partNameDisplay,
            newSystem: newSystem,
            newPage: newPage,
            blankPage: blankPage,
            measureLayout: measureLayout,
            partAbbreviationDisplay: partAbbreviationDisplay,
            pageLayout: pageLayout,
            systemLayout: systemLayout,
            staffSpacing: staffSpacing,
            staffLayouts: staffLayouts,
            pageNumber: pageNumber,
        };
    };
    PrintModel.prototype.inspect = function () {
        return this.toXML();
    };
    PrintModel.prototype.calcWidth = function (_shortest) {
        return 0;
    };
    PrintModel.Layout = /** @class */ (function () {
        function Layout(model, cursor) {
            // Prototype:
            this.boundingBoxes = [];
            this.renderClass = Type.Print;
            this.expandPolicy = "none";
            this.model = model;
            this.x = cursor.segmentX;
            this.division = cursor.segmentDivision;
            this.renderedWidth = 0;
        }
        return Layout;
    }());
    return PrintModel;
}());
function extractDefaultPrintFromHeader(header) {
    return {
        blankPage: "",
        measureLayout: null,
        measureNumbering: {
            color: "#000000",
            data: "system",
            defaultX: null,
            defaultY: null,
            fontFamily: "Alegreya, serif",
            fontSize: "small",
            fontStyle: NormalItalic.Normal,
            fontWeight: NormalBold.Normal,
            relativeX: 0,
            relativeY: 0,
        },
        newPage: false,
        newSystem: false,
        pageLayout: header.defaults.pageLayout,
        pageNumber: "",
        partAbbreviationDisplay: null,
        partNameDisplay: null,
        staffLayouts: header.defaults.staffLayouts,
        staffSpacing: null,
        systemLayout: header.defaults.systemLayout,
    };
}
/**
 * Registers Print in the factory structure passed in.
 */
export default function Export(constructors) {
    constructors[Type.Print] = PrintModel;
}
//# sourceMappingURL=implPrint_printModel.js.map