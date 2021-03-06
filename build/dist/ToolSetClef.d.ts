/**
 * @license
 * This file is part of Makelily.
 * Copyright (C) 2017 - present Jocelyn Stericker <jocelyn@nettek.ca>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301  USA
 */
import React from "react";
import { ToolProps } from "./tool";
export interface State {
    octave: number;
    octaveOptional: boolean;
    selectedClef: number;
}
/**
 * A tool which allows clefs to be inserted.
 */
export default class ToolSetClef extends React.Component<ToolProps, State> {
    state: State;
    render(): JSX.Element;
    private generateLy;
    private handleInsertLyClicked;
}
