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

import {Accidental} from "musicxml-interfaces";
import {createFactory, Component} from "react";
import * as DOM from "react-dom-factories";
import * as PropTypes from "prop-types";
import * as invariant from "invariant";

import Glyph from "./private_views_glyph";
import {accidentalGlyphs} from "./private_chordUtil";
import {bboxes} from "./private_smufl";

const $Glyph = createFactory(Glyph);

export interface IProps {
    spec: Accidental;
    key?: string | number;
    noteDefaultX?: number;
}

export default class AccidentalView extends Component<IProps, {}> {
    static contextTypes = {
        originY: PropTypes.number,
    } as any;

    context: {
        originY: number
    };

    render(): any {
        let spec = this.props.spec;
        const glyphName = accidentalGlyphs[this.props.spec.accidental];
        invariant(glyphName in bboxes, "Expected a glyph, got %s", glyphName);

        const originY = (this.context.originY || 0);
        const shift = spec.parentheses ? 4 : 0;

        const y = originY - (spec.defaultY + (spec.relativeY || 0));
        invariant(!isNaN(y), "Invalid accidental y-position");

        let accidental = $Glyph({
            fill: spec.color,
            glyphName: glyphName,
            x: (this.props.noteDefaultX || 0) + spec.defaultX + (spec.relativeX || 0) + shift,
            y,
        });

        if (spec.parentheses || spec.bracket) {
            let width = bboxes[glyphName][0] * 10; // TODO: it's actually 2 - 0!
            return DOM.g(null,
                $Glyph({
                    fill: "#000000",
                    glyphName: "accidentalParensLeft",
                    x: (this.props.noteDefaultX || 0) + spec.defaultX + (spec.relativeX || 0) - 7 + shift,
                    y: originY - (spec.defaultY + (spec.relativeY || 0))
                }),
                accidental,
                $Glyph({
                    fill: "#000000",
                    glyphName: "accidentalParensRight",
                    x: (this.props.noteDefaultX || 0) + spec.defaultX + (spec.relativeX || 0) + width + shift,
                    y: originY - (spec.defaultY + (spec.relativeY || 0))
                })
            /* DOM.g */);
        } else {
            return accidental;
        }
    }
}
