/* @flow */

import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { dockToolbox } from '../../../toolbox';

import { setFilmstripHovered } from '../../actions';
import { shouldRemoteVideosBeVisible } from '../../functions';

import Toolbar from './Toolbar';

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link Filmstrip}.
 */
type Props = {

    /**
     * Additional CSS class names top add to the root.
     */
    _className: string,

    /**
     * Whether the UI/UX is filmstrip-only.
     */
    _filmstripOnly: boolean,

    /**
     * Whether or not remote videos are currently being hovered over. Hover
     * handling is currently being handled detected outside of react.
     */
    _hovered: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<*>
};

/**
 * Implements a React {@link Component} which represents the filmstrip on
 * Web/React.
 *
 * @extends Component
 */
class Filmstrip extends Component <Props> {
    _isHovered: boolean;

    _notifyOfHoveredStateUpdate: Function;

    _onMouseOut: Function;

    _onMouseOver: Function;

    /**
     * Initializes a new {@code Filmstrip} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Debounce the method for dispatching the new filmstrip handled state
        // so that it does not get called with each mouse movement event. This
        // also works around an issue where mouseout and then a mouseover event
        // is fired when hovering over remote thumbnails, which are not yet in
        // react.
        this._notifyOfHoveredStateUpdate
            = _.debounce(this._notifyOfHoveredStateUpdate, 100);

        // Cache the current hovered state for _updateHoveredState to always
        // send the last known hovered state.
        this._isHovered = false;

        // Bind event handlers so they are only bound once for every instance.
        this._onMouseOut = this._onMouseOut.bind(this);
        this._onMouseOver = this._onMouseOver.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        // Note: Appending of {@code RemoteVideo} views is handled through
        // VideoLayout. The views do not get blown away on render() because
        // ReactDOMComponent is only aware of the given JSX and not new appended
        // DOM. As such, when updateDOMProperties gets called, only attributes
        // will get updated without replacing the DOM. If the known DOM gets
        // modified, then the views will get blown away.

        return (
            <div className = { `filmstrip ${this.props._className}` }>
                { this.props._filmstripOnly && <Toolbar /> }
                <div
                    className = 'filmstrip__videos'
                    id = 'remoteVideos'>
                    <div
                        className = 'filmstrip__videos'
                        id = 'filmstripLocalVideo'
                        onMouseOut = { this._onMouseOut }
                        onMouseOver = { this._onMouseOver }>
                        <div id = 'filmstripLocalVideoThumbnail' />
                    </div>
                    <div
                        className = 'filmstrip__videos'
                        id = 'filmstripRemoteVideos'>
                        {/*
                          * XXX This extra video container is needed for
                          * scrolling thumbnails in Firefox; otherwise, the flex
                          * thumbnails resize instead of causing overflow.
                          */}
                        <div
                            className = 'remote-videos-container'
                            id = 'filmstripRemoteVideosContainer'
                            onMouseOut = { this._onMouseOut }
                            onMouseOver = { this._onMouseOver }>
                            <div id = 'localVideoTileViewContainer' />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /**
     * If the current hover state does not match the known hover state in redux,
     * dispatch an action to update the known hover state in redux.
     *
     * @private
     * @returns {void}
     */
    _notifyOfHoveredStateUpdate() {
        if (this.props._hovered !== this._isHovered) {
            this.props.dispatch(dockToolbox(this._isHovered));
            this.props.dispatch(setFilmstripHovered(this._isHovered));
        }
    }

    /**
     * Updates the currently known mouseover state and attempt to dispatch an
     * update of the known hover state in redux.
     *
     * @private
     * @returns {void}
     */
    _onMouseOut() {
        this._isHovered = false;
        this._notifyOfHoveredStateUpdate();
    }

    /**
     * Updates the currently known mouseover state and attempt to dispatch an
     * update of the known hover state in redux.
     *
     * @private
     * @returns {void}
     */
    _onMouseOver() {
        this._isHovered = true;
        this._notifyOfHoveredStateUpdate();
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code Filmstrip}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _className: string,
 *     _hovered: boolean,
 *     _filmstripOnly: boolean
 * }}
 */
function _mapStateToProps(state) {
    const { hovered } = state['features/filmstrip'];
    const isFilmstripOnly = Boolean(interfaceConfig.filmStripOnly);
    const reduceHeight = !isFilmstripOnly
        && state['features/toolbox'].visible
        && interfaceConfig.TOOLBAR_BUTTONS.length;
    const remoteVideosVisible = shouldRemoteVideosBeVisible(state);
    const className = `${remoteVideosVisible ? '' : 'hide-videos'} ${
        reduceHeight ? 'reduce-height' : ''}`.trim();

    return {
        _className: className,
        _filmstripOnly: isFilmstripOnly,
        _hovered: hovered
    };
}

export default connect(_mapStateToProps)(Filmstrip);
