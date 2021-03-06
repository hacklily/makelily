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
import { reduce } from "lodash";
import invariant from "invariant";
/**
 * @returns a TS string for lookup in the BEAMING_PATTERNS array.
 */
export default function getTSString(time) {
    invariant(!!time, "Expected time to be defined.");
    return reduce(time.beats, function (memo, beats, idx) {
        return beats + "/" + time.beatTypes[idx];
    }, "");
}
//# sourceMappingURL=private_metre_getTSString.js.map