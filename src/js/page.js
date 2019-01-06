/**
 * Pages module.
 */

import $ from 'jquery';
import events from './event';
import config from 'enketo/config';
import 'jquery-touchswipe';

export default {
    active: false,
    $current: [],
    $activePages: $(),
    init() {
        if ( !this.form ) {
            throw new Error( 'Repeats module not correctly instantiated with form property.' );
        }
        if ( this.form.view.$.hasClass( 'pages' ) ) {
            const $allPages = this.form.view.$.find( ' .question:not([role="comment"]), .or-appearance-field-list' )
                .add( '.or-repeat.or-appearance-field-list + .or-repeat-info' )
                .filter( function() {
                    // something tells me there is a more efficient way to doing this
                    // e.g. by selecting the descendants of the .or-appearance-field-list and removing those
                    return $( this ).parent().closest( '.or-appearance-field-list' ).length === 0;
                } )
                .attr( 'role', 'page' );

            if ( $allPages.length > 0 || $allPages.eq( 0 ).hasClass( 'or-repeat' ) ) {
                this.$formFooter = $( '.form-footer' );     // smap
                // const formWrapper = this.form.view.html.parentNode; // smap
                // this.$formFooter = $( formWrapper.querySelector( '.form-footer' ) ); // smap
                this.$btnFirst = this.$formFooter.find( '.first-page' );
                this.$btnPrev = this.$formFooter.find( '.previous-page' );
                this.$btnNext = this.$formFooter.find( '.next-page' );
                this.$btnLast = this.$formFooter.find( '.last-page' );
                this.$toc = $( '.pages-toc__list' );   // smap
                //this.$toc = $( formWrapper.querySelector( '.pages-toc__list' ) ); // smap
                this._updateAllActive( $allPages );
                this._updateToc();
                this._toggleButtons( 0 );
                this._setButtonHandlers();
                this._setRepeatHandlers();
                this._setBranchHandlers();
                this._setSwipeHandlers();
                this._setTocHandlers();
                this._setLangChangeHandlers();
                this.active = true;
                this._flipToFirst();
            }
            /*else {
                form.view.$.removeClass( 'pages' );
            }*/
        }
    },
    // flips to the page provided as jQueried parameter or the page containing
    // the jQueried element provided as parameter
    // alternatively, (e.g. if a top level repeat without field-list appearance is provided as parameter)
    // it flips to the page contained with the jQueried parameter;
    flipToPageContaining( $e ) {
        let $closest;

        $closest = $e.closest( '[role="page"]' );
        $closest = ( $closest.length === 0 ) ? $e.find( '[role="page"]' ) : $closest;

        // If $e is a comment question, and it is not inside a group, there may be no $closest.
        if ( $closest.length ) {
            this._flipTo( $closest[ 0 ] );
        }
        this.$toc.parent().find( '.pages-toc__overlay' ).click();
    },
    _setButtonHandlers() {
        const that = this;
        // Make sure eventhandlers are not duplicated after resetting form.
        this.$btnFirst.off( '.pagemode' ).on( 'click.pagemode', () => {
            if ( !that.form.pageNavigationBlocked ) {
                that._flipToFirst();
            }
            return false;
        } );
        this.$btnPrev.off( '.pagemode' ).on( 'click.pagemode', () => {
            if ( !that.form.pageNavigationBlocked ) {
                that._prev();
            }
            return false;
        } );
        this.$btnNext.off( '.pagemode' ).on( 'click.pagemode', () => {
            if ( !that.form.pageNavigationBlocked ) {
                that._next();
            }
            return false;
        } );
        this.$btnLast.off( '.pagemode' ).on( 'click.pagemode', () => {
            if ( !that.form.pageNavigationBlocked ) {
                that._flipToLast();
            }
            return false;
        } );
    },
    _setSwipeHandlers() {
        if ( config.swipePage === false ) {
            return;
        }
        const that = this;
        const $main = this.form.view.$.closest( '.main' );

        $main.swipe( 'destroy' );
        $main.swipe( {
            allowPageScroll: 'vertical',
            threshold: 250,
            preventDefaultEvents: false,
            swipeLeft() {
                that.$btnNext.click();
            },
            swipeRight() {
                that.$btnPrev.click();
            },
            swipeStatus( evt, phase ) {
                if ( phase === 'start' ) {
                    /*
                     * Triggering blur will fire a change event on the currently focused form control
                     * This will trigger validation and is required to block page navigation on swipe 
                     * with form.pageNavigationBlocked
                     * The only potential problem with this approach is that the threshold (250ms)
                     * may theoretically not be sufficient to ensure validation is completed to 
                     * set form.pageNavigationBlocked to true. The edge case will be very slow devices
                     * and/or amazingly complex constraint expressions.
                     */
                    that._getCurrent().find( ':focus' ).blur();
                }
            }
        } );
    },
    _setTocHandlers() {
        const that = this;
        this.$toc
            .on( 'click', 'a', function() {
                if ( !that.form.pageNavigationBlocked ) {
                    const index = $( this.parentNode ).prevAll().length;
                    that.flipToPageContaining( $( that.tocItems[ index ].pageEl ) );
                }
                return false;
            } )
            .parent().find( '.pages-toc__overlay' ).on( 'click', () => {
                that.$toc.parent().find( '#toc-toggle' ).prop( 'checked', false );
            } );
    },
    _setRepeatHandlers() {
        const that = this;
        // TODO: can be optimized by smartly updating the active pages
        this.form.view.$
            .on( 'addrepeat.pagemode', ( event, index, byCountUpdate ) => {
                that._updateAllActive();
                // Don't flip if the user didn't create the repeat with the + button.
                // or if is the default first instance created during loading.
                // except if the new repeat is actually first page in the form.
                if ( !byCountUpdate || that.$activePages[ 0 ] === event.target ) {
                    that.flipToPageContaining( $( event.target ) );
                }
            } )
            .on( 'removerepeat.pagemode', event => {
                // if the current page is removed
                // note that that.$current will have length 1 even if it was removed from DOM!
                if ( that.$current.closest( 'html' ).length === 0 ) {
                    that._updateAllActive();
                    let $target = $( event.target ).prev();
                    if ( $target.length === 0 ) {
                        $target = $( event.target );
                    }
                    // is it best to go to previous page always?
                    that.flipToPageContaining( $target );
                }
            } );
    },
    _setBranchHandlers() {
        const that = this;
        // TODO: can be optimized by smartly updating the active pages
        this.form.view.$
            //.off( 'changebranch.pagemode' )
            .on( 'changebranch.pagemode', () => {
                that._updateAllActive();
                // If the current page has become inactive (e.g. a form whose first page during load becomes irrelevant)
                if ( that.$activePages.get().indexOf( that.$current[ 0 ] ) === -1 ) {
                    that._next();
                }
                that._toggleButtons();
            } );
    },
    _setLangChangeHandlers() {
        const that = this;
        this.form.view.$
            .on( 'changelanguage.pagemode', () => {
                that._updateToc();
            } );
    },
    _getCurrent() {
        return this.$current;
    },
    _updateAllActive( $all ) {
        $all = $all || this.form.view.$.find( '[role="page"]' );
        this.$activePages = $all.filter( function() {
            const $this = $( this );
            return $this.closest( '.disabled' ).length === 0 &&
                ( $this.is( '.question' ) || $this.find( '.question:not(.disabled)' ).length > 0 ||
                    // or-repeat-info is only considered a page by itself if it has no sibling repeats
                    // When there are siblings repeats, we use CSS trickery to show the + button underneath the last 
                    // repeat.
                    ( $this.is( '.or-repeat-info' ) && $this.siblings( '.or-repeat' ).length === 0 ) );
        } );
        this._updateToc();
    },
    _getPrev( currentIndex ) {
        return this.$activePages[ currentIndex - 1 ];
    },
    _getNext( currentIndex ) {
        return this.$activePages[ currentIndex + 1 ];
    },
    _getCurrentIndex() {
        return this.$activePages.index( this.$current );
    },
    /**
     * Changes the `pages.next()` function to return a `Promise`, wrapping one of the following values:
     *
     * @return {Promise} wrapping {boolean} or {number}.  If a {number}, this is the index into
     *         `$activePages` of the new current page; if a {boolean}, {false} means that validation
     *         failed, and {true} that validation passed, but the page did not change.
     */
    _next() {
        const that = this;
        let currentIndex;
        let validate;

        currentIndex = this._getCurrentIndex();
        validate = ( config.validatePage === false ) ? Promise.resolve( true ) : this.form.validateContent( this.$current );

        return validate
            .then( valid => {
                let next, newIndex;

                if ( !valid ) {
                    return false;
                }

                next = that._getNext( currentIndex );

                if ( next ) {
                    newIndex = currentIndex + 1;
                    that._flipTo( next, newIndex );
                    //return newIndex;
                }

                return true;
            } );
    },
    _prev() {
        const currentIndex = this._getCurrentIndex();
        const prev = this._getPrev( currentIndex );

        if ( prev ) {
            this._flipTo( prev, currentIndex - 1 );
        }
    },
    _setToCurrent( pageEl ) {
        const $n = $( pageEl );
        $n.addClass( 'current hidden' );
        this.$current = $n.removeClass( 'hidden' )
            .parentsUntil( '.or', '.or-group, .or-group-data, .or-repeat' ).addClass( 'contains-current' ).end();
    },
    _flipTo( pageEl, newIndex ) {
        // if there is a current page
        if ( this.$current.length > 0 && this.$current.closest( 'html' ).length === 1 ) {
            // if current page is not same as pageEl
            if ( this.$current[ 0 ] !== pageEl ) {
                this.$current.removeClass( 'current fade-out' ).parentsUntil( '.or', '.or-group, .or-group-data, .or-repeat' ).removeClass( 'contains-current' );
                this._setToCurrent( pageEl );
                this._focusOnFirstQuestion( pageEl );
                this._toggleButtons( newIndex );
                pageEl.dispatchEvent( events.PageFlip() );
            }
        } else {
            this._setToCurrent( pageEl );
            this._focusOnFirstQuestion( pageEl );
            this._toggleButtons( newIndex );
            pageEl.dispatchEvent( events.PageFlip() );
        }
    },
    _flipToFirst() {
        this._flipTo( this.$activePages[ 0 ] );
    },
    _flipToLast() {
        this._flipTo( this.$activePages.last()[ 0 ] );
    },

    _focusOnFirstQuestion( pageEl ) {
        //triggering fake focus in case element cannot be focused (if hidden by widget)
        $( pageEl )
            .find( '.question:not(.disabled)' )
            .addBack( '.question:not(.disabled)' )
            .filter( function() {
                return $( this ).parentsUntil( '.or', '.disabled' ).length === 0;
            } )
            .eq( 0 )
            .find( 'input, select, textarea' )
            .eq( 0 )
            .trigger( 'fakefocus' );

        pageEl.scrollIntoView();
    },
    _toggleButtons( index ) {
        const i = index || this._getCurrentIndex(),
            next = this._getNext( i ),
            prev = this._getPrev( i );
        this.$btnNext.add( this.$btnLast ).toggleClass( 'disabled', !next );
        this.$btnPrev.add( this.$btnFirst ).toggleClass( 'disabled', !prev );
        this.$formFooter.toggleClass( 'end', !next );
    },
    _updateToc() {
        if ( this.$toc.length ) {
            // regenerate complete ToC from first enabled question/group label of each page
            this.tocItems = this.$activePages.get()
                .filter( pageEl => !pageEl.classList.contains( 'or-repeat-info' ) )
                .map( ( pageEl, index ) => {
                    let tocItemText = `[${index + 1}]`;
                    const labelEl = pageEl.querySelector( '.question-label.active' );
                    if ( labelEl ) {
                        tocItemText = labelEl.textContent;
                    } else {
                        const hintEl = pageEl.querySelector( '.or-hint.active' );
                        if ( hintEl ) {
                            tocItemText = hintEl.textContent;
                        }
                    }
                    tocItemText = tocItemText.length > 20 ? `${tocItemText.substring(0,20)}...` : tocItemText;
                    return { pageEl, tocItemText };
                } );
            this.$toc.empty()[ 0 ].append( this._getTocHtmlFragment( this.tocItems ) );
            this.$toc.closest( '.pages-toc' ).removeClass( 'hide' );
        }
    },
    _getTocHtmlFragment( tocItems ) {
        const items = document.createDocumentFragment();
        tocItems.forEach( item => {
            const li = document.createElement( 'li' );
            const a = document.createElement( 'a' );
            a.setAttribute( 'href', `#${item.pageEl.querySelector( '[name]' ).getAttribute( 'name' )}` );
            a.textContent = item.tocItemText;
            li.append( a );
            items.appendChild( li );
        } );
        return items;
    }
};
