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

import {Note, Lyric, Text, StemType} from "musicxml-interfaces";
import {createFactory, Component, ReactElement} from "react";
import * as DOM from "react-dom-factories";
import * as PropTypes from "prop-types";
import {map, some, chain, maxBy} from "lodash";

import {bboxes, bravura, getRight} from "./private_smufl";

import BeamView from "./implChord_beamView";
import ChordModel from "./implChord_chordModel";
import FlagView from "./implChord_flagView";
import LedgerLineView from "./implChord_ledgerLineView";
import {DEFAULT_LYRIC_SIZE, DEFAULT_FONT} from "./implChord_lyrics";
import NoteView from "./implChord_noteView";
import NotationView from "./implChord_notationView";
import RestView from "./implChord_restView";
import StemView from "./implChord_stemView";
import UnbeamedTupletView from "./implChord_unbeamedTupletView";

const stemThickness: number = bravura.engravingDefaults.stemThickness * 10;

const $BeamView = createFactory(BeamView);
const $FlagView = createFactory(FlagView);
const $LedgerLineView = createFactory(LedgerLineView);
const $NoteView = createFactory(NoteView);
const $NotationView = createFactory(NotationView);
const $RestView = createFactory(RestView);
const $StemView = createFactory(StemView);
const $UnbeamedTupletView = createFactory(UnbeamedTupletView);

export interface IProps {
    layout: ChordModel.IChordLayout;
}

/**
 * Renders notes and their notations.
 */
export default class ChordView extends Component<IProps, {}> {
    static contextTypes = {
        originY: PropTypes.number.isRequired
    } as any;

    context: {
        originY: number;
    };

    render(): ReactElement<any> {
        let layout = this.props.layout;
        let spec = layout.model;

        let maxNotehead = maxBy(spec.noteheadGlyph, glyph => getRight(glyph));

        let anyVisible = some(spec, note => note.printObject !== false);

        if (!anyVisible) {
            return null;
        }

        let lyKey = 0;
        let lyrics = chain(<Note[]><any>spec)
            .map(n => n.lyrics)
            .filter(l => !!l)
            .flatten(true)
            .filter(l => !!l)
            .map((l: Lyric) => {
                let text: any[] = [];
                for (let i = 0; i < l.lyricParts.length; ++i) {
                    switch (l.lyricParts[i]._class) {
                        case "Syllabic":
                            break;
                        case "Text":
                            let textPt = <Text> l.lyricParts[i];
                            let width = bboxes[maxNotehead][0] * 10;
                            text.push(DOM.text({
                                    fontFamily: textPt.fontFamily || DEFAULT_FONT,
                                    fontSize: textPt.fontSize || DEFAULT_LYRIC_SIZE,
                                    key: ++lyKey,
                                    textAnchor: "middle",
                                    x: this.props.layout.x + width / 2,
                                    y: this.context.originY + 60
                                }, textPt.data));
                            break;
                        case "Extend":
                            // TODO
                            break;
                        case "Elision":
                            // TODO
                            break;
                        default:
                            throw new Error(`Unknown class ${l.lyricParts[i]._class}`);
                    }
                }
                return text;
            })
            .flatten()
            .value();

        if (!!spec[0].rest) {
            return $RestView({
                multipleRest: spec.satieMultipleRest,
                notehead: spec.noteheadGlyph[0],
                spec: spec[0]
            });
        }

        const stemX = spec.stemX();
        return DOM.g(null,
            map(spec, (noteSpec: Note, idx: number) => {
                if (!spec[idx]) {
                    return null;
                }
                return $NoteView({
                    key: "n" + idx,
                    noteheadGlyph: spec.noteheadGlyph[idx],
                    spec: spec[idx],
                    defaultX: spec[idx].defaultX
                });
            }),
            layout.satieStem && $StemView({
                bestHeight: layout.satieStem.stemHeight,
                tremolo: layout.satieStem.tremolo,
                key: "s",
                notehead: maxNotehead,
                spec: {
                    color: spec[0].stem.color || "#000000",
                    defaultX: stemX,
                    defaultY: (layout.satieStem.stemStart - 3) * 10,
                    type: layout.satieStem.direction === 1 ?  StemType.Up : StemType.Down
                },
                width: stemThickness
            }),
            map(spec.satieLedger, lineNumber => $LedgerLineView({
                key: "l" + lineNumber,
                notehead: maxNotehead,
                spec: {
                    color: "#000000",
                    defaultX: stemX,
                    defaultY: (lineNumber - 3) * 10
                }
            })),
            layout.satieFlag && layout.satieStem && $FlagView({
                key: "f",
                notehead: maxNotehead,
                spec: {
                    color: spec[0].stem.color || "$000000",
                    defaultX: stemX,
                    defaultY: (layout.satieStem.stemStart - 3) * 10 +
                        (layout.satieStem.stemHeight - 7) * layout.satieStem.direction,
                    direction: layout.satieStem.direction,
                    flag: layout.satieFlag
                },
                stemHeight: layout.satieStem.stemHeight,
                stemWidth: stemThickness
            }),
            this.props.layout.satieBeam && $BeamView({
                key: "b",
                layout: this.props.layout.satieBeam,
                stemWidth: stemThickness,
                stroke: "black"
            }),
            spec.satieUnbeamedTuplet && $UnbeamedTupletView({
                key: "ut",
                layout: spec.satieUnbeamedTuplet,
                stemWidth: stemThickness,
                stroke: "black"
            }),
            map(spec, (note, idx) => map(note.notations, (notation, jdx) => $NotationView({
                key: `N${idx}_${jdx}`,
                layout: this.props.layout,
                defaultY: note.defaultY,
                spec: notation
            }))),
            lyrics
        );
    }
}
