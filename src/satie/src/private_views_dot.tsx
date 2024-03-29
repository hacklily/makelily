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
import { Component } from "react";

export interface IProps {
  key?: number | string;
  x: number;
  y: number;
  radius: number;
  fill: string;
}

/**
 * Responsible for the rendering of a dot as part of a dotted note.
 * This is not used to render staccatos.
 */
export default class Dot extends Component<IProps, {}> {
  render(): any {
    // See rationale for hidden rect in _glyph.jsx
    return (
      <g>
        <circle
          cx={this.props.x}
          cy={this.props.y}
          fill={this.props.fill}
          r={this.props.radius}
        />
      </g>
    );
  }
}
