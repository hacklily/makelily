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

import * as React from "react";
import {
  Direction,
  NormalItalic,
  NormalBold,
  CreditWords,
  Words,
} from "musicxml-interfaces";
import { Component } from "react";
import * as PropTypes from "prop-types";
import { filter, map, extend } from "lodash";
import invariant from "invariant";

import { cssSizeToTenths } from "./private_renderUtil";
import { ITextMixin, Prototype as TextMixin } from "./private_views_textMixin";

export interface IProps {
  layout: { model: Direction; overrideX?: number };
  key?: string | number;
}

export default class WordsView extends Component<IProps, {}>
  implements ITextMixin {
  static contextTypes = {
    originY: PropTypes.number.isRequired,
    scale40: PropTypes.number.isRequired,
  } as any;

  context: {
    originY: number;
    scale40: number;
  };

  /* TextMixin.ITextMixin */
  getTextAnchor: (words: CreditWords | Words) => string;
  getTextDecoration: (words: CreditWords | Words) => string;
  getTransform: (words: CreditWords | Words) => string;
  getDirection: (words: CreditWords | Words) => string;
  getX: (lineNum: number) => number;
  getDX: (words: CreditWords | Words, initX: number, lineNum: number) => number;
  getDY: (words: CreditWords | Words, initY: number, lineNum: number) => number;

  render(): any {
    let layout = this.props.layout;
    let model = layout.model;
    let wordsContainer = filter(model.directionTypes, dt => dt.words)[0];
    invariant(!!wordsContainer, "No words found!");
    let words =
      typeof wordsContainer !== "number" &&
      typeof wordsContainer !== "function" &&
      wordsContainer.words;

    let initX = this.props.layout.overrideX;
    let initY =
      this.context.originY - words[0].defaultY - (words[0].relativeY || 0);
    let scale40 = this.context.scale40;

    return (
      <text x={initX} y={initY}>
        {map(words, (words, idx) => {
          let isBold = words.fontWeight === NormalBold.Bold;
          let isItalic = words.fontStyle === NormalItalic.Italic;
          let fontSize = cssSizeToTenths(scale40, words.fontSize);

          return map(words.data.split("\n"), (line, lineNum) => (
            <tspan
              alignmentBaseline="hanging"
              fill={words.color || "black"}
              direction={this.getDirection(words)}
              dx={this.getDX(words, 0, lineNum)}
              dy={this.getDY(words, initY, lineNum)}
              fontStyle={isItalic ? "italic" : "normal"}
              fontWeight={isBold ? "bold" : "normal"}
              fontFamily={words.fontFamily || "Alegreya"}
              fontSize={fontSize}
              key={idx + "l" + lineNum}
              letterSpacing={
                words.letterSpacing && words.letterSpacing !== "normal"
                  ? "" +
                    cssSizeToTenths(this.context.scale40, words.letterSpacing)
                  : "normal"
              }
              textDecoration={this.getTextDecoration(words)}
              textAnchor={this.getTextAnchor(words)}
              transform={this.getTransform(words)}
              x={this.getX(lineNum)}
            >
              {line}
            </tspan>
          ));
        })}
      </text>
    );
  }
}

extend(WordsView.prototype, TextMixin);
