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

import {Articulations, Placement, Notations, AboveBelow, UprightInverted,
    PrintStyle, Note, StemType} from "musicxml-interfaces";
import {forEach} from "lodash";

import {IBoundingRect} from "./private_boundingRect";
import {bboxes, getLeft, getRight} from "./private_smufl";

import ChordModel from "./implChord_chordModel";

const PADDING = 1.5;

export function articulationDirectionMatters(model: Articulations): boolean {
    return !model.breathMark && !model.caesura;
}

export function articulationGlyph(model: Articulations, direction: string): string {
    if (model.accent) {
        return `articAccent${direction}`;
    }
    if (model.breathMark) {
        return `breathMarkComma`;
    }
    if (model.caesura) {
        return `caesura`;
    }
    if (model.detachedLegato) {
        return `articTenutoStaccato${direction}`;
    }
    if (model.doit) {
        return null;
    }
    if (model.falloff) {
        return null;
    }
    if (model.plop) {
        return null;
    }
    if (model.scoop) {
        return null;
    }
    if (model.spiccato) {
        return `articStaccatissimoWedge${direction}`;
    }
    if (model.staccatissimo) {
        return `articStaccatissimo${direction}`;
    }
    if (model.staccato) {
        return `articStaccato${direction}`;
    }
    if (model.stress) {
        return `articStress${direction}`;
    }
    if (model.strongAccent) {
        return `articMarcato${direction}`;
    }
    if (model.tenuto) {
        return `articTenuto${direction}`;
    }
    if (model.unstress) {
        return `articUnstress${direction}`;
    }
    console.warn("Unknown articulation...");
    return null;
}

export interface IGeneralNotation extends PrintStyle, Placement {
    _snapshot?: IGeneralNotation;
}

export function getBoundingRects(model: Notations, note: Note,
        chord: ChordModel.IChordLayout): {bb: IBoundingRect[], n: Notations} {
    let boxes: IBoundingRect[] = [];
    let origModel = model;
    model = Object.create(model);
    Object.keys(origModel).forEach(m => {
        (model as any)[m] = typeof (model as any)[m] === "object" ? Object.create((model as any)[m]) : model;
    });

    forEach(model.accidentalMarks, accidentalMark => {
        // TODO
    });

    forEach(model.arpeggiates, arpeggiate => {
        // TODO
    });

    forEach(model.articulations, (articulation, idx) => {
        articulation = model.articulations[idx] = Object.create(articulation);
        forEach(["accent", "breathMark", "caesura", "detachedLegato", "doit", "falloff", "plop",
                    "scoop", "spiccato", "staccatissimo", "staccato", "stress", "strongAccent",
                    "tenuto", "unstress"], type => {
            // TODO: Could this be done any less efficiently?
            if ((model.articulations[idx] as any)[type]) {
                let thisArticulation: Placement = Object.create((<any>model.articulations[idx])[type]);
                let {placement} = thisArticulation;
                let isBelow = placement === AboveBelow.Below;
                let glyph = articulationGlyph(articulation, isBelow ? "Below" : "Above");
                if (!glyph) {
                    console.warn(Object.keys(articulation)[0], "not implented in chord/notation.ts");
                    return;
                }
                let y: number;
                let noteheadGlyph = chord.model.noteheadGlyph[0];

                let center = (getLeft(noteheadGlyph) + getRight(noteheadGlyph)) / 2 -
                    (getLeft(glyph) + getRight(glyph)) / 2 - 0.5;
                if (!chord.satieStem || (note.stem.type === StemType.Up) === isBelow) {
                    y = note.defaultY + (isBelow ? -9 : 9);
                    if (-note.defaultY % 10 === 0) {
                        y += isBelow ? -5 : 5;
                    }
                } else {
                    y = note.defaultY + chord.satieStem.stemHeight + (isBelow ? -12 : 12);
                    if (-note.defaultY % 10 === 0) {
                        y += isBelow ? -5 : 5;
                    }
                }
                (<any>model.articulations[idx])[type] = push(glyph, thisArticulation, center, y);
            }
        });
    });

    forEach(model.dynamics, dynamic => {
        // TODO
    });

    forEach(model.fermatas, (fermata, idx) => {
        fermata = model.fermatas[idx] = Object.create(fermata);
        if (fermata.type === UprightInverted.Inverted) {
            (<any>fermata).placement = AboveBelow.Below;
        } else {
            (<any>fermata).placement = AboveBelow.Above;
        }
        model.fermatas[idx] = <any> push("fermataAbove", fermata);
    });

    forEach(model.glissandos, glissando => {
        // TODO
    });

    forEach(model.nonArpeggiates, nonArpeggiate => {
        // TODO
    });

    forEach(model.ornaments, (ornament, idx) => {
        ornament = model.ornaments[idx] = Object.create(ornament);
        if (ornament.tremolo) {
            chord.satieStem.tremolo = ornament.tremolo;
        }
        // TODO
    });

    forEach(model.slides, slide => {
        // TODO
    });

    forEach(model.slurs, slur => {
        // TODO
    });

    forEach(model.technicals, technical => {
        // TODO
    });

    forEach(model.tieds, tied => {
        // TODO
    });

    forEach(model.tuplets, tuplet => {
        // TODO
    });

    function push(glyphName: string, notation: IGeneralNotation, defaultX = 0,
            defaultY: number = NaN): IGeneralNotation {
        let box = bboxes[glyphName];
        if (!box) {
            console.warn("Unknown glyph", glyphName);
            return null;
        }

        if (isNaN(defaultY)) {
            if (notation.placement === AboveBelow.Below) {
                defaultY = -30 + box[3] * 10 * PADDING;
            } else if (notation.placement === AboveBelow.Above) {
                defaultY = 60 + box[3] * 10 * PADDING;
            } else {
                console.warn("TODO: Set default above/below");
                // above: "fermata", "breathMark", "caesura", "strings"
                // below: "dynamic"
                defaultY = 0;
            }
        }

        let printStyle: PrintStyle | IBoundingRect = Object.create(notation);
        let boundingRect = printStyle as IBoundingRect;

        boundingRect.top = box[3] * 10;
        boundingRect.bottom = box[1] * 10;
        boundingRect.left = box[2] * 10;
        boundingRect.right = box[0] * 10;
        boundingRect.defaultX = defaultX;
        boundingRect.defaultY = defaultY;

        boxes.push(printStyle as IBoundingRect);

        return printStyle;
    }

    return {
        bb: boxes,
        n: model,
    };
}
