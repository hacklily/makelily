/**
 * @source: https://github.com/jnetterf/satie/
 *
 * @license
 * (C) Josh Netterfield <joshua@nettek.ca> 2015.
 * Part of the Satie music engraver <https://github.com/jnetterf/satie>.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as invariant from "invariant";
import {forEach, some} from "lodash";

import IModel from "../document/model";
import Type from "../document/types";

import IFactory from "../private/factory";
import IPreprocessor from "../private/preprocessor";
import IPostprocessor from "../private/postprocessor";
import {cloneObject} from "../private/util";

if (!(process as any).browser) {
    /* tslint:disable */
    require("source-map-support").install();
    /* tslint:enable */
}

export type ModelInstaller =
    (constructors: {
        [key: number]: any;
        [key: string]: Type;
    }) => void;

class Factory implements IFactory {
    preprocessors: IPreprocessor[];
    postprocessors: IPostprocessor[];
    private _constructors: { [key: number]: any; [key: string]: Type; } = {};

    constructor(models: ModelInstaller[], pre: IPreprocessor[] = [], post: IPostprocessor[] = []) {
        forEach(models, model => {
            model(this._constructors);
        });
        this.preprocessors = pre;
        this.postprocessors = post;
    }

    create(modelType: Type, options?: any): IModel {
        invariant((<number>modelType) in this._constructors,
            "The type with id=%s does not have a factory.",
            modelType);

        return new (<any>this._constructors[modelType])(options);
    }

    modelHasType(model: IModel, ...modelTypes: Type[]): boolean {
        return some(modelTypes, modelType => {
            invariant((<number>modelType) in this._constructors,
                "The type with id=%s does not have a factory.",
                modelType);

            return model instanceof this._constructors[modelType] ||
                this._constructors[Type.Proxy] &&
                model instanceof this._constructors[Type.Proxy] &&
                    (<any>model)._target instanceof this._constructors[modelType];
        });
    }

    /**
     * Returns all models in models with types `types` at the timestep of the model at models[idx],
     * or an empty array if none exist.
     */
    search(models: IModel[], idx: number, ...types: Type[]): IModel[] {
        let filtered: IModel[] = [];
        while (idx > 0 && !models[idx - 1].divCount) {
            --idx;
        }
        for (let i = idx; i < models.length; ++i) {
            if (this.modelHasType(models[i], ...types)) {
                filtered.push(models[i]);
            } else if (models[i].divCount) {
                break;
            }
        }
        return filtered;
    }

    /**
     * Accepts a JSON string, or a plain object, and creates a spec.
     */
    fromSpec(spec: any): IModel {
        if (typeof spec === "string" || spec instanceof String) {
            spec = JSON.parse(<string> spec);
        } else {
            spec = cloneObject(spec);
        }

        if (!("_class" in spec)) {
            // It may be a note.
            invariant(spec[0] && spec[0]._class === "Note", "Specs must have the _class property set");
            spec._class = "Chord";
        }

        let sclass: Type = <any> Type[spec._class];
        invariant(sclass in this._constructors, "\"%s\" must be a known type", spec._class);

        return this.create(sclass, spec);
    }

    inspect(): string {
        return "[Factory]";
    }

    identity(model: IModel) {
        if ((<any>model)._omTarget) {
            return (<any>model)._omTarget;
        }
        return model;
    }
}

export default Factory;
