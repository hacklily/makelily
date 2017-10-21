/**
 * @source: https://github.com/jnetterf/satie/
 *
 * @license
 * (C) Josh Netterfield <joshua@nettek.ca> 2015 - present.
 * Part of the Satie music engraver <https://github.com/jnetterf/satie>.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {IAny} from "musicxml-interfaces/operations";
import * as invariant from "invariant";

import ILinesLayoutState, {markDirty} from "../private/linesLayoutState";
import {mutate, parentExists} from "../private/mutate";

import AttributesModel from "./attributesModel";

export default function attributesMutator(preview: boolean, memo$: ILinesLayoutState,
        attributes: AttributesModel.IAttributesModel, op: IAny) {
    // Check if we are being asked to clone & create.
    invariant(parentExists(attributes, op.p), "Invalid patch -- it's likely to a " +
        "model that only exists in a snapshot. You'll need to explicitly create it.");

    if (!preview) {
        if (op.p[0] === "times" || op.p[0] === "clefs" || op.p[0] === "keys") {
            // XXX: Should only mark all affected measures as dirty.
            memo$.clean$ = {};
            // memo$.linePlacement$ = {};
        }
    }
    markDirty(memo$, attributes);

    // Bye.
    mutate(attributes, op);
}
