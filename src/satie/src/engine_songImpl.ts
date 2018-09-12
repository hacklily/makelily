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

import {Component, SyntheticEvent} from "react";

import {forEach, isEqual, throttle, find, extend} from "lodash";
import {createElement, ReactElement} from "react";
import {Pitch, ScoreHeader} from "musicxml-interfaces";
import {IAny, invert} from "musicxml-interfaces/operations";
import invariant from "invariant";

import {Document, ISong, IPatchSpec, specIsDocBuilder, specIsPartBuilder, specIsRaw, IProps, IMouseEvent} from "./document";
import createPatch from "./engine_createPatch";

import {pitchForClef} from "./private_chordUtil";
import {get as getByPosition} from "./private_views_metadata";
import {IFactory} from "./private_factory";
import PatchImpl from "./private_patchImpl";

import {importXML} from "./engine_import";
import {exportXML} from "./engine_export";
import applyOp from "./engine_applyOp";

export type Handler = (ev: IMouseEvent) => void;

const NOT_READY_ERROR = "The document is not yet initialized.";
const SATIE_ELEMENT_RX = /SATIE([0-9]*)_(\w*)_(\w*)_(\w*)_(\w*)_(\w*)/;

export interface IState {
    document?: Document;
    factory?: IFactory;
}

/**
 * Represents a song as:
 *  - some MusicXML, as a string
 *  - a series of patches applied on top of the MusicXML.
 *
 * The class can be used:
 *  - as a React component, to render to the DOM.
 *  - as a simple class (in this case call song.run() to load or update the document) to
 *    export to MusicXML (toMusicXML()) or SVG (toSVG()).
 *
 * Note: toMusicXML and toSVG can also be used when Song is used as a React component
 * (e.g., <Song ... ref={song => console.log(song.toMusicXML())} />)
 */
export default class SongImpl extends Component<IProps, IState> implements ISong {
    state: IState = {
        document: null,
        factory: null,
    };

    private _docPatches: IAny[] = [];
    private _isRunningWithoutDOM: boolean;
    private _page1: ReactElement<any> = null;
    private _pt: SVGPoint;
    private _svg: SVGSVGElement;

    render(): ReactElement<any> {
        // Note: we rectify/render before this is called. We assume shouldComponentUpdate
        // stops temporary states from being rendered.
        return createElement("div", {
                onMouseMove: this.props.onMouseMove && this._handleMouseMove,
                onClick: this.props.onMouseClick && this._handleClick,
            } as any, this._page1);
    }

    shouldComponentUpdate(nextProps: IProps) {
        return nextProps.baseSrc !== this.props.baseSrc ||
            nextProps.patches !== this.props.patches ||
            nextProps.pageClassName !== this.props.pageClassName ||
            nextProps.singleLineMode !== this.props.singleLineMode ||
            nextProps.fixedMeasureWidth !== this.props.fixedMeasureWidth;
    }

    componentWillReceiveProps(nextProps: IProps) {
        if (nextProps.baseSrc !== this.props.baseSrc) {
            this._loadXML(nextProps.baseSrc);
        } else if (nextProps.pageClassName !== this.props.pageClassName ||
                nextProps.fixedMeasureWidth !== this.props.fixedMeasureWidth ||
                nextProps.singleLineMode !== this.props.singleLineMode) {
            this._preRender(nextProps);
        } else if (nextProps.patches !== this.props.patches) {
            const patches = nextProps.patches;
            if (patches instanceof PatchImpl) {
                this._update$(patches.content, patches.isPreview);
            } else if (!patches) {
                this._update$([], false);
            } else {
                throw new Error("Invalid patch.");
            }
        }
    }
    componentWillMount() {
        this._loadXML(this.props.baseSrc);
    }

    /**
     * Returns the document represented by the song. The document represents the
     * current state of the song.
     *
     *  - The returned document is constant (i.e., do not modify the document)
     *  - The returned document is NOT immutable (i.e., the document may change
     *    after patches are applied), or the song is re-rendered.
     *  - The song may load a new document without warning after any operation.
     *    As such, do not cache the document.
     *  - The document's API is not finalized. If you depend on this function call,
     *    expect breakages.
     *  - This API call will eventually be removed and replaced with higher-level
     *    functions.
     */
    getDocument = (operations: {isPatches: boolean}): Document => {
        if (!this.state.document) {
            throw new Error(NOT_READY_ERROR);
        }
        if (operations instanceof PatchImpl) {
            this._rectify$(operations.content, operations.isPreview, () => operations.isPreview = false);
            return this.state.document;
        } else if (!operations) {
            this._rectify$([], false, () => void 0);
            return this.state.document;
        }
        throw new Error("Invalid operations element");
    }

    get header(): ScoreHeader {
        if (this.state && this.state.document) {
            return this.state.document.header;
        }
        return null;
    }

    set header(header: ScoreHeader) {
        if (this.state) {
            throw new Error("Cannot set header. Use patches.");
        }
        // Do nothing -- makeExportsHot is running, probably.
    }

    /**
     * Given a set of OT diffs, returns something the "patches" prop can be set to.
     */
    createCanonicalPatch = (...patchSpecs: IPatchSpec[]): {isPatches: boolean} => {
        return this._createPatch(false, patchSpecs);
    }

    /**
     * Given a set of operations, returns a set of operations that the "preview" prop can
     * be set to.
     */
    createPreviewPatch = (...patchSpecs: IPatchSpec[]): {isPatches: boolean} => {
        return this._createPatch(true, patchSpecs);
    }

    toSVG = (): string => {
        let patches: {} = this.props.patches;
        if (patches instanceof PatchImpl) {
            invariant(patches.isPreview === false, "Cannot render an SVG with a previewed patch");
            this._rectify$(patches.content, patches.isPreview, () => { (patches as any).isPreview = false; });
        } else if (!patches) {
            this._rectify$([], false, () => void 0);
        } else {
            throw new Error(
                "Song.props.patches was not created through createPreviewPatch or createCanonicalPatch");
        }
        return this.state.document.renderToStaticMarkup(0);
    }

    toMusicXML = (): string => {
        let patches: {} = this.props.patches;
        if (patches instanceof PatchImpl) {
            invariant(patches.isPreview === false, "Cannot render MusicXML with a previewed patch");
            this._rectify$(patches.content, patches.isPreview, () => (patches as any).preview = false);
        } else if (!patches) {
            this._rectify$([], false, () => void 0);
        } else {
            throw new Error(
                "Song.props.patches was not created through createPreviewPatch or createCanonicalPatch");
        }
        return exportXML(this.state.document);
    }

    run() {
        this.setState = (state: any, cb: Function) => {
            extend(this.state, state);
            if (cb) {
                cb();
            }
        };
        this.forceUpdate = () => {
            // no-op
        };
        if (!this._isRunningWithoutDOM) {
            this.componentWillMount();
        }
        this._isRunningWithoutDOM = true;
        this.componentWillReceiveProps(this.props);
    }

    private _createPatch(isPreview: boolean, patchSpecs: IPatchSpec[]) {
        let patches: IAny[] = patchSpecs.reduce((array, spec) => {
            if (specIsRaw(spec)) {
                return array.concat(spec.raw);
            } else if (specIsDocBuilder(spec)) {
                return array.concat(createPatch(isPreview,
                    this.state.document,
                    spec.documentBuilder));
            } else if (specIsPartBuilder(spec)) {
                return array.concat(createPatch(isPreview,
                    this.state.document,
                    spec.measure,
                    spec.part,
                    spec.partBuilder
                ));
            } else if (spec instanceof PatchImpl) {
                return array.concat(spec.content);
            } else if (!spec) {
                return array;
            }
            throw new Error("Invalid patch spec.");
        }, []);

        this._update$(patches, isPreview);

        return new PatchImpl(this._docPatches.slice(), isPreview);
    }

    private _rectify$(newPatches: IAny[], preview: boolean, notEligableForPreview: () => void) {
        const docPatches = this._docPatches;
        const factory = this.state.factory;

        const commonVersion = () => {
            const maxPossibleCommonVersion = Math.min(
                docPatches.length,
                newPatches.length);

            for (let i = 0; i < maxPossibleCommonVersion; ++i) {
                if (!isEqual(docPatches[i], newPatches[i])) {
                    return i;
                }
            }
            return maxPossibleCommonVersion;
        };

        const initialCommon = commonVersion();

        // Undo actions not in common
        forEach(invert(docPatches.slice(initialCommon)), (op) => {
            applyOp(preview, this.state.document.measures, factory, op, this.state.document, notEligableForPreview);
            docPatches.pop();
        });

        // Perform actions that are expected.
        forEach(newPatches.slice(this._docPatches.length), (op) => {
            applyOp(preview, this.state.document.measures, factory, op, this.state.document, notEligableForPreview);
            docPatches.push(op);
        });

        invariant(docPatches.length === newPatches.length,
            "Something went wrong in _rectify. The current state is now invalid.");
    }
    private _rectifyAppendCanonical = (ops:IAny[]):void => {
        this._rectify$(this._docPatches.concat(ops), false, () => void 0);
    }
    private _rectifyAppendPreview = (ops:IAny[]): void => {
        this._rectify$(this._docPatches.concat(ops), true, () => void 0);
    }
    private _update$(patches: IAny[], isPreview: boolean, props: IProps = this.props) {
        this._rectify$(patches, isPreview, () => isPreview = false);

        this._page1 = this.state.document.__getPage(
            0,
            isPreview,
            "svg-web",
            props.pageClassName || "",
            props.singleLineMode,
            props.fixedMeasureWidth,
            isPreview ? this._rectifyAppendPreview : this._rectifyAppendCanonical,
            this._syncSVG,
            props.onPageHeightChanged,
        );
        this.forceUpdate();
    }

    private _preRender = (props: IProps = this.props) => {
        const patches = this.props.patches as {};
        if (patches instanceof PatchImpl) {
            this._update$(patches.content, patches.isPreview, props);
        } else if (!patches) {
            this._update$([], false, props);
        } else {
            throw new Error("Internal error: preRender called, but the state is invalid.");
        }
    }

    private _syncSVG = (svg: SVGSVGElement) => {
        this._svg = svg;
        this._pt = svg ? svg.createSVGPoint() : null;
    }

    private _getPos(ev: SyntheticEvent<Node>) {
        if (!this._svg.contains(ev.target as Node)) {
            return null;
        }

        // Get point in global SVG space
        this._pt.x = (ev as any).clientX;
        this._pt.y = (ev as any).clientY;

        return this._pt.matrixTransform(this._svg.getScreenCTM().inverse());
    }

    private _handleCursorPosition = throttle((p: {x: number; y: number}, handler: Handler) => {
        let match = getByPosition(p);

        let path = match && match.key.match(SATIE_ELEMENT_RX);
        if (!path) {
            handler({
                path: [],
                pitch: null,
                pos: p,
                matchedOriginY: null,
                _private: null,
            });
            return;
        }

        path = path.slice(1);
        let measure: any = find(this.state.document.measures,
            (measure) => 1 * measure.uuid === parseInt(path[0], 10));

        let el = measure[path[1]][path[2]][path[3]][path[4]][path[5]];
        if (el) {
            let originY = match.originY;
            let clef = el._clef;
            let pitch: Pitch;
            if (clef && originY) {
                pitch = pitchForClef(originY - p.y, clef);
            }
            handler({
                path,
                pitch,
                pos: p,
                matchedOriginY: originY,
                _private: match.obj,
            });
        }
    }, 18);

    private _handleMouseMove = (ev: SyntheticEvent<Node>) => {
        let p = this._getPos(ev);
        if (p) {
            this._handleCursorPosition(p, this.props.onMouseMove);
        }
    }

    private _handleClick = (ev: any) => {
        let p = this._getPos(ev);
        if (p) {
            this._handleCursorPosition(p, this.props.onMouseClick);
        }
    }

    private _loadXML(xml: string) {
        this.setState({
            document: null,
            factory: null,
        });

        importXML(xml, (error, loadedDocument, loadedFactory) => {
            if (error) {
                this.props.onError(error);
            } else {
                this.setState({
                    document: loadedDocument,
                    factory: loadedFactory,
                }, this._preRender);
            }
            invariant(!this.props.patches, "Expected patches to be empty on document load.");
            if (this.props.onLoaded) {
                this.props.onLoaded();
            }
        });
    }
}
