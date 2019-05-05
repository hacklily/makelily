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

import * as React from "react";
import { ScoreHeader, Print } from "musicxml-interfaces";
import { Component } from "react";
import * as PropTypes from "prop-types";
import { map, filter, forEach, last } from "lodash";
import invariant from "invariant";

import { IModel, generateModelKey } from "./document";

import { tenthsToMM } from "./private_renderUtil";
import { getPageMargins } from "./private_print";
import { IMeasureLayout } from "./private_measureLayout";

import MeasureView from "./implMeasure_measureView";
import CreditView from "./implPage_creditView";

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
  static childContextTypes = {
    originY: PropTypes.number.isRequired,
    renderTarget: PropTypes.oneOf(["svg-web", "svg-export"]).isRequired,
    scale40: PropTypes.number.isRequired,
  } as any;

  _pageHeight = NaN;

  render(): any {
    /*--- Staves ----------------------------------------------*/

    const lineLayouts = this.props.lineLayouts;

    /*--- General ---------------------------------------------*/

    const print = this.props.print;
    const pageNum = parseInt(print.pageNumber, 10);
    invariant(
      pageNum >= 1,
      "Page %s isn't a valid page number.",
      print.pageNumber,
    );
    const defaults = this.props.scoreHeader.defaults;
    const credits = filter(
      this.props.scoreHeader.credits,
      cr => cr.page === pageNum,
    );
    const scale40 =
      (defaults.scaling.millimeters / defaults.scaling.tenths) * 40;
    const pageLayout = print.pageLayout;
    const widthMM =
      this.props.renderTarget === "svg-export"
        ? tenthsToMM(scale40, pageLayout.pageWidth) + "mm"
        : "100%";
    const heightMM =
      this.props.renderTarget === "svg-export"
        ? tenthsToMM(scale40, pageLayout.pageHeight) + "mm"
        : "100%";

    const pageWidth = this.props.singleLineMode
      ? last(lineLayouts[0]).originX +
        last(lineLayouts[0]).width +
        getPageMargins(pageLayout.pageMargins, 0).rightMargin
      : pageLayout.pageWidth;

    const pageHeight = pageLayout.pageHeight;

    if (pageHeight !== this._pageHeight && this.props.onPageHeightChanged) {
      this._pageHeight = pageHeight;
      setTimeout(() => {
        this.props.onPageHeightChanged(pageHeight);
      });
    }

    /*--- Credits ---------------------------------------------*/

    // Make sure our credits are keyed.
    forEach<IModel>((credits as any) as IModel[], generateModelKey);

    /*--- Render ----------------------------------------------*/

    return (
      <svg
        className={this.props.className}
        style={
          this.props.renderTarget === "svg-export"
            ? undefined
            : {
                width: "auto",
              }
        }
        data-page={
          this.props.renderTarget === "svg-export"
            ? undefined
            : print.pageNumber
        }
        height={heightMM}
        ref={this._setSVG}
        viewBox={`0 0 ${pageWidth} ${pageHeight}`}
        width={widthMM}
      >
        {!this.props.singleLineMode && map(credits, c => <CreditView {...c} />)}
        {map(lineLayouts, (lineLayout, lineIdx) =>
          map(lineLayout, measureLayout => (
            <MeasureView
              key={measureLayout.uuid}
              layout={measureLayout}
              version={measureLayout.getVersion()}
            />
          )),
        )}
      </svg>
    );
  }

  private _setSVG: (svg: SVGSVGElement) => void = svg => {
    if (this.props.svgRef) {
      this.props.svgRef(svg);
    }
  };

  getChildContext() {
    const defaults = this.props.scoreHeader.defaults;
    const print = this.props.print;
    const scale40 =
      (defaults.scaling.millimeters / defaults.scaling.tenths) * 40;

    return {
      originY: print.pageLayout.pageHeight,
      renderTarget: this.props.renderTarget,
      scale40: scale40,
    };
  }
}
