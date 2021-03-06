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
import { ScoreHeader, Print } from "musicxml-interfaces";
import { Component } from "react";
import { IMeasureLayout } from "./private_measureLayout";
export interface IProps {
    scoreHeader: ScoreHeader;
    print: Print;
    lineLayouts: IMeasureLayout[][];
    renderTarget: "svg-web" | "svg-export";
    className: string;
    singleLineMode?: boolean;
    onPageHeightChanged?: (pageHeight: number) => void;
    svgRef?: (svg: SVGSVGElement) => void;
}
export default class Page extends Component<IProps, {}> {
    static childContextTypes: any;
    _pageHeight: number;
    render(): any;
    private _setSVG;
    getChildContext(): {
        originY: number;
        renderTarget: "svg-web" | "svg-export";
        scale40: number;
    };
}
