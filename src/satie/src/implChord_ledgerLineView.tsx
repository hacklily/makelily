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

import { PrintStyle } from "musicxml-interfaces";
import React, { Component } from "react";
import * as PropTypes from "prop-types";

import Line from "./private_views_line";
import { bboxes } from "./private_smufl";

export interface IProps {
  key?: string | number;
  spec: PrintStyle;
  notehead: string;
}

/**
 * Renders a ledger line at (x, y + line).
 */
export default class LedgerLine extends Component<IProps, {}> {
  static contextTypes = {
    originY: PropTypes.number.isRequired,
  } as any;

  context: {
    originY: number;
  };

  render(): any {
    const spec = this.props.spec;
    const west = bboxes[this.props.notehead][3];
    const east = bboxes[this.props.notehead][0];
    const xOffset = (east - west) * 10;
    return (
      <Line
        stroke={spec.color}
        strokeWidth={2.2}
        // Ledger lines should be thicker than regular lines.
        x1={spec.defaultX + (spec.relativeX || 0) - 3.2}
        x2={spec.defaultX + (spec.relativeX || 0) + xOffset - 0.2}
        y1={this.context.originY - spec.defaultY - (spec.relativeX || 0)}
        y2={this.context.originY - spec.defaultY - (spec.relativeX || 0)}
      />
    );
  }
}
