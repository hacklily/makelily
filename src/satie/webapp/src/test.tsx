import * as React from "react";
import { Component } from "react";
import { Link } from "react-router";
import { Application, ISong, Song } from "../../src/satie";
import { find } from "lodash";

import { prefix } from "./config";
import STYLES from "./test.css";

export const satieApplication = new Application({
  satieRoot: location.protocol + "//" + location.host + prefix + "/vendor/",
  preloadedFonts: ["Alegreya", "Alegreya (bold)"],
});

export interface IProps {
  key?: string | number;
  chrome?: boolean;
  name: string;
  showFilterButton?: boolean;
  filename: string;
  singleLine: boolean;
}

export interface IState {
  filename?: string;
  src?: string;
  error?: Error;
  loaded?: boolean;
}

export default class Test extends Component<IProps, IState> {
  state: IState = {
    filename: null,
    src: null,
    loaded: false,
  };
  _song: ISong;

  render() {
    const isSingleLine = this.props.singleLine;
    const chrome = this.props.chrome !== false;
    const showFilterButton = chrome && this.props.showFilterButton;
    const link = showFilterButton ? (
      <Link
        to={`${prefix}/tests/${this.props.name}/?mode=${
          isSingleLine ? "singleline" : "page"
        }`}
      >
        <button>hide others</button>
      </Link>
    ) : null;
    if (this.state.error) {
      const errStr = "" + (this.state.error as any).stack.toString();
      const lines = errStr
        .split("\n")
        .map((s, idx) => <div key={idx}>{s}</div>);
      return (
        <div className={STYLES.test}>
          <h3>
            Test {this.state.filename}&nbsp;&nbsp;{link}
          </h3>
          <code className={STYLES.error}>{lines}</code>
        </div>
      );
    }

    const misc =
      chrome && this._song && this._song.header.identification.miscellaneous;
    const descriptionField =
      chrome &&
      find(
        misc && misc.miscellaneousFields,
        (field) => field.name === "description",
      );
    const description =
      chrome &&
      (descriptionField ? descriptionField.data : <p>No description.</p>);
    const title = chrome && (
      <h3>
        Test {this.state.filename}&nbsp;&nbsp;{link}
      </h3>
    );
    return (
      <div className={STYLES.test}>
        {title}
        {description}
        {!this.state.loaded && <div>Loading...</div>}
        <br />
        {this.state.src && (
          <Song
            baseSrc={this.state.src}
            ref={this._setSongRef}
            onError={this._handleError}
            onLoaded={this._handleLoaded}
            pageClassName={!this.props.singleLine && STYLES.page}
            singleLineMode={this.props.singleLine}
          />
        )}
      </div>
    );
  }

  componentDidMount() {
    this.componentDidUpdate(null, {});
  }

  UNSAFE_componentWillMount() {
    this.setState({
      filename: this.props.filename,
    });
  }

  UNSAFE_componentWillReceiveProps(nextProps: IProps) {
    if (this.props.filename !== nextProps.filename) {
      this.setState({
        filename: nextProps.filename,
        src: null,
      });
    }
  }

  componentDidUpdate(prevProps: IProps, prevState: IState) {
    const prefix = process.env.PLAYGROUND_PREFIX || "";
    if (
      this.state.filename !== prevState.filename ||
      prevProps.singleLine !== this.props.singleLine
    ) {
      const request = new XMLHttpRequest();
      request.open("GET", prefix + this.state.filename);
      request.onload = () => {
        if (request.status !== 200) {
          this.setState({
            error: new Error(
              "Status: " + request.status + "\n" + request.responseText,
            ),
            src: request.responseText,
          });
          return;
        }
        this.setState({
          src: request.responseText,
        });
      };
      request.send();
      this._song = null;
      this.setState({
        loaded: false,
      });
    }
  }

  private _handleError = (error: Error) => {
    this._song = null;
    this.setState({
      error,
      loaded: false,
    });
  };

  private _handleLoaded = () => {
    this.setState({
      loaded: true,
    });
  };

  private _setSongRef = (song: ISong) => {
    this._song = song;
  };
}
