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

import {createFactory, Component} from "react";
import * as PropTypes from "prop-types";

import Glyph from "./private_views_glyph";
import {getFontOffset} from "./private_smufl";

const $Glyph = createFactory(Glyph);

export interface IProps {
    key?: string | number;
    spec: {
        defaultX: number;
        defaultY: number;
        color: string;
        flag: string;
        direction: number;
    };
    isGrace?: boolean;
    notehead: string;
    stemWidth: number;
    stemHeight: number;
}

/**
 * Responsible for rendering the "flag" on un-beamed notes shorter than quarter notes.
 */
export default class Flag extends Component<IProps, {}> {
    static contextTypes = {
        originY: PropTypes.number.isRequired
    } as any;

    context: {
        originY: number;
    };

    render(): any {
        const spec = this.props.spec;
        const context = this.context;

        let xscale = this.props.isGrace ? 0.6 : 1.0;
        let dir = spec.direction;
        let fontOffsetX = getFontOffset(this.glyphName(), dir)[0] * xscale;
        let noteOffsetX = getFontOffset(this.props.notehead, dir)[0] * xscale;
        let noteOffsetY = getFontOffset(this.props.notehead, dir)[1] * 10;
        return $Glyph({
            fill: spec.color,
            glyphName: this.glyphName(),
            scale: this.props.isGrace ? 0.6 : 1.0,
            x: spec.defaultX +
                fontOffsetX * 10 +
                ((dir === 1) ? noteOffsetX * 10 - this.props.stemWidth : 0),
            y: context.originY - spec.defaultY - noteOffsetY * 4
        });
    }

    directionString() {
        if (this.props.spec.direction === 1) {
            return "Up";
        } else if (this.props.spec.direction === -1) {
            return "Down";
        }

        throw new Error("Invalid direction");
    }
    glyphName() {
        return this.props.spec.flag + this.directionString();
    }
}
