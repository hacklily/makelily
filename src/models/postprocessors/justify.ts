/** 
 * (C) Josh Netterfield <joshua@nettek.ca> 2015.
 * Part of the Satie music engraver <https://github.com/ripieno/satie>.
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import _ = require("lodash");

import Engine = require("../engine");

const UNDERFILLED_EXPANSION_WEIGHT = 0.1;

/** 
 * Evaluates S(t), the logistic function. Used to create aesthetic transitions.
 * For example, the upper half of the logistic function is used to compute how much
 * spacing should be on the final line of a song.
 */
function logistic(t: number) {
    return 1/(1 + Math.exp(-t));
}

/** 
 * Lays out measures within a bar & justifies.
 * 
 * @returns new end of line
 */
function justify(options: Engine.Options.ILayoutOptions, bounds: Engine.Options.ILineBounds,
        measures$: Engine.Measure.IMeasureLayout[]): Engine.Measure.IMeasureLayout[] {

    const x = bounds.left + _.reduce(measures$, (sum, measure) => sum + measure.width, 0);

    // Check for underfilled bars
    const underfilled = _.map(measures$, (measure, idx) => {
        let attr = measures$[idx].attributes;
        let firstPart = options.header.partList.scoreParts[0].id;
        let divs = Engine.IChord.barDivisions(attr[firstPart]);
        let maxDivs = measure.maxDivisions;
        return maxDivs < divs;
    });

    let smallest = Number.POSITIVE_INFINITY;
    _.forEach(measures$, function(measure, measureIdx) {
        let maxIdx = _.max(_.map(measure.elements, el => el.length));
        _.times(maxIdx, function(j) {
            for (let i = 0; i < measure.elements.length; ++i) {
                if (measure.elements[i][j].expandPolicy) {
                    if (measure.elements[i][j].model && measure.elements[i][j].model.divCount) {
                        smallest = Math.min(measure.elements[i][j].model.divCount, smallest);
                    }
                }
            }
        });
    });

    // x > enX is possible if a single bar's minimum size exceeds maxX, or if our
    // guess for a measure width was too liberal. In either case, we're shortening
    // the measure width here, and our partial algorithm doesn't work with negative
    // padding.
    let partial = x < bounds.right && options.line + 1 === options.lines;
    let underfilledCount = 0;

    let expandableCount = _.reduce(measures$, function(memo, measure$, idx) {
        // Precondition: all layouts at a given index have the same "expandable" value.
        return _.reduce(measure$.elements[0], function(memo, element$) {
            if (underfilled[idx] && element$.expandPolicy) {
                ++underfilledCount;
            }
            if (!element$.model || !element$.model.divCount) {
                return memo;
            }
            let expandBy = 0;

            if (element$.expandPolicy) { // is not none
                expandBy = (Math.log(element$.model.divCount) - Math.log(smallest) + 1);
            }

            return memo + expandBy*(underfilled[idx] ? UNDERFILLED_EXPANSION_WEIGHT : 1.0);
        }, memo);
    }, 0);

    let avgExpansion: number;
    if (!expandableCount) { // case 1: nothing to expand
        avgExpansion = 0;
    } else if (partial) { // case 2: expanding, but not full width
        let expansionRemainingGuess = bounds.right - 3 - x;
        let avgExpansionGuess = expansionRemainingGuess /
            (expandableCount + (1-UNDERFILLED_EXPANSION_WEIGHT)*underfilledCount);
        let weight = logistic((avgExpansionGuess - bounds.right / 80) / 20) * 2 / 3;
        avgExpansion = (1 - weight)*avgExpansionGuess;
    } else { // case 3: expanding or contracting to full width
        let exp = bounds.right - x;
        avgExpansion = exp/expandableCount;
    }

    let anyExpandable = false;
    let totalExpCount = 0;
    let lineExpansion = 0;
    _.forEach(measures$, function(measure, measureIdx) {
        measure.originX += lineExpansion;

        let measureExpansion = 0;
        let maxIdx = _.max(_.map(measure.elements, el => el.length));
        _.times(maxIdx, function(j) {
            for (let i = 0; i < measure.elements.length; ++i) {
                measure.elements[i][j].x$ += measureExpansion;
            }
            let expandOne = false;
            for (let i = 0; i < measure.elements.length; ++i) {
                if (measure.elements[i][j].expandPolicy) {
                    anyExpandable = true;
                    if (!measure.elements[i][j].model || !measure.elements[i][j].model.divCount) {
                        continue;
                    }

                    let divCount = measure.elements[i][j].model.divCount;
                    let ratio = (Math.log(divCount) - Math.log(smallest) + 1) *
                        (underfilled[measureIdx] ? UNDERFILLED_EXPANSION_WEIGHT : 1.0);

                    if (!expandOne) {
                        measureExpansion += avgExpansion*ratio;
                        totalExpCount += ratio;
                    }
                    expandOne = true;
                }
            }
        });

        measure.width += measureExpansion;
        lineExpansion += measureExpansion;
    });

    return measures$;
}

export = justify;

