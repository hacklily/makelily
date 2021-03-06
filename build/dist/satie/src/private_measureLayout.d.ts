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
import { Print } from "musicxml-interfaces";
import { IAttributesSnapshot } from "./private_attributesSnapshot";
import { ILayout } from "./document";
export interface IMeasureLayout {
    attributes: {
        [part: string]: IAttributesSnapshot[];
    };
    print: Print;
    elements: ILayout[][];
    width: number;
    maxDivisions: number;
    uuid: number;
    originX: number;
    /**
     * Topmost (i.e., lowest) y-coordinates of each staff in tenths. One part may have more
     * than one staff.
     */
    originY: {
        [part: string]: number[];
    };
    /**
     * Positive integer in tenths. Required space above each staff beyond default 15 tenths,
     * indexed by staff index.
     */
    paddingTop: number[];
    /**
     * Postivie integer in tenths. Required space below each staff beyond default 15 tenths,
     * indexed by staff index.
     */
    paddingBottom: number[];
    getVersion: () => number;
}
export declare function detach(layout: IMeasureLayout): IMeasureLayout;
