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
Object.defineProperty(exports, "__esModule", { value: true });
var webcola_1 = require("webcola");
var lodash_1 = require("lodash");
function colaRemoveOverlapsSomeFixed(rs) {
    // Prefer y
    var vs = rs.map(function (r) {
        return new webcola_1.Variable(r.cy(), r.mxmlBox.fixed ? Number.POSITIVE_INFINITY : 1);
    });
    var cs = webcola_1.generateYConstraints(rs, vs);
    var solver = new webcola_1.Solver(vs, cs);
    solver.solve();
    vs.forEach(function (v, i) { return rs[i].setYCentre(v.position()); });
    // Move x if needed
    vs = rs.map(function (r) { return new webcola_1.Variable(r.cx(), r.mxmlBox.fixed ? Number.POSITIVE_INFINITY : 1); });
    cs = webcola_1.generateXConstraints(rs, vs);
    solver = new webcola_1.Solver(vs, cs);
    solver.solve();
    vs.forEach(function (v, i) { return rs[i].setXCentre(v.position()); });
}
function removeOverlaps(options, bounds, measures) {
    lodash_1.forEach(measures, function centerThings(measure, idx) {
        var boxes = [];
        lodash_1.forEach(measure.elements, function (segment, si) {
            lodash_1.forEach(segment, function (element, j) {
                lodash_1.forEach(element.boundingBoxes, function (box) {
                    if (box.left >= box.right) {
                        console.warn("Invalid left >= right (%s >= %s)", box.left, box.right);
                        box.right = box.left + 0.01;
                    }
                    if (box.top >= box.bottom) {
                        console.warn("Invalid top >= bottom (%s >= %s)", box.top, box.bottom);
                        box.bottom = box.top + 0.01;
                    }
                    if (isNaN(box.top) || isNaN(box.bottom) || isNaN(box.left) || isNaN(box.right)) {
                        console.warn("Invalid box.{top, bottom, left, right} = {%s, %s, %s, %s}", box.top, box.bottom, box.left, box.right);
                        return;
                    }
                    var rect = new webcola_1.Rectangle(element.overrideX + box.defaultX + box.left, element.overrideX + box.defaultX + box.right, box.defaultY + box.top, box.defaultY + box.bottom);
                    rect.mxmlBox = box;
                    rect.parent = element;
                    boxes.push(rect);
                });
            });
        });
        colaRemoveOverlapsSomeFixed(boxes);
        lodash_1.forEach(boxes, function (box) {
            var expectedX = box.parent.overrideX + box.mxmlBox.defaultX + box.mxmlBox.left;
            var expectedY = box.mxmlBox.defaultY + box.mxmlBox.top;
            var actualX = box.x;
            var actualY = box.y;
            box.mxmlBox.relativeX = actualX - expectedX;
            box.mxmlBox.relativeY = actualY - expectedY;
        });
    });
    return measures;
}
exports.default = removeOverlaps;
//# sourceMappingURL=implLine_removeOverlapsPostprocessor.js.map