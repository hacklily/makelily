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
import {find, cloneDeep, forEach, isPlainObject, isArray, isUndefined, isNull,
    isBoolean, isNumber, isString} from "lodash";
import {IAny} from "musicxml-interfaces/operations";

import {Document, Type, IMeasure, IMeasurePart, ISegment} from "./document";
import {normalizeDivisionsInPlace} from "./engine_divisions";

import {IFactory} from "./private_factory";
import {cloneObject} from "./private_util";
import {mutate} from "./private_mutate";

import attributesMutator from "./implAttributes_attributesMutator";
import barlineMutator from "./implBarline_barlineMutator";
import chordMutator from "./implChord_chordMutator";
import printMutator from "./implPrint_printMutator";
import segmentMutator from "./implSegment_segmentMutator";

/**
 * Checks whether this object is safe to JSON.stringify and JSON.parse.
 * The only difference between the two should be presence of undefined values in Arrays and Objects.
 * In Objects that previously had undefined values, after serializing, these keys will be removed.
 * In Arrays that previously had undefined values, after serializing, these values will be replaced with null.
 */
function isSerializable(obj: any): boolean {
    if (isUndefined(obj) || isNull(obj) || isBoolean(obj) || isNumber(obj) || isString(obj)) {
        return true;
    } else if (isArray(obj)) {
        return (obj as Array<any>).every(isSerializable);
    } else if (isPlainObject(obj)) {
        return Object.keys(obj).every(key => isSerializable(obj[key]));
    }
    return false;
}

/**
 * Applies an operation to the given set of measures, usually part of a document.
 *
 * CAREFUL: Does not touch `appliedOperations` because this function can also be used for undo. It's
 * the caller's responsibility to update `appliedOperations`.
 *
 * @param op.p [measureUUID, ("part"|"voice")]
 */
export default function applyOp(preview: boolean, measures: IMeasure[], factory: IFactory, op: IAny,
        document: Document, notEligableForPreview: () => void) {
    // Operations must be entirely serializable, to be sent over the work. Serializble means it is one of:
    //   - a simple data type (number, string, ...)
    //   - a plain object (object with prototype Object), and that the same is true for all children
    //   - a plain array, and that the same is true for all items
    invariant(isSerializable(op), "All operations must be serializable.");

    let path = op.p;
    if (path.length === 2 && path[0] === "measures") {
        // Song-wide measure addition/removal
        const localOp = {
            p: op.p.slice(1),
            ld: op.ld,
            li: op.li,
        };
        applyMeasureOp(measures, factory, localOp, document);
        return;
    } else if (path.length === 1 && path[0] === "divisions") {
        let segments: ISegment[] = [];
        measures.forEach(measure => {
            Object.keys(measure.parts).forEach(partName => {
                const part = measure.parts[partName];
                part.staves.concat(part.voices).forEach(segment => {
                    if (segment) {
                        segments.push(segment);
                    }
                });
            });
            normalizeDivisionsInPlace(factory, segments, op.oi);
        });
        return;
    }
    let measureUUID = parseInt(String(path[0]), 10);
    let measure = find(measures, (measure) => measure.uuid === measureUUID);
    invariant(Boolean(measure), `Invalid operation path: no such measure ${path[0]}`);

    invariant(path[1] === "parts",
        `Invalid operation path: only parts is supported, not ${path[1]}`);

    let part = measure.parts[path[2]];
    invariant(Boolean(part), `Invalid operation path: no such part ${part}`);
    ++measure.version;

    invariant(path[3] === "voices" || path[3] === "staves",
        `Invalid operation path: ${path[3]} should have been "voices" or "staves`);

    const cleanliness = document.cleanlinessTracking.measures[measureUUID];
    if (cleanliness) {
        cleanliness.clean = null;
    }

    if (path[3] === "voices") {
        let voice = part.voices[parseInt(String(path[4]), 10)];
        invariant(Boolean(voice),
            `Invalid operation path: No such voice ${path.slice(0,4).join(", ")}`);

        if (path.length === 6 && ((op.li && !op.ld) || (!op.li && op.ld))) {
            notEligableForPreview();
            segmentMutator(factory, voice, op, document);
            return;
        }

        let element = voice[parseInt(String(path[5]), 10)];
        invariant(Boolean(element),
            `Invalid operation path: No such element ${path.slice(0,5).join(", ")}`);

        let localOp: IAny = cloneDeep(op);
        localOp.p = path.slice(6);
        if (factory.modelHasType(element, Type.Chord)) {
            chordMutator(element as any, localOp);
        } else {
            throw new Error("Invalid operation path: No voice reducer for " + element);
        }
    } else if (path[3] === "staves") {
        let staff = part.staves[parseInt(String(path[4]), 10)];
        invariant(Boolean(staff),
            `Invalid operation path: No such staff ${path.slice(0,4).join(", ")}`);

        if (path.length === 6 && ((op.li && !op.ld) || (!op.li && op.ld))) {
            notEligableForPreview();
            segmentMutator(factory, staff, op, document);
            return;
        }

        let element = staff[parseInt(String(path[5]), 10)];
        invariant(Boolean(element),
            `Invalid operation path: No such element ${path.slice(0,5).join(", ")}`);

        let localOp: IAny = cloneDeep(op);
        localOp.p = path.slice(6);
        if (factory.modelHasType(element, Type.Barline)) {
            barlineMutator(element as any, localOp);
        } else if (factory.modelHasType(element, Type.Attributes)) {
            if (!preview) {
                // Mark everything as dirty -- this is overkill, but finding what measures
                // need to be changed is tough.
                let ctMeasures = document.cleanlinessTracking.measures;
                Object.keys(ctMeasures).forEach(measureName => {
                    if (ctMeasures[measureName]) {
                        ctMeasures[measureName].clean = null;
                    }
                });
            }
            attributesMutator(preview, element as any, localOp);
        } else if (factory.modelHasType(element, Type.Print)) {
            printMutator(preview, element as any, localOp);
        } else if (factory.modelHasType(element, Type.Spacer)) {
            mutate(element as any, localOp);
        } else {
            throw new Error("Invalid operation path: No staff reducer for " + element);
        }
    }
}

export function applyMeasureOp(measures: IMeasure[], factory: IFactory, op: IAny,
        doc: Document) {
    let ok = false;
    let oldMeasure: IMeasure;

    if (op.ld !== undefined && op.p.length === 1) {
        ok = true;
        const measureIdx = op.p[0] as number;
        invariant(!isNaN(measureIdx), `Measure index ${measureIdx} must be`);
        invariant(Boolean(op.ld.uuid), "uuid must be specified");
        invariant(op.ld.uuid === measures[measureIdx].uuid,
            `invalid uuid ${op.ld.uuid} != ${measures[measureIdx].uuid}`);
        oldMeasure = measures[measureIdx];
        measures.splice(measureIdx, 1);
        measures.slice(measureIdx).forEach(measure => {
            ++measure.version;
            --measure.idx;
            if (!isNaN(parseInt(measure.number, 10))) {
                measure.number = String(parseInt(measure.number, 10) - 1);
            } else {
                console.warn("Cannot change bar number for invalid measure number ", measure.number);
            }
        });
    }

    if (op.li !== undefined && op.p.length === 1) {
        ok = true;

        const measureIdx = op.p[0] as number;
        invariant(!isNaN(measureIdx), `Measure index ${measureIdx} must be`);
        invariant(Boolean(op.li.uuid), "uuid must be specified");
        oldMeasure = oldMeasure || measures[measureIdx - 1] || measures[measureIdx + 1]; // note, we don't support empty docs
        const oldParts = oldMeasure.parts;
        const newParts: {
            [id: string]: IMeasurePart;
        } = cloneObject(op.li.parts) || {};
        forEach(oldParts, (part, partID) => {
            newParts[partID] = newParts[partID] || {
                voices: [],
                staves: [],
            };
            forEach(part.staves, (staff, staffIdx) => {
                if (!staff) {
                    newParts[partID].staves[staffIdx] =
                        newParts[partID].staves[staffIdx] || null;
                } else {
                    if (newParts[partID].staves[staffIdx]) {
                        newParts[partID].staves[staffIdx] =
                            newParts[partID].staves[staffIdx]
                                .map(i => factory.fromSpec(i)) || <any>[];
                    } else {
                        newParts[partID].staves[staffIdx] = [] as any;
                    }
                    let nv = newParts[partID].staves[staffIdx];
                    nv.divisions = staff.divisions;
                    nv.part = staff.part;
                    nv.owner = staff.owner;
                    nv.ownerType = staff.ownerType;
                }
            });
            forEach(part.voices, (voice, voiceIdx) => {
                if (!voice) {
                    newParts[partID].voices[voiceIdx] =
                        newParts[partID].voices[voiceIdx] || null;
                } else {
                    if (newParts[partID].voices[voiceIdx]) {
                        newParts[partID].voices[voiceIdx] =
                            newParts[partID].voices[voiceIdx]
                                .map(i => {
                                    const model = factory.fromSpec(i);
                                    if (doc.modelHasType(model, Type.VisualCursor)) {
                                        doc._visualCursor = model;
                                    }
                                    return model;
                                }) || <any>[];
                    } else {
                        newParts[partID].voices[voiceIdx] = [] as any;
                    }
                    let nv = newParts[partID].voices[voiceIdx];
                    nv.divisions = voice.divisions;
                    nv.part = voice.part;
                    nv.owner = voice.owner;
                    nv.ownerType = voice.ownerType;
                }
            });
        });
        let newMeasure = {
            idx: measureIdx,
            uuid: op.li.uuid,
            number: "" + (measureIdx + 1),
            implicit: false,
            width: NaN,
            nonControlling: false,
            parts: newParts,
            version: 0
        };

        oldMeasure.parts = oldParts;
        measures.splice(measureIdx, 0, newMeasure);
        measures.slice(measureIdx + 1).forEach(measure => {
            ++measure.idx;
            ++measure.version;
            if (!isNaN(parseInt(measure.number, 10))) {
                measure.number = String(parseInt(measure.number, 10) + 1);
            } else {
                console.warn("Cannot change bar number for invalid measure number ", measure.number);
            }
        });
        measures.forEach(measure => ++measure.version);
    }

    invariant(ok, `Invalid operation type for applyMeasureOp's context: ${JSON.stringify(op)}`);
}
