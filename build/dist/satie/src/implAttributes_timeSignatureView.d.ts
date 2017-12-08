/// <reference types="react" />
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
import { Time } from "musicxml-interfaces";
import { Component } from "react";
/**
 * Renders a simple, compound, or common time signature.
 */
export default class TimeSignatureView extends Component<{
    spec: Time;
    key?: string | number;
}, {}> {
    static contextTypes: any;
    context: {
        originY: number;
    };
    render(): any;
    numOffsets(): number[];
    denOffsets(): number[];
    _displayTimeSignature(): {
        beatType: number[];
        beats: number[][];
        commonRepresentation: boolean;
        singleNumber: boolean;
    };
}