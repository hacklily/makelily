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

import { forEach, max, map, times, findIndex, last } from "lodash";
import invariant from "invariant";

import { Type } from "./document";

import { IMeasureLayout } from "./private_measureLayout";
import { ILayoutOptions } from "./private_layoutOptions";
import { ILineBounds } from "./private_lineBounds";

/**
 * Centers elements marked as such
 *
 * @returns new end of line
 */
function center(
  options: ILayoutOptions,
  bounds: ILineBounds,
  measures: IMeasureLayout[],
): IMeasureLayout[] {
  forEach(measures, function(measure, measureIdx) {
    let maxIdx = max(map(measure.elements, el => el.length));
    times(maxIdx, function(j) {
      for (let i = 0; i < measure.elements.length; ++i) {
        if (measure.elements[i][j].expandPolicy === "centered") {
          let intrinsicWidth = measure.elements[i][j].renderedWidth;
          invariant(
            isFinite(intrinsicWidth),
            "Intrinsic width must be set on centered items",
          );
          let measureSpaceRemaining: number;
          let attribIdx = findIndex(
            measure.elements[0],
            el => el.renderClass === Type.Attributes && el.renderedWidth > 0,
          );
          let base = 0;
          if (attribIdx !== -1 && attribIdx < j) {
            base =
              measure.elements[0][attribIdx].overrideX +
              measure.elements[0][attribIdx].renderedWidth;
            measureSpaceRemaining = last(measure.elements[i]).overrideX - base;
          } else if (measures[measureIdx - 1]) {
            measureSpaceRemaining =
              last(measure.elements[i]).overrideX -
              (measures[measureIdx - 1].width -
                last(measures[measureIdx - 1].elements[0]).overrideX);
          } else {
            measureSpaceRemaining = last(measure.elements[i]).overrideX;
          }
          if (
            measures[measureIdx + 1] &&
            measures[measureIdx + 1].width === 0
          ) {
            measureSpaceRemaining += 16.6;
          }
          measure.elements[i][j].x =
            base + measureSpaceRemaining / 2 - intrinsicWidth / 2;
        }
      }
    });
  });

  return measures;
}

export default center;
