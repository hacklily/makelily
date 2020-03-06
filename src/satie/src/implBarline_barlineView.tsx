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

import * as React from "react";
import { PartSymbolType } from "musicxml-interfaces";
import { Component, ReactElement } from "react";
import * as PropTypes from "prop-types";
import { some, map } from "lodash";

import Line from "./private_views_line";

import AttributesView from "./implAttributes_attributesView";

import { IBarlineLayout } from "./implBarline_barlineModel";

/**
 * Renders a full-stave-height barline at (x,y).
 * Does not do any interesting calculations.
 */
export default class BarlineView extends Component<
  { layout: IBarlineLayout },
  {}
> {
  static contextTypes = {
    originY: PropTypes.number.isRequired,
    systemBottom: PropTypes.number.isRequired,
    systemTop: PropTypes.number.isRequired,
  } as any;

  context: {
    originY: number;
    systemBottom: number;
    systemTop: number;
  };

  render(): ReactElement<any> {
    const originY = this.context.originY;

    const layout = this.props.layout;
    const model = layout.model;

    const x = model.defaultX;
    const y = originY - model.defaultY;

    // TODO: render BarStyleType.Dashed:
    // TODO: render BarStyleType.Dotted:
    // TODO: render BarStyleType.Short:
    // TODO: render BarStyleType.Tick:

    let yTop: number;
    let yBottom: number;
    if (
      (layout.partSymbol && layout.partSymbol.type !== PartSymbolType.None) ||
      (layout.partGroups &&
        some(layout.partGroups, group => group.groupBarline))
    ) {
      yTop = this.context.systemTop;
      yBottom = this.context.systemBottom;
    } else {
      yTop = y - layout.height - layout.yOffset;
      yBottom = y + layout.height - layout.yOffset;
    }

    if (model.satieAttributes) {
      model.satieAttributes.overrideX =
        layout.overrideX + model.satieAttribsOffset;
    }

    return (
      <g>
        {map(layout.lineStarts, (start, idx) => (
          <Line
            key={idx}
            stroke={model.barStyle.color}
            strokeWidth={layout.lineWidths[idx]}
            x1={x + start + layout.lineWidths[idx] / 2}
            x2={x + start + layout.lineWidths[idx] / 2}
            y1={yTop}
            y2={yBottom}
          />
        ))}
        {model.satieAttributes && (
          <AttributesView layout={model.satieAttributes} />
        )}
      </g>
    );
  }
}
