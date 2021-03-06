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
import { map, reduce, find, last } from "lodash";
import invariant from "invariant";
import { getMeasureSegments, Type, reduceToShortestInSegments, } from "./document";
import { calculateLineBounds } from "./private_lineBounds";
import { layoutLine } from "./engine_processors_line";
var SQUISHINESS = 0.8;
function findPrint(options, measure) {
    var partWithPrint = find(measure.parts, function (part) {
        return !!part.staves[1] &&
            options.modelFactory.search(part.staves[1], 0, Type.Print).length > 0;
    });
    if (partWithPrint) {
        return options.modelFactory.search(partWithPrint.staves[1], 0, Type.Print)[0]._snapshot;
    }
    return null;
}
/**
 * Reducer that puts measures into lines.
 */
function assignLinesReducer(memo, measureInfo, idx, all) {
    var options = memo.options;
    var measures = options.measures;
    memo.thisPrint = findPrint(options, measures[idx]) || memo.thisPrint;
    if (!last(memo.opts).print) {
        last(memo.opts).print = memo.thisPrint;
    }
    invariant(!!memo.thisPrint, "No print found");
    if (!memo.options.singleLineMode) {
        if (measureInfo.attributesWidthStart > memo.widthAllocatedForStart) {
            memo.remainingWidth -=
                measureInfo.attributesWidthStart - memo.widthAllocatedForStart;
            memo.widthAllocatedForStart = measureInfo.attributesWidthStart;
        }
        if (measureInfo.attributesWidthEnd > memo.widthAllocatedForEnd) {
            memo.remainingWidth -=
                measureInfo.attributesWidthEnd - memo.widthAllocatedForEnd;
            memo.widthAllocatedForEnd = measureInfo.attributesWidthEnd;
        }
        var retroactiveIncrease = 0;
        if (memo.shortest > measureInfo.shortestCount) {
            var measuresOnLine = last(memo.opts).measures.length;
            var measuresInfo = all.slice(idx - measuresOnLine, idx);
            retroactiveIncrease = measuresInfo.reduce(function (increase, measure) {
                return (measure.widthByShortest[measureInfo.shortestCount] -
                    measure.widthByShortest[memo.shortest]);
            }, 0);
            memo.shortest = measureInfo.shortestCount;
        }
        var measureWidth = measureInfo.widthByShortest[memo.shortest];
        var totalIncrease = retroactiveIncrease + measureWidth;
        if (memo.remainingWidth > totalIncrease) {
            memo.remainingWidth -= totalIncrease;
        }
        else {
            memo.opts.push(createEmptyLayout(options, memo.thisPrint));
            memo.remainingWidth =
                memo.startingWidth -
                    measureWidth -
                    measureInfo.attributesWidthStart -
                    measureInfo.attributesWidthEnd;
            memo.widthAllocatedForStart = measureInfo.attributesWidthStart;
            memo.widthAllocatedForEnd = measureInfo.attributesWidthEnd;
        }
    }
    last(memo.opts).measures.push(measures[idx]);
    return memo;
}
function createEmptyLayout(options, print) {
    return __assign(__assign({}, options), { attributes: null, measures: [], print: print });
}
export function getApproximateMeasureWidth(measure, shortest) {
    return Object.keys(measure.parts).reduce(function (pwidth, partName) {
        var vwidth = measure.parts[partName].voices.reduce(function (vwidth, voice) {
            if (!voice) {
                return vwidth;
            }
            return voice.reduce(function (swidth, el) { return swidth + el.calcWidth(shortest); }, vwidth);
        }, 0);
        return Math.max(vwidth, pwidth);
    }, 0);
}
function getLinePlacementHints(measures) {
    var shortestByMeasure = measures.map(function (measure) {
        var segments = getMeasureSegments(measure);
        return reduce(segments, reduceToShortestInSegments, Number.MAX_VALUE);
    });
    var shortestsObj = shortestByMeasure.reduce(function (shortests, shortest) {
        shortests[shortest] = true;
        return shortests;
    }, {});
    var shortests = Object.keys(shortestsObj).map(function (str) { return parseInt(str, 10); });
    return map(measures, function layoutMeasure(measure, idx) {
        var shortestInMeasure = shortestByMeasure[idx];
        var numericMeasureWidth = !isNaN(measure.width) && measure.width !== null;
        if (numericMeasureWidth &&
            (measure.width <= 0 || !isFinite(measure.width))) {
            console.warn("Bad measure width %s. Ignoring", measure.width);
        }
        var widthByShortest = shortests.reduce(function (shortests, shortest) {
            if (shortest <= shortestInMeasure) {
                shortests[shortest] = getApproximateMeasureWidth(measure, shortest);
            }
            return shortests;
        }, {});
        // XXX: multiple rests
        return {
            widthByShortest: widthByShortest,
            shortestCount: shortestInMeasure,
            attributesWidthStart: 150,
            attributesWidthEnd: 50,
        };
    });
}
export default function layoutSong(options) {
    invariant(!!options.print, "Print not defined");
    invariant(!options.print._snapshot, "Pass a snapshot of Print to layoutSong, not the actual model!");
    var page = 1; // XXX
    var scaling = options.document.header.defaults.scaling;
    // Estimate the width of each measure, and the space available for each line.
    var boundsGuess = calculateLineBounds(options.print, page, scaling);
    var lineWidth = (boundsGuess.right - boundsGuess.left) / SQUISHINESS;
    var linePlacementHints = options.preview
        ? options.document.cleanlinessTracking.linePlacementHints
        : getLinePlacementHints(options.measures);
    options.document.cleanlinessTracking.linePlacementHints = linePlacementHints;
    // Assign measures to lines.
    var layoutOpts = reduce(linePlacementHints, assignLinesReducer, {
        options: options,
        opts: [createEmptyLayout(options, options.print)],
        remainingWidth: lineWidth,
        shortest: Number.MAX_VALUE,
        startingWidth: lineWidth,
        thisPrint: options.print,
        widthAllocatedForEnd: 0,
        widthAllocatedForStart: 0,
    }).opts;
    layoutOpts.forEach(function (line, idx) {
        line.lineIndex = idx;
        line.lineCount = layoutOpts.length;
        line.attributes = {};
    });
    if (!options.preview) {
        var oldLineCleanliness = options.document.cleanlinessTracking.lines || [];
        var newLineCleanliness = layoutOpts.map(function (line) { return line.measures.map(function (measure) { return measure.uuid; }); }) || [];
        var _loop_1 = function (i) {
            var oldLine = oldLineCleanliness[i] || [];
            var newLine = newLineCleanliness[i] || [];
            var isDirty = !oldLine ||
                !newLine ||
                oldLine.length !== newLine.length ||
                oldLine.some(function (m, k) { return newLine[k] !== m; });
            if (isDirty) {
                oldLine.concat(newLine).forEach(function (m) {
                    options.document.cleanlinessTracking.measures[m] = null;
                });
            }
        };
        for (var i = 0; i < oldLineCleanliness.length || i < newLineCleanliness.length; ++i) {
            _loop_1(i);
        }
        options.document.cleanlinessTracking.lines = newLineCleanliness;
    }
    // Create the final layout
    var memo = {
        y: calculateLineBounds(layoutOpts[0].print, page, scaling).top,
        attributes: {},
    };
    return layoutOpts.map(function (lineOpt) {
        return layoutLine(lineOpt, calculateLineBounds(lineOpt.print, page, scaling), memo);
    });
}
//# sourceMappingURL=engine_processors_layout.js.map