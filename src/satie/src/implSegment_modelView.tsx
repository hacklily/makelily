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

import React, { Component } from "react";
import * as PropTypes from "prop-types";

import { ILayout, Type } from "./document";
import { Targetable } from "./private_views_metadata";

import AttributesView from "./implAttributes_attributesView";
import BarlineView from "./implBarline_barlineView";
import ChordView from "./implChord_chordView";
import DirectionView from "./implDirection_directionView";
import VisualCursorView from "./implVisualCursor_visualCursorView";

const NUMBER_ARRAY = PropTypes.arrayOf(PropTypes.number);

export interface IProps {
  layout: ILayout;
  version: number;
  key?: string | number;
  originX: number;
}

export interface IState {}

class ModelView extends Component<IProps, IState> {
  static childContextTypes = {
    originY: PropTypes.number,
  } as any;

  static contextTypes = {
    originYByPartAndStaff: PropTypes.objectOf(NUMBER_ARRAY).isRequired,
  } as any;

  context: {
    originYByPartAndStaff: { [key: string]: number[] };
  };

  render(): any {
    let layout = this.props.layout as any; // Sigh...
    switch (layout.renderClass) {
      case Type.Attributes:
        return <AttributesView layout={layout} />;
      case Type.Barline:
        return <BarlineView layout={layout} />;
      case Type.Chord:
        return <ChordView layout={layout} />;
      case Type.Direction:
        return <DirectionView layout={layout} />;
      case Type.VisualCursor:
        return <VisualCursorView layout={layout} />;
      default:
        return null;
    }
  }

  getChildContext() {
    const layout = this.props.layout;
    return {
      originY:
        this.context.originYByPartAndStaff[layout.part][
          layout.model.staffIdx || 1
        ] || 0,
    };
  }

  shouldComponentUpdate(nextProps: IProps, _nextState: IState) {
    if (nextProps.version !== this.props.version) {
      return true;
    }

    if (
      this.props.layout.renderClass === Type.Attributes &&
      (this.props.layout as any).staffWidth !==
        (nextProps.layout as any).staffWidth
    ) {
      return true;
    }

    return false;
  }
}

Targetable()(ModelView);

export default ModelView;
