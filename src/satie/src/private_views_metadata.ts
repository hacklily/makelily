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

import { Component, ComponentLifecycle } from "react";
import invariant from "invariant";
import { isEqual, sortedIndex, indexOf } from "lodash";

import { ILayout } from "./document";

export interface IBaseProps {
  layout: ILayout;
  originX: number;
}

export interface IMetaComponent<P, S>
  extends Component<P, S>,
    ComponentLifecycle<P, S> {
  context: {
    originYByPartAndStaff: { [key: string]: number[] };
  };
  _record?: IRecord;
}

export interface ILookup {
  x: number;
  y: number;
}

export interface IRecord {
  key: string;
  obj: any;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  originY: number;
}

/**
 * A decorator that records the position of a component.
 */
export function Targetable<P extends IBaseProps, S>() {
  return function decorator(component: { prototype: IMetaComponent<P, S> }) {
    function updateMeta(self: IMetaComponent<P, S>, props: P) {
      const layout = props.layout;

      let originX: number = props.originX;
      let originY =
        self.context.originYByPartAndStaff[layout.part][
          layout.model.staffIdx || 1
        ] || 0;

      let newRecord: IRecord = {
        key: props.layout.key,
        obj: self,
        x1: originX + props.layout.x - 2,
        x2: originX + props.layout.x + props.layout.renderedWidth,
        y1: originY - 60,
        y2: originY + 60,
        originY,
      };

      if (self._record) {
        if (isEqual(newRecord, self._record)) {
          return;
        }

        clearMeta(self);
      }
      if (isNaN(props.layout.renderedWidth)) {
        console.warn("Missing rendered width in", props.layout.key);
        return;
      }

      self._record = {
        key: props.layout.key,
        obj: self,
        x1: originX + props.layout.x - 2,
        x2: originX + props.layout.x + props.layout.renderedWidth,
        y1: originY - 60,
        y2: originY + 60,
        originY,
      };

      set(self._record);
    }

    function clearMeta(self: IMetaComponent<P, S>) {
      clear(self._record);
      self._record = null;
    }

    // ---- //

    let originalComponentWillMount = component.prototype.componentWillMount;

    component.prototype.componentWillMount = function metaComponentWillMountWrapper() {
      let self = this as IMetaComponent<P, S>;
      updateMeta(self, self.props);

      if (originalComponentWillMount) {
        originalComponentWillMount.call(self);
      }
    };

    // ---- //

    let originalComponentWillUnmount = component.prototype.componentWillUnmount;

    component.prototype.componentWillUnmount = function metaComponentWillUnmountWrapper() {
      let self = this as IMetaComponent<P, S>;
      clearMeta(self);

      if (originalComponentWillUnmount) {
        originalComponentWillUnmount.call(self);
      }
    };

    // ---- //

    let originalComponentWillReceiveProps =
      component.prototype.componentWillReceiveProps;

    component.prototype.componentWillReceiveProps = function metaComponentWillReceiveProps(
      nextProps: P,
    ) {
      let self = this as IMetaComponent<P, S>;

      updateMeta(self, nextProps);

      if (originalComponentWillReceiveProps) {
        originalComponentWillReceiveProps.call(self);
      }
    };
  };
}

let _sorted: IRecord[] = [];
let _weights: number[] = [];

function set(record: IRecord) {
  let weight = weightForRecord(record);
  let idx = sortedIndex(_weights, weight);
  _sorted.splice(idx, 0, record);
  _weights.splice(idx, 0, weight);
}

function clear(record: IRecord) {
  let weight = weightForRecord(record);
  let firstPossibleIdx = sortedIndex(_weights, weight);
  let idx = indexOf(_sorted, record, firstPossibleIdx);

  invariant(idx >= 0, `${record.key} not currently in array.`);
  _sorted.splice(idx, 1);
  _weights.splice(idx, 1);
}

export function get(lookup: ILookup): IRecord {
  let { x, y } = lookup;
  let weight = weightForLookup(lookup);
  let firstPossibleIdx = sortedIndex(_weights, weight);
  for (let i = firstPossibleIdx; i < _sorted.length; ++i) {
    let record = _sorted[i];
    if (
      _sorted[i].x1 <= x &&
      _sorted[i].x2 >= x &&
      _sorted[i].y1 <= y &&
      _sorted[i].y2 >= y
    ) {
      return record;
    }
  }
  return null;
}

function weightForRecord(record: IRecord) {
  // In the future we should seperate by line.
  return record.x2;
}

function weightForLookup(lookup: ILookup) {
  return lookup.x;
}
