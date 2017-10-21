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

import {FiguredBass, Figure, Footnote, Level, NormalBold, NormalItalic,
    serializeFiguredBass} from "musicxml-interfaces";
import {forEach} from "lodash";

import {IModel, ILayout, Type} from "./document";

import {IReadOnlyValidationCursor, LayoutCursor} from "./private_cursor";
import {IBoundingRect} from "./private_boundingRect";

class FiguredBassModel implements Export.IFiguredBassModel {

    /*---- I.1 IModel ---------------------------------------------------------------------------*/

    /** @prototype only */
    divCount: number;

    /** @prototype only */
    divisions: number;

    /** defined externally */
    staffIdx: number;

    /*---- I.2 FiguredBass ----------------------------------------------------------------------*/

    figures: Figure[];
    duration: number;
    parentheses: boolean;

    /*---- I.2.2 Editorial ----------------------------------------------------------------------*/

    footnote: Footnote;
    level: Level;

    /*---- I.2.3 Printout -----------------------------------------------------------------------*/

    printDot: boolean;
    printLyric: boolean;
    printObject: boolean;
    printSpacing: boolean;

    /*---- I.2.4 PrintStyle ---------------------------------------------------------------------*/

    /*---- PrintStyle > Positition ----------------------------------------------------------*/

    defaultX: number; // ignored for now
    relativeY: number;
    defaultY: number;
    relativeX: number;

    /*---- PrintStyle > Font ----------------------------------------------------------------*/

    fontFamily: string;
    fontWeight: NormalBold;
    fontStyle: NormalItalic;
    fontSize: string;

    /*---- PrintStyle > Color ---------------------------------------------------------------*/

    get color(): string {
        let hex = this._color.toString(16);
        return "#" + "000000".substr(0, 6 - hex.length) + hex;
    }
    set color(a: string) {
        switch (true) {
            case !a:
                this._color = 0;
                break;
            case a[0] === "#":
                a = a.slice(1);
                this._color = parseInt(a, 16);
                break;
            default:
                this._color = parseInt(a, 16);
                break;
        }
    }

    private _color: number = 0x000000;

    /*---- Implementation -----------------------------------------------------------------------*/

    constructor(spec: FiguredBass) {
        forEach<any>(spec, (value, key) => {
            (this as any)[key] = value;
        });
    }

    refresh(cursor: IReadOnlyValidationCursor): void {
        // todo
    }

    getLayout(cursor: LayoutCursor): Export.IFiguredBassLayout {
        // todo

        return new FiguredBassModel.Layout(this, cursor);
    }

    toXML(): string {
        return `${serializeFiguredBass(this)}\n<forward><duration>${this.divCount}</duration></forward>\n`;
    }

    inspect() {
        return this.toXML();
    }

    calcWidth(shortest: number) {
        return 0;
    }
}

FiguredBassModel.prototype.divCount = 0;
FiguredBassModel.prototype.divisions = 0;

module FiguredBassModel {
    export class Layout implements Export.IFiguredBassLayout {
        constructor(model: FiguredBassModel, cursor: LayoutCursor) {
            this.model = model;
            this.x = cursor.segmentX;
            this.division = cursor.segmentDivision;
        }

        /*---- ILayout ------------------------------------------------------*/

        // Constructed:

        model: FiguredBassModel;
        x: number;
        division: number;

        // Prototype:

        boundingBoxes: IBoundingRect[];
        renderClass: Type;
        expandPolicy: "none";
    }

    Layout.prototype.expandPolicy = "none";
    Layout.prototype.renderClass = Type.FiguredBass;
    Layout.prototype.boundingBoxes = [];
    Object.freeze(Layout.prototype.boundingBoxes);
};

/**
 * Registers FiguredBass in the factory structure passed in.
 */
function Export(constructors: { [key: number]: any }) {
    constructors[Type.FiguredBass] = FiguredBassModel;
}

module Export {
    export interface IFiguredBassModel extends IModel, FiguredBass {
    }

    export interface IFiguredBassLayout extends ILayout {
    }
}

export default Export;
