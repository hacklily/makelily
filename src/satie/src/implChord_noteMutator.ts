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

import invariant from "invariant";
import {IAny, IObjectReplace, IObjectDelete, IObjectInsert} from "musicxml-interfaces/operations";

import {replace, remove, set, mutate} from "./private_mutate";

import NoteImpl from "./implChord_noteImpl";

export default function noteMutator(note: NoteImpl, op: IAny) {
    if (op.p.length > 2) {
        mutate(note, op);
        return;
    }

    if ("od" in op && "oi" in op) {
        if (op.p.length === 2 && op.p[0] === "noteType" && op.p[1] === "duration") {
            note.noteType = {
                duration: op.oi,
            };
        } else {
            replace(note, op as IObjectReplace<any>);
        }
    } else if ("od" in op) {
        remove(note, op as IObjectDelete<any>);
    } else if ("oi" in op) {
        invariant(!(note as any)[op.p[0]], "Object already set");
        set(note, op as IObjectInsert<any>);
    } else if ("ld" in op || "li" in op) {
        mutate(note, op);
    } else {
        throw new Error("Unknown operation");
    }
}
