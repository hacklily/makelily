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
import * as PropTypes from "prop-types";
import { chain, flatten, mapValues, map, forEach } from "lodash";
import invariant from "invariant";

import { ILayout } from "./document";
import { IMeasureLayout } from "./private_measureLayout";
import { MAX_SAFE_INTEGER } from "./private_util";

import ModelView from "./implSegment_modelView";

export interface IProps {
  layout: IMeasureLayout;
  key?: string | number;
  version: number;
}

const NUMBER_ARRAY = PropTypes.arrayOf(PropTypes.number);

export default class MeasureView extends Component<IProps, {}> {
  static childContextTypes = {
    originYByPartAndStaff: PropTypes.objectOf(NUMBER_ARRAY).isRequired,
    systemBottom: PropTypes.number.isRequired,
    systemTop: PropTypes.number.isRequired,
  } as any;

  static contextTypes = {
    originY: PropTypes.number,
  } as any;

  context: {
    originY: number;
  };

  render(): any {
    const layout = this.props.layout;

    return (
      <g transform={`translate(${layout.originX})`}>
        {chain(flatten(layout.elements))
          .filter((layout: ILayout) => !!layout.model) // Remove helpers.
          .map((layout: ILayout) => (
            <ModelView
              key={(layout as any).key}
              version={this.props.layout.getVersion()}
              layout={layout}
              originX={this.props.layout.originX}
            />
          ))
          .value()}
      </g>
    );

    /* TODO: lyric boxes */
    /* TODO: free boxes */
    /* TODO: slurs and ties */
  }

  getChildContext() {
    const { layout } = this.props;
    const originYByPartAndStaff = mapValues(layout.originY, (layouts) =>
      this.extractOrigins(layouts),
    );
    let bottom = MAX_SAFE_INTEGER;
    let top = 0;
    forEach(layout.originY, (origins) => {
      forEach(origins, (origin, staff) => {
        if (!staff) {
          return;
        }
        bottom = Math.min(origin, bottom);
        top = Math.max(origin, top);
      });
    });

    // TODO 1: Fix stave height
    // TODO 2: Do not ignore top/bottom staff in staffGroup of attributes
    // TODO 3: A part can be in many groups.
    return {
      originYByPartAndStaff: originYByPartAndStaff,
      systemBottom: this.context.originY - bottom + 20.5,
      systemTop: this.context.originY - top - 20.5,
    };
  }

  extractOrigins(layouts: number[]) {
    return map(layouts, (layout) => this.invert(layout));
  }

  invert(y: number) {
    return this.context.originY - y;
  }

  shouldComponentUpdate(nextProps: IProps) {
    invariant(
      !isNaN(this.props.version),
      `Invalid non-numeric version ${this.props.version}`,
    );
    return (
      this.props.version !== nextProps.version ||
      this.props.layout.originX !== nextProps.layout.originX ||
      this.props.layout.width !== nextProps.layout.width
    );
  }
}
