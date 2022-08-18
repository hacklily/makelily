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

import { flatten, map, values, filter } from "lodash";
import invariant from "invariant";

import { IModel } from "./document";

export interface ISegment extends Array<IModel> {
  owner: number;
  ownerType: "staff" | "voice";
  divisions: number;
  part?: string;
}

export interface IMeasurePart {
  voices: ISegment[];
  staves: ISegment[];
}

/**
 * Based on MusicXML's Measure, but with additional information, and with a staff/voice-seperated and
 * monotonic parts element.
 */
export interface IMeasure {
  idx: number; // 0-indexed, can change
  uuid: number;
  number: string; // 1-indexed
  implicit?: boolean;
  width?: number;
  nonControlling?: boolean;
  parts: {
    [id: string]: IMeasurePart;
  };

  /**
   * Incremented whenever anything in the measure changes.
   * Local only and monotonic.
   */
  version: number;
}

export function getMeasureSegments(measure: IMeasure): ISegment[] {
  const voiceSegments = <ISegment[]>(
    flatten(map(values<IMeasurePart>(measure.parts), (part) => part.voices))
  );

  const staffSegments = <ISegment[]>(
    flatten(map(values<IMeasurePart>(measure.parts), (part) => part.staves))
  );

  return filter(voiceSegments.concat(staffSegments), (s) => !!s);
}

export function reduceToShortestInSegments(
  shortest: number,
  segment: ISegment,
) {
  return segment.reduce(reduceToShortestInSegment, shortest);
}

export function reduceToShortestInSegment(shortest: number, model: IModel) {
  if (!(model.divCount >= 0)) {
    invariant(model.divCount >= 0, "Counts must exceed 0 in", model);
  }
  const divCount = model && model.divCount ? model.divCount : Number.MAX_VALUE;
  return Math.min(shortest, divCount);
}
