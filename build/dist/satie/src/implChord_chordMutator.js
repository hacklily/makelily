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
import invariant from "invariant";
import { cloneDeep } from "lodash";
import { serializeNote } from "musicxml-interfaces";
import { replace, remove } from "./private_mutate";
import NoteImpl from "./implChord_noteImpl";
import noteMutator from "./implChord_noteMutator";
export default function chordMutator(chord, op) {
    var path = op.p;
    if (op.p[0] === "notes") {
        if (path.length === 2) {
            var idx = path[1];
            invariant(!isNaN(idx), "Expected path index within chord to be a number");
            if ("li" in op && "ld" in op) {
                var replacement = op;
                invariant(serializeNote(replacement.ld) === serializeNote(chord[idx]), "Cannot remove mismatching item from %s.", path.join(" "));
                chord.splice(idx, 1, new NoteImpl(chord, idx, replacement.li));
            }
            else if ("li" in op) {
                var insertion = op;
                chord.splice(idx, 0, new NoteImpl(chord, idx, insertion.li));
            }
            else if ("ld" in op) {
                var deletion = op;
                invariant(serializeNote(deletion.ld) === serializeNote(chord[idx]), "Cannot remove mismatching item from %s.", path.join(" "));
                chord.splice(idx, 1);
            }
            else {
                throw new Error("Unsupported operation");
            }
            chord._init = false;
        }
        else {
            var note = chord[parseInt(String(op.p[1]), 10)];
            invariant(Boolean(note), "Invalid operation path for chord. No such note " + op.p[1]);
            var localOp = cloneDeep(op);
            localOp.p = path.slice(2);
            noteMutator(note, localOp);
            chord._init = false;
        }
    }
    else if (op.p[0] === "count") {
        if ("od" in op && "oi" in op) {
            replace(chord, op);
        }
        else if ("od" in op) {
            remove(chord, op);
        }
        else {
            throw new Error("Unsupported operation");
        }
    }
    else if (op.p[0] === "divCount") {
        chord.divCount = op.oi;
    }
    else {
        throw new Error("Invalid/unimplemented operation path for chord: " + op.p[0]);
    }
}
//# sourceMappingURL=implChord_chordMutator.js.map