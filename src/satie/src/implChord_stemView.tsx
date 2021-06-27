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

import * as React from "react";
import { Stem, StemType, Tremolo } from "musicxml-interfaces";
import { Component } from "react";
import * as PropTypes from "prop-types";
import invariant from "invariant";

import Line from "./private_views_line";
import Glyph from "./private_views_glyph";
import { getFontOffset } from "./private_smufl";

export interface IProps {
  key?: string | number;
  spec: Stem;
  notehead: string;
  bestHeight: number;
  width: number;
  tremolo: Tremolo;
}

/**
 * Renders a stem based on a height decided in Note.
 */
export default class StemView extends Component<IProps, {}> {
  static contextTypes = {
    originY: PropTypes.number.isRequired,
  } as any;

  context: {
    originY: number;
  };

  render(): any {
    const { spec, notehead, tremolo, width } = this.props;
    const { defaultX, relativeX, defaultY, relativeY, color } = spec;
    if (spec.type === StemType.Double) {
      return null;
    }
    const direction = spec.type === StemType.Up ? 1 : -1; // TODO: StemType.Double
    const lineXOffset = (direction * -width) / 2;
    const offset = getFontOffset(notehead, direction) || [0];
    const x = defaultX + (relativeX || offset[0] * 10 + lineXOffset);
    invariant(isFinite(x), "Invalid x offset %s", x);

    const dY = this.props.bestHeight * direction;

    let elements: any[] = [];
    elements.push(
      <Line
        key="s"
        stroke={color}
        strokeWidth={width}
        x1={x}
        x2={x}
        y1={this.context.originY - defaultY - (relativeY || 0) - offset[1] * 10}
        y2={
          this.context.originY -
          defaultY -
          (relativeY || 0) -
          offset[1] * 10 -
          dY
        }
      />,
    );

    if (tremolo) {
      elements.push(
        <Glyph
          key="t"
          glyphName={`tremolo${tremolo.data || "1"}`}
          x={x}
          fill="black"
          y={this.context.originY - defaultY - (relativeY || 0) - (dY * 4) / 5}
        />,
      );
    }

    if (elements.length === 1) {
      return elements[0];
    } else {
      return <g>{elements}</g>;
    }
  }
}
