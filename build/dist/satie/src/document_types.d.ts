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
declare enum Type {
    START_OF_LAYOUT_ELEMENTS = 0,
    Print = 10,
    Grouping = 30,
    FiguredBass = 40,
    END_OF_LAYOUT_ELEMENTS = 99,
    START_OF_STAFF_ELEMENTS = 100,
    Attributes = 110,
    Sound = 120,
    Direction = 130,
    Harmony = 140,
    Proxy = 150,
    Spacer = 160,
    END_OF_STAFF_ELEMENTS = 199,
    START_OF_VOICE_ELEMENTS = 200,
    Chord = 220,
    END_OF_VOICE_ELEMENTS = 299,
    VisualCursor = 398,
    Barline = 399,
}
export default Type;
