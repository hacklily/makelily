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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
/**
 * @file engine/processors/measure.ts provides functions for validating and laying out measures
 */
import invariant from "invariant";
import { keyBy, filter, map, reduce, values, flatten, forEach, some, last, } from "lodash";
import { Type, } from "./document";
import { getNativeKeyAccidentals } from "./implAttributes_attributesData";
import { mergeSegmentsInPlace, } from "./private_combinedLayout";
import { ValidationCursor, LayoutCursor } from "./private_cursor";
import { scoreParts } from "./private_part";
import { cloneObject } from "./private_util";
import { barDivisions, InvalidAccidental } from "./private_chordUtil";
import DivisionOverflowException from "./engine_divisionOverflowException";
/**
 * Given a bunch of segments and the context (measure, line), returns information needed to lay the
 * models out. Note that the order of the output is arbitrary and may not correspond to the order
 * of the input segments.
 *
 * @segments Models to lay out or validate.
 * @measure Model to which the model belongs to.
 * @line Line context
 *
 * Complexity: O(staff-voice pairs)
 */
export function refreshMeasure(spec) {
    var gMeasure = spec.measure;
    invariant(!!spec.attributes, "Attributes must be defined");
    var gInitialAttribs = cloneObject(spec.attributes);
    var gPrint = spec.print;
    var gMaxDivisions = 0;
    if (!spec.document.cleanlinessTracking.measures[spec.measure.uuid]) {
        spec.document.cleanlinessTracking.measures[spec.measure.uuid] = {
            clean: null,
            x: {},
            layout: null,
        };
    }
    // Cleanliness is also part-owned by the line processor. The layout in
    // cleanliness is not the output of this function -- it also has been
    // treated by postprocessors. This function sets "x" and uses the clean-state
    // to avoid unnecessary work.
    var cleanliness = spec.document.cleanlinessTracking.measures[spec.measure.uuid];
    var oldLayout = cleanliness.layout;
    invariant(spec.segments.length >= 1, "_processMeasure expects at least one segment.");
    Object.keys(spec.measure.parts).forEach(function (part) {
        cleanliness.x[part] = cleanliness.x[part] || {};
        spec.measure.parts[part].voices.forEach(function (voice) {
            if (!voice) {
                return;
            }
            cleanliness.x[part][voice.owner] = cleanliness.x[part][voice.owner] || {
                voiceX: [],
                staffX: spec.measure.parts[part].staves.reduce(function (memo, staff) {
                    if (staff) {
                        memo[staff.owner] = [];
                    }
                    return memo;
                }, {}),
            };
        });
    });
    var gStaffMeasure = keyBy(filter(spec.segments, function (seg) { return seg.ownerType === "staff"; }), function (seg) { return seg.part + "_" + seg.owner; });
    var gVoiceMeasure = keyBy(filter(spec.segments, function (seg) { return seg.ownerType === "voice"; }), function (seg) { return seg.part + "_" + seg.owner; });
    var gStaffLayouts = {};
    var gMaxXInMeasure = spec.measureX;
    var gMaxPaddingTopInMeasure = [];
    var gMaxPaddingBottomInMeasure = [];
    var gDivOverflow = null;
    var lastPrint = spec.print;
    var vCursor;
    function fixup(operations) {
        var localSegment = vCursor.segmentInstance;
        var restartRequired = some(operations, function (op) {
            if (op.p[0] === "divisions") {
                return true;
            }
            invariant(String(op.p[0]) === String(spec.measure.uuid), "Unexpected fixup for a measure " + op.p[0] + " " +
                ("other than the current " + spec.measure.uuid));
            invariant(op.p[1] === "parts", "Expected p[1] to be parts");
            invariant(op.p[2] === localSegment.part, "Expected part " + op.p[2] + " to be " + localSegment.part);
            if (localSegment.ownerType === "voice") {
                if (typeof op.p[4] === "string") {
                    op.p[4] = parseInt(op.p[4], 10);
                }
                invariant(op.p[3] === "voices", "We are in a voice, so we can only patch the voice");
                invariant(op.p[4] === localSegment.owner, "Expected voice owner " + localSegment.owner + ", got " + op.p[4]);
                return ((op.p.length === 6 && op.p[5] <= vCursor.segmentPosition) ||
                    op.p[5] < vCursor.segmentPosition);
            }
            else if (localSegment.ownerType === "staff") {
                invariant(op.p[3] === "staves", "We are in a staff, so we can only patch the staff");
                invariant(op.p[4] === localSegment.owner, "Expected staff owner " + localSegment.owner + ", got " + op.p[4]);
                return ((op.p.length === 6 && op.p[5] <= vCursor.segmentPosition) ||
                    op.p[5] < vCursor.segmentPosition);
            }
            throw new Error("Invalid segment owner type " + localSegment.ownerType);
        });
        spec.fixup(localSegment, operations, restartRequired);
    }
    var gVoiceLayouts = map(gVoiceMeasure, function (voiceSegment) {
        var part = voiceSegment.part;
        gInitialAttribs[part] = gInitialAttribs[part] || [];
        var voiceStaves = {};
        var staffContexts = {};
        var xPerStaff = [];
        var measureIsLast = gMeasure.uuid === last(spec.document.measures).uuid;
        vCursor = new ValidationCursor(__assign(__assign({}, spec), { measureInstance: gMeasure, measureIsLast: measureIsLast, page: 1, print: lastPrint, segment: voiceSegment, staffAccidentals: null, staffAttributes: null, staffIdx: NaN, fixup: fixup })); // TODO
        var lCursor = new LayoutCursor(__assign(__assign({}, spec), { validationCursor: vCursor, x: spec.measureX })); // TODO
        /**
         * Processes a staff model within this voice's context.
         */
        function pushStaffSegment(staffIdx, model, catchUp) {
            if (!model) {
                staffContexts[staffIdx].division = vCursor.segmentDivision + 1;
                return;
            }
            var oldDivision = vCursor.segmentDivision;
            var oldSegment = vCursor.segmentInstance;
            var oldIdx = vCursor.segmentPosition;
            vCursor.segmentDivision = staffContexts[staffIdx].division;
            vCursor.staffAccidentals = staffContexts[staffIdx].accidentals;
            vCursor.staffAttributes = staffContexts[staffIdx].attributes;
            if (catchUp) {
                lCursor.segmentX = xPerStaff[staffIdx];
            }
            vCursor.segmentInstance = gStaffMeasure[part + "_" + staffIdx];
            vCursor.segmentPosition = voiceStaves[staffIdx].length;
            var layout;
            model.key = "SATIE" + vCursor.measureInstance.uuid + "_parts_" + vCursor.segmentInstance.part + "_staves_" + vCursor.segmentInstance.owner + "_" + vCursor.segmentPosition;
            model.staffIdx = vCursor.staffIdx;
            if (vCursor.factory.modelHasType(model, Type.Barline)) {
                var totalDivisions = barDivisions(vCursor.staffAttributes);
                var divsToAdvance = totalDivisions - vCursor.segmentDivision;
                if (divsToAdvance > 0) {
                    vCursor.advance(divsToAdvance);
                }
            }
            if (spec.mode === RefreshMode.RefreshModel) {
                model.refresh(vCursor.const());
            }
            if (vCursor.factory.modelHasType(model, Type.Attributes)) {
                vCursor.staffAttributes = model._snapshot;
                vCursor.staffAccidentals = getNativeKeyAccidentals(model._snapshot.keySignature);
            }
            if (vCursor.factory.modelHasType(model, Type.Print)) {
                vCursor.print = model;
            }
            if (spec.mode === RefreshMode.RefreshLayout) {
                layout = model.getLayout(lCursor);
                layout.part = part;
                layout.key = model.key;
                if (spec.preview) {
                    lCursor.segmentX =
                        cleanliness.x[part][voiceSegment.owner].staffX[staffIdx][lCursor.segmentPosition];
                }
                cleanliness.x[part][voiceSegment.owner].staffX[staffIdx][lCursor.segmentPosition] = lCursor.segmentX;
            }
            invariant(isFinite(model.divCount), "%s should be a constant division count", model.divCount);
            vCursor.segmentDivision += model.divCount;
            if (vCursor.staffAttributes) {
                var totalDivisions = barDivisions(vCursor.staffAttributes);
                if (vCursor.segmentDivision > totalDivisions && !!gDivOverflow) {
                    if (!gDivOverflow) {
                        gDivOverflow = new DivisionOverflowException(totalDivisions, spec.measure, vCursor.staffAttributes);
                    }
                    invariant(totalDivisions === gDivOverflow.maxDiv, "Divisions are not consistent. Found %s but expected %s", totalDivisions, gDivOverflow.maxDiv);
                }
            }
            else {
                invariant(vCursor.segmentDivision === 0, "Expected attributes to be set on cursor");
            }
            staffContexts[staffIdx].division = vCursor.segmentDivision;
            staffContexts[staffIdx].accidentals = vCursor.staffAccidentals;
            staffContexts[staffIdx].attributes = vCursor.staffAttributes;
            xPerStaff[staffIdx] = lCursor.segmentX;
            vCursor.segmentDivision = oldDivision;
            vCursor.segmentInstance = oldSegment;
            vCursor.segmentPosition = oldIdx;
            if (spec.mode === RefreshMode.RefreshLayout) {
                invariant(!!layout, "%s must be a valid layout", layout);
            }
            voiceStaves[staffIdx].push(layout);
        }
        var segmentLayout = [];
        for (var i = 0; i < voiceSegment.length; ++i) {
            var model = voiceSegment[i];
            var atEnd = i + 1 === voiceSegment.length;
            var staffIdx = model.staffIdx;
            invariant(isFinite(model.staffIdx), "%s must be finite", model.staffIdx);
            if (!lCursor.lineMaxPaddingTopByStaff[model.staffIdx]) {
                lCursor.lineMaxPaddingTopByStaff[model.staffIdx] = 0;
            }
            if (!lCursor.lineMaxPaddingBottomByStaff[model.staffIdx]) {
                lCursor.lineMaxPaddingBottomByStaff[model.staffIdx] = 0;
            }
            if (!staffContexts[staffIdx]) {
                staffContexts[staffIdx] = {
                    accidentals: null,
                    attributes: gInitialAttribs[part][staffIdx],
                    division: 0,
                };
            }
            // Create a voice-staff pair if needed. We'll later merge all the
            // voice staff pairs.
            if (!voiceStaves[staffIdx]) {
                voiceStaves[staffIdx] = [];
                gStaffLayouts[part + "_" + staffIdx] =
                    gStaffLayouts[part + "_" + staffIdx] || [];
                gStaffLayouts[part + "_" + staffIdx].push(voiceStaves[staffIdx]);
                xPerStaff[staffIdx] = 0;
            }
            vCursor.segmentPosition = i;
            vCursor.staffAccidentals = staffContexts[staffIdx].accidentals;
            vCursor.staffAttributes = staffContexts[staffIdx].attributes;
            vCursor.staffIdx = staffIdx;
            while (staffContexts[staffIdx].division <= vCursor.segmentDivision) {
                var nextStaffEl = gStaffMeasure[part + "_" + staffIdx][voiceStaves[staffIdx].length];
                // We can mostly ignore priorities here, since except for barlines,
                // staff segments are more important than voice segments.
                var nextIsBarline = spec.factory.modelHasType(nextStaffEl, Type.Barline);
                if (nextIsBarline &&
                    staffContexts[staffIdx].division === vCursor.segmentDivision) {
                    break;
                }
                // Process a staff model within a voice context.
                var catchUp = staffContexts[staffIdx].division < vCursor.segmentDivision;
                pushStaffSegment(staffIdx, nextStaffEl, catchUp);
                invariant(isFinite(staffContexts[staffIdx].division), "divisionPerStaff is supposed " + "to be a number, got %s", staffContexts[staffIdx].division);
            }
            // All layout that can be controlled by the model is done here.
            var layout = void 0;
            model.key = "SATIE" + vCursor.measureInstance.uuid + "_parts_" + vCursor.segmentInstance.part + "_voices_" + vCursor.segmentInstance.owner + "_" + vCursor.segmentPosition;
            model.staffIdx = vCursor.staffIdx;
            if (!vCursor.staffAccidentals) {
                vCursor.staffAccidentals = getNativeKeyAccidentals(vCursor.staffAttributes.keySignature);
            }
            if (spec.mode === RefreshMode.RefreshModel) {
                model.refresh(vCursor.const());
            }
            if (vCursor.factory.modelHasType(model, Type.Chord)) {
                forEach(model, function (note) {
                    if (note.rest) {
                        return;
                    }
                    var pitch = note.pitch;
                    if ((vCursor.staffAccidentals[pitch.step + pitch.octave] || 0) !==
                        (pitch.alter || 0) ||
                        (vCursor.staffAccidentals[pitch.step] || 0) !== (pitch.alter || 0)) {
                        vCursor.staffAccidentals[pitch.step + pitch.octave] =
                            pitch.alter || 0;
                        if ((vCursor.staffAccidentals[pitch.step] || 0) !== (pitch.alter || 0)) {
                            vCursor.staffAccidentals[pitch.step] = InvalidAccidental;
                        }
                    }
                });
            }
            if (spec.mode === RefreshMode.RefreshLayout) {
                layout = model.getLayout(lCursor);
                if (spec.preview) {
                    lCursor.segmentX =
                        cleanliness.x[part][voiceSegment.owner].voiceX[lCursor.segmentPosition];
                }
                cleanliness.x[part][voiceSegment.owner].voiceX[lCursor.segmentPosition] = lCursor.segmentX;
                layout.part = part;
                layout.key = model.key;
            }
            vCursor.segmentDivision += model.divCount;
            gMaxDivisions = Math.max(gMaxDivisions, vCursor.segmentDivision);
            var totalDivisions = barDivisions(vCursor.staffAttributes);
            if (vCursor.segmentDivision > totalDivisions && !spec.preview) {
                // Note: unfortunate copy-pasta.
                if (!gDivOverflow) {
                    gDivOverflow = new DivisionOverflowException(totalDivisions, spec.measure, vCursor.staffAttributes);
                }
                invariant(totalDivisions === gDivOverflow.maxDiv, "Divisions are not consistent. Found %s but expected %s", totalDivisions, gDivOverflow.maxDiv);
                invariant(!!voiceSegment.part, "Part must be defined -- is this spec from Engine.validate$?");
            }
            if (atEnd) {
                // Finalize.
                forEach(gStaffMeasure, function (staff, idx) {
                    var pIdx = idx.lastIndexOf("_");
                    var staffMeasurePart = idx.substr(0, pIdx);
                    if (staffMeasurePart !== part) {
                        return;
                    }
                    var nidx = parseInt(idx.substr(pIdx + 1), 10);
                    var voiceStaff = voiceStaves[nidx];
                    if (!!staff && !!voiceStaff) {
                        while (voiceStaff.length < staff.length) {
                            pushStaffSegment(nidx, staff[voiceStaff.length], false);
                        }
                    }
                });
            }
            var previousAttribs = vCursor.staffAttributes;
            gInitialAttribs[voiceSegment.part][model.staffIdx] = previousAttribs;
            gPrint = vCursor.print;
            gMaxXInMeasure = Math.max(lCursor.segmentX, gMaxXInMeasure);
            gMaxPaddingTopInMeasure[model.staffIdx] = Math.max(lCursor.lineMaxPaddingTopByStaff[model.staffIdx], gMaxPaddingTopInMeasure[model.staffIdx] || 0);
            gMaxPaddingBottomInMeasure[model.staffIdx] = Math.max(lCursor.lineMaxPaddingBottomByStaff[model.staffIdx], gMaxPaddingBottomInMeasure[model.staffIdx] || 0);
            segmentLayout.push(layout);
        }
        lastPrint = spec.print;
        return segmentLayout;
    });
    if (gDivOverflow) {
        throw gDivOverflow;
    }
    // Get an ideal voice layout for each voice-staff combination
    var gStaffLayoutsUnkeyed = values(gStaffLayouts);
    var gStaffLayoutsCombined = flatten(gStaffLayoutsUnkeyed);
    // Create a layout that satisfies the constraints in every single voice.
    // IModel.mergeSegmentsInPlace requires two passes to fully merge the layouts.
    // We do the second pass once we filter unneeded staff segments.
    var gAllLayouts = gStaffLayoutsCombined.concat(gVoiceLayouts);
    // We have a staff layout for every single voice-staff combination.
    // They will be merged, so it doesn't matter which one we pick.
    // Pick the first.
    var gStaffLayoutsUnique = map(gStaffLayoutsUnkeyed, function (layouts) { return layouts[0]; });
    if (!spec.noAlign) {
        // Calculate and finish applying the master layout.
        // Two passes is always sufficient.
        var masterLayout = reduce(gAllLayouts, mergeSegmentsInPlace, []);
        // Avoid lining up different divisions
        reduce(masterLayout, function (_a, layout) {
            var prevDivision = _a.prevDivision, min = _a.min;
            var newMin = layout.x;
            if (min >= layout.x &&
                layout.division !== prevDivision &&
                layout.renderClass !== Type.Spacer &&
                layout.renderClass !== Type.Barline) {
                layout.x = min + 20;
            }
            return {
                prevDivision: layout.division,
                min: newMin,
            };
        }, { prevDivision: -1, min: -10 });
        reduce(gVoiceLayouts, mergeSegmentsInPlace, masterLayout);
        // Merge in the staves
        reduce(gStaffLayoutsUnique, mergeSegmentsInPlace, masterLayout);
    }
    var gPadding = gMaxXInMeasure === spec.measureX ||
        spec.lineBarOnLine + 1 === spec.lineTotalBarsOnLine
        ? 0
        : 15;
    var newLayout;
    if (spec.mode === RefreshMode.RefreshLayout && spec.preview) {
        newLayout = {
            attributes: oldLayout.attributes,
            print: oldLayout.print,
            elements: oldLayout.elements,
            width: oldLayout.width,
            maxDivisions: oldLayout.maxDivisions,
            originX: spec.measureX,
            originY: {},
            paddingTop: oldLayout.paddingTop,
            paddingBottom: oldLayout.paddingBottom,
            getVersion: function () { return gMeasure.version; },
            uuid: gMeasure.uuid,
        };
    }
    else {
        newLayout = {
            attributes: gInitialAttribs,
            print: gPrint,
            elements: gStaffLayoutsUnique.concat(gVoiceLayouts),
            width: gMaxXInMeasure + gPadding - spec.measureX,
            maxDivisions: gMaxDivisions,
            originX: spec.measureX,
            originY: {},
            paddingTop: gMaxPaddingTopInMeasure,
            paddingBottom: gMaxPaddingBottomInMeasure,
            getVersion: function () { return gMeasure.version; },
            uuid: gMeasure.uuid,
        };
    }
    if (spec.mode === RefreshMode.RefreshLayout && !spec.preview) {
        cleanliness.clean = newLayout;
    }
    return newLayout;
}
export var RefreshMode;
(function (RefreshMode) {
    RefreshMode[RefreshMode["RefreshModel"] = 0] = "RefreshModel";
    RefreshMode[RefreshMode["RefreshLayout"] = 1] = "RefreshLayout";
})(RefreshMode || (RefreshMode = {}));
/**
 * Given the context and constraints given, creates a possible layout for items within a measure.
 *
 * @param opts structure with __normalized__ voices and staves
 * @returns an array of staff and voice layouts with an undefined order
 */
export function layoutMeasure(_a) {
    var document = _a.document, header = _a.header, print = _a.print, measure = _a.measure, factory = _a.factory, x = _a.x, singleLineMode = _a.singleLineMode, preview = _a.preview, fixup = _a.fixup, lineShortest = _a.lineShortest, lineBarOnLine = _a.lineBarOnLine, lineTotalBarsOnLine = _a.lineTotalBarsOnLine, lineIndex = _a.lineIndex, lineCount = _a.lineCount, attributes = _a.attributes;
    var parts = map(scoreParts(header.partList), function (part) { return part.id; });
    var staves = flatten(map(parts, function (partId) { return measure.parts[partId].staves; }));
    var voices = flatten(map(parts, function (partId) { return measure.parts[partId].voices; }));
    var segments = filter(voices.concat(staves), function (s) { return !!s; });
    var status = refreshMeasure({
        document: document,
        factory: factory,
        print: print,
        header: header,
        measure: measure,
        measureX: x,
        segments: segments,
        lineShortest: lineShortest,
        lineBarOnLine: lineBarOnLine,
        lineTotalBarsOnLine: lineTotalBarsOnLine,
        lineIndex: lineIndex,
        lineCount: lineCount,
        mode: RefreshMode.RefreshLayout,
        singleLineMode: singleLineMode,
        preview: preview,
        fixup: fixup,
        attributes: attributes,
    });
    return status;
}
//# sourceMappingURL=engine_processors_measure.js.map