"use strict";
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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var musicxml_interfaces_1 = require("musicxml-interfaces");
var react_1 = require("react");
var DOM = require("react-dom-factories");
var PropTypes = require("prop-types");
var lodash_1 = require("lodash");
var private_smufl_1 = require("./private_smufl");
var implChord_beamView_1 = require("./implChord_beamView");
var implChord_flagView_1 = require("./implChord_flagView");
var implChord_ledgerLineView_1 = require("./implChord_ledgerLineView");
var implChord_lyrics_1 = require("./implChord_lyrics");
var implChord_noteView_1 = require("./implChord_noteView");
var implChord_notationView_1 = require("./implChord_notationView");
var implChord_restView_1 = require("./implChord_restView");
var implChord_stemView_1 = require("./implChord_stemView");
var implChord_unbeamedTupletView_1 = require("./implChord_unbeamedTupletView");
var stemThickness = private_smufl_1.bravura.engravingDefaults.stemThickness * 10;
var $BeamView = react_1.createFactory(implChord_beamView_1.default);
var $FlagView = react_1.createFactory(implChord_flagView_1.default);
var $LedgerLineView = react_1.createFactory(implChord_ledgerLineView_1.default);
var $NoteView = react_1.createFactory(implChord_noteView_1.default);
var $NotationView = react_1.createFactory(implChord_notationView_1.default);
var $RestView = react_1.createFactory(implChord_restView_1.default);
var $StemView = react_1.createFactory(implChord_stemView_1.default);
var $UnbeamedTupletView = react_1.createFactory(implChord_unbeamedTupletView_1.default);
/**
 * Renders notes and their notations.
 */
var ChordView = /** @class */ (function (_super) {
    __extends(ChordView, _super);
    function ChordView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ChordView.prototype.render = function () {
        var _this = this;
        var layout = this.props.layout;
        var spec = layout.model;
        var maxNotehead = lodash_1.maxBy(spec.noteheadGlyph, function (glyph) { return private_smufl_1.getRight(glyph); });
        var anyVisible = lodash_1.some(spec, function (note) { return note.printObject !== false; });
        if (!anyVisible) {
            return null;
        }
        var lyKey = 0;
        var lyrics = lodash_1.chain(spec)
            .map(function (n) { return n.lyrics; })
            .filter(function (l) { return !!l; })
            .flatten(true)
            .filter(function (l) { return !!l; })
            .map(function (l) {
            var text = [];
            for (var i = 0; i < l.lyricParts.length; ++i) {
                switch (l.lyricParts[i]._class) {
                    case "Syllabic":
                        break;
                    case "Text":
                        var textPt = l.lyricParts[i];
                        var width = private_smufl_1.bboxes[maxNotehead][0] * 10;
                        text.push(DOM.text({
                            fontFamily: textPt.fontFamily || implChord_lyrics_1.DEFAULT_FONT,
                            fontSize: textPt.fontSize || implChord_lyrics_1.DEFAULT_LYRIC_SIZE,
                            key: ++lyKey,
                            textAnchor: "middle",
                            x: _this.props.layout.x + width / 2,
                            y: _this.context.originY + 60
                        }, textPt.data));
                        break;
                    case "Extend":
                        // TODO
                        break;
                    case "Elision":
                        // TODO
                        break;
                    default:
                        throw new Error("Unknown class " + l.lyricParts[i]._class);
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
        var stemX = spec.stemX();
        return DOM.g(null, lodash_1.map(spec, function (noteSpec, idx) {
            if (!spec[idx]) {
                return null;
            }
            return $NoteView({
                key: "n" + idx,
                noteheadGlyph: spec.noteheadGlyph[idx],
                spec: spec[idx],
                defaultX: spec[idx].defaultX
            });
        }), layout.satieStem && $StemView({
            bestHeight: layout.satieStem.stemHeight,
            tremolo: layout.satieStem.tremolo,
            key: "s",
            notehead: maxNotehead,
            spec: {
                color: spec[0].stem.color || "#000000",
                defaultX: stemX,
                defaultY: (layout.satieStem.stemStart - 3) * 10,
                type: layout.satieStem.direction === 1 ? musicxml_interfaces_1.StemType.Up : musicxml_interfaces_1.StemType.Down
            },
            width: stemThickness
        }), lodash_1.map(spec.satieLedger, function (lineNumber) { return $LedgerLineView({
            key: "l" + lineNumber,
            notehead: maxNotehead,
            spec: {
                color: "#000000",
                defaultX: stemX,
                defaultY: (lineNumber - 3) * 10
            }
        }); }), layout.satieFlag && layout.satieStem && $FlagView({
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
        }), this.props.layout.satieBeam && $BeamView({
            key: "b",
            layout: this.props.layout.satieBeam,
            stemWidth: stemThickness,
            stroke: "black"
        }), spec.satieUnbeamedTuplet && $UnbeamedTupletView({
            key: "ut",
            layout: spec.satieUnbeamedTuplet,
            stemWidth: stemThickness,
            stroke: "black"
        }), lodash_1.map(spec, function (note, idx) { return lodash_1.map(note.notations, function (notation, jdx) { return $NotationView({
            key: "N" + idx + "_" + jdx,
            layout: _this.props.layout,
            defaultY: note.defaultY,
            spec: notation
        }); }); }), lyrics);
    };
    ChordView.contextTypes = {
        originY: PropTypes.number.isRequired
    };
    return ChordView;
}(react_1.Component));
exports.default = ChordView;
//# sourceMappingURL=implChord_chordView.js.map