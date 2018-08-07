'use strict';

/**
 * Repeats module.
 * 
 * Two important concepts are used:
 * 1. The first XLST-added repeat view is cloned to serve as a template of that repeat.
 * 2. Each repeat series has a sibling .or-repeat-info element that stores info that is relevant to that series.
 *
 * Note that with nested repeats you may have many more series of repeats than templates, because a nested repeat
 * may have multiple series.
 */

var $ = require( 'jquery' );
var config = require( 'enketo/config' );
var disableFirstRepeatRemoval = config.repeatOrdinals === true;

module.exports = {
    /**
     * Initializes all Repeat Groups in form (only called once).
     * @param  {Form} form the parent form object
     */
    init: function() {
        var that = this;
        var $repeatInfos;

        if ( !this.form ) {
            throw new Error( 'Repeat module not correctly instantiated with form property.' );
        }

        $repeatInfos = this.form.view.$.find( '.or-repeat-info' );
        this.templates = {};
        // Add repeat numbering elements, if repeat has form controls (not just calculations)
        $repeatInfos.siblings( '.or-repeat' )
            .filter( function() {
                // remove whitespace so we can use :empty css selector
                if ( this.firstChild && this.firstChild.nodeType === 3 ) {
                    this.firstChild.textContent = '';
                }
                return !!this.querySelector( '.question' );
            } )
            .prepend( '<span class="repeat-number"></span>' );
        // Add repeat buttons
        $repeatInfos.filter( '*:not([data-repeat-fixed]):not([data-repeat-count])' )
            .append( '<button type="button" class="btn btn-default add-repeat-btn"><i class="icon icon-plus"> </i></button>' )
            .siblings( '.or-repeat' )
            .append( '<div class="repeat-buttons">' +
                '<button type="button" ' + ( disableFirstRepeatRemoval ? ' disabled ' : ' ' ) +
                'class="btn btn-default remove"><i class="icon icon-minus"> </i></button></div>' );
        /**
         * The model also requires storing repeat templates for repeats that do not have a jr:template.
         * Since the model has no knowledge of which node is a repeat, we direct this here.
         */
        this.form.model.extractFakeTemplates( $repeatInfos.map( function() {
            return this.dataset.name;
        } ).get() );

        /**
         * Clone all repeats to serve as templates
         * in reverse document order to properly deal with nested repeat templates
         *
         * Widgets not yet initialized. Values not yet set.
         */
        $repeatInfos.siblings( '.or-repeat' ).reverse().each( function() {
            var $templateEl = $( this ).remove();
            var xPath = $templateEl.attr( 'name' );
            that.templates[ xPath ] = $templateEl[ 0 ];
        } );

        $repeatInfos.filter( '*:not([data-repeat-count])' ).reverse()
            .each( function() {
                // don't do nested repeats here, they will be dealt with recursively
                if ( !$( this ).closest( '.or-repeat' ).length ) {
                    that.updateDefaultFirstRepeatInstance( null, this );
                }
            } )
            // If there is no repeat-count attribute, check how many repeat instances 
            // are in the model, and update view if necessary.
            .each( that.updateViewInstancesFromModel.bind( this ) );

        // delegated handlers (strictly speaking not required, but checked for doubling of events -> OK)
        this.form.view.$.on( 'click', 'button.add-repeat-btn:enabled', function() {
            // Create a clone
            that.add( $( this ).closest( '.or-repeat-info' )[ 0 ] );
            // Prevent default
            return false;
        } );
        this.form.view.$.on( 'click', 'button.remove:enabled', function() {
            //remove clone
            that.remove( $( this ).closest( '.or-repeat' ) );
            //prevent default
            return false;
        } );

        this.countUpdate();
    },
    /**
     * [updateViewInstancesFromModel description]
     * @param  {[type]} idx           not used but part of jQuery.each
     * @param   {Element} repeatInfo  repeatInfo element
     * @return {[type]}            [description]
     */
    updateViewInstancesFromModel: function( idx, repeatInfo ) {
        var that = this;
        var $repeatInfo = $( repeatInfo );
        var repeatPath = repeatInfo.dataset.name;
        // All we need is to find out in which series we are.
        var repeatSeriesIndex = this.form.view.$.find( '.or-repeat-info[data-name="' + repeatPath + '"]' ).index( repeatInfo );
        var repInModelSeries = this.form.model.getRepeatSeries( repeatPath, repeatSeriesIndex );
        var repInViewSeries = $repeatInfo.siblings( '.or-repeat' );
        // First rep is already included (by XSLT transformation)
        if ( repInModelSeries.length > repInViewSeries.length ) {
            this.add( repeatInfo, repInModelSeries.length - repInViewSeries.length );
            // Now check the repeat counts of all the descendants of this repeat and its new siblings
            // Note: not tested with triple-nested repeats, but probably taking the better safe-than-sorry approach,
            // so should be okay except for performance.
            $repeatInfo.siblings( '.or-repeat' )
                .find( '.or-repeat-info:not([data-repeat-count])' )
                .each( function() {
                    that.updateViewInstancesFromModel( null, this );
                } );
        }
        return repInModelSeries.length;
    },
    /**
     * [updateDefaultFirstRepeatInstance description]
     * @param  {[type]} idx             not use but part of jQeury.each
     * @param   {Element} repeatInfo    repeatInfo element
     * @return {[type]}            [description]
     */
    updateDefaultFirstRepeatInstance: function( idx, repeatInfo ) {
        var repeatSeriesIndex;
        var repeatSeriesInModel;
        var that = this;
        var $repeatInfo = $( repeatInfo );
        var repeatPath = repeatInfo.dataset.name;
        if ( !that.form.model.data.instanceStr && !this.templates[ repeatPath ].classList.contains( 'or-appearance-minimal' ) ) {
            repeatSeriesIndex = this.form.view.$.find( '.or-repeat-info[data-name="' + repeatPath + '"]' ).index( repeatInfo );
            repeatSeriesInModel = this.form.model.getRepeatSeries( repeatPath, repeatSeriesIndex );
            if ( repeatSeriesInModel.length === 0 ) {
                // explicitly provide a count, so that byCountUpdate is passed to the addrepeat event
                this.add( repeatInfo, 1 );
            }
            $repeatInfo.siblings( '.or-repeat' )
                .find( '.or-repeat-info:not([data-repeat-count])' )
                .each( that.updateDefaultFirstRepeatInstance.bind( that ) );
        }
    },
    /**
     * [updateRepeatInstancesFromCount description]
     * @param  {[type]} idx             not use but part of jQeury.each
     * @param   {Element} repeatInfo repeatInfo element
     * @return {[type]}            [description]
     */
    updateRepeatInstancesFromCount: function( idx, repeatInfo ) {
        var that = this;
        var $last;
        var repCountNodes;
        var numRepsInCount;
        var numRepsInView;
        var toCreate;
        var repPath;
        var repIndex;
        var $repeatInfo = $( repeatInfo );
        var repCountPath = repeatInfo.dataset.repeatCount || '';

        if ( !repCountPath ) {
            return;
        }

        /*
         * We cannot pass a context to model.evaluate() if the number or repeats in a series is zero.
         * However, but we do still need a context for nested repeats where the count of the nested repeat
         * is determined in a node inside the parent repeat. To do so we use this method:
         *
         * 1. determine the index from the view (always 0 for not-nested-repeats)
         * 2. obtain ALL repCount nodes from the model
         * 3. select the correct node from the result array
         * 
         */
        repPath = repeatInfo.dataset.name;
        repIndex = this.form.view.$.find( '.or-repeat-info[data-name="' + repPath + '"]' ).index( repeatInfo );
        repCountNodes = this.form.model.evaluate( repCountPath, 'nodes', null, null, true );

        if ( repCountNodes.length && repCountNodes[ repIndex ] ) {
            numRepsInCount = Number( repCountNodes[ repIndex ].textContent );
        } else {
            console.error( 'Unexpectedly, could not obtain repeat count node' );
        }

        numRepsInCount = isNaN( numRepsInCount ) ? 0 : numRepsInCount;
        numRepsInView = $repeatInfo.siblings( '.or-repeat[name="' + repPath + '"]' ).length;
        toCreate = numRepsInCount - numRepsInView;

        if ( toCreate > 0 ) {
            that.add( repeatInfo, toCreate );
        } else if ( toCreate < 0 ) {
            toCreate = Math.abs( toCreate ) >= numRepsInView ? -numRepsInView + ( disableFirstRepeatRemoval ? 1 : 0 ) : toCreate;
            for ( ; toCreate < 0; toCreate++ ) {
                $last = $repeatInfo.siblings( '.or-repeat' ).last();
                this.remove( $last, 0 );
            }
        }
        // Now check the repeat counts of all the descendants of this repeat and its new siblings, level-by-level.
        // TODO: this does not find .or-repeat > .or-repeat (= unusual syntax)
        $repeatInfo.siblings( '.or-repeat' )
            .children( '.or-group, .or-group-data' )
            .children( '.or-repeat-info[data-repeat-count]' )
            .each( that.updateRepeatInstancesFromCount.bind( that ) );
    },
    /**
     * Checks whether repeat count value has been updated and updates repeat instances
     * accordingly.
     * 
     * @param  {[type]} updated [description]
     * @return {[type]}         [description]
     */
    countUpdate: function( updated ) {
        var $repeatInfos;
        updated = updated || {};
        $repeatInfos = this.form.getRelatedNodes( 'data-repeat-count', '.or-repeat-info', updated );
        $repeatInfos.each( this.updateRepeatInstancesFromCount.bind( this ) );
    },
    /**s
     * clone a repeat group/node
     * @param   {Element} repeatInfo repeatInfo element
     * @param   {number=} count number of clones to create
     * @return  {boolean}       [description]
     */
    add: function( repeatInfo, count ) {
        var $repeats;
        var $clone;
        var repeatIndex;
        var repeatSeriesIndex;
        var repeatPath;
        var i;
        var that = this;
        var $repeatInfo = $( repeatInfo );
        var byCountUpdate = !!count;
        var modelRepeatSeriesLength;

        count = count || 1;

        if ( !repeatInfo ) {
            console.error( 'Nothing to clone' );
            return false;
        }

        repeatPath = repeatInfo.dataset.name;
        $repeats = $repeatInfo.siblings( '.or-repeat' );

        $clone = $( this.templates[ repeatPath ] ).clone();

        // Determine the index of the repeat series.
        repeatSeriesIndex = this.form.view.$.find( '.or-repeat-info[data-name="' + repeatPath + '"]' ).index( repeatInfo );
        modelRepeatSeriesLength = this.form.model.getRepeatSeries( repeatPath, repeatSeriesIndex ).length;

        // Add required number of repeats
        for ( i = 0; i < count; i++ ) {
            // Fix names of radio button groups
            $clone.find( '.option-wrapper' ).each( this.fixRadioNames );
            $clone.find( 'datalist' ).each( this.fixDatalistIds );
            // Insert the clone
            $clone.insertBefore( repeatInfo );

            if ( $clone.prev( '.or-repeat' ).length ) {
                // Also add the clone class for all 2+ numbers as this is
                // used for performance optimization in several places.
                $clone.addClass( 'clone' );
            }
            // Update the variable containing the view repeats in the current series.
            $repeats = $repeats.add( $clone );

            // Create a repeat in the model if it doesn't already exist
            if ( $repeats.length > modelRepeatSeriesLength ) {
                this.form.model.addRepeat( repeatPath, repeatSeriesIndex );
                modelRepeatSeriesLength++;
            }
            // This is the index of the new repeat in relation to all other repeats of the same name,
            // even if they are in different series.
            repeatIndex = repeatIndex || this.form.view.$.find( '.or-repeat[name="' + repeatPath + '"]' ).index( $clone );
            // This will trigger setting default values and automatic page flips.
            $clone.trigger( 'addrepeat', [ repeatIndex, byCountUpdate ] );
            // Initialize widgets in clone after default values have been set
            if ( this.form.widgetsInitialized ) {
                this.form.widgets.init( $clone );
            } else {
                // Upon inital formload the eventhandlers for calculated items have not yet been set.
                // Calculations have already been initialized before the repeat clone(s) were created.
                // Therefore, we manually trigger a calculation update for the cloned repeat.
                that.form.calc.update( {
                    repeatPath: repeatPath,
                    repeatIndex: repeatIndex
                } );
            }
            // now create the first instance of any nested repeats if necessary
            $clone.find( '.or-repeat-info:not([data-repeat-count])' ).each( this.updateDefaultFirstRepeatInstance.bind( this ) );

            $clone = $( this.templates[ repeatPath ] ).clone();

            repeatIndex++;
        }

        // number the repeats
        this.numberRepeats( repeatInfo );
        // enable or disable + and - buttons
        this.toggleButtons( repeatInfo );

        return true;
    },
    remove: function( $repeat, delay ) {
        var that = this;
        var $next = $repeat.next( '.or-repeat, .or-repeat-info' );
        var repeatPath = $repeat.attr( 'name' );
        var repeatIndex = this.form.view.$.find( '.or-repeat[name="' + repeatPath + '"]' ).index( $repeat );
        var repeatInfo = $repeat.siblings( '.or-repeat-info' )[ 0 ];

        delay = typeof delay !== 'undefined' ? delay : 600;

        $repeat.hide( delay, function() {
            $repeat.remove();
            that.numberRepeats( repeatInfo );
            that.toggleButtons( repeatInfo );
            // Trigger the removerepeat on the next repeat or repeat-info(always present)
            // so that removerepeat handlers know where the repeat was removed
            $next.trigger( 'removerepeat' );
            // Now remove the data node
            that.form.model.node( repeatPath, repeatIndex ).remove();
        } );
    },
    fixRadioNames: function( index, element ) {
        $( element ).find( 'input[type="radio"]' )
            .attr( 'name', Math.floor( ( Math.random() * 10000000 ) + 1 ) );
    },
    fixDatalistIds: function( index, element ) {
        var newId = element.id + Math.floor( ( Math.random() * 10000000 ) + 1 );
        element.parentNode.querySelector( 'input[list="' + element.id + '"]' ).setAttribute( 'list', newId );
        element.id = newId;
    },
    toggleButtons: function( repeatInfo ) {
        $( repeatInfo )
            .siblings( '.or-repeat' )
            .children( '.repeat-buttons' )
            .find( 'button.remove' )
            .prop( 'disabled', false )
            .first()
            .prop( 'disabled', disableFirstRepeatRemoval );
    },
    numberRepeats: function( repeatInfo ) {
        $( repeatInfo )
            .siblings( '.or-repeat' )
            .each( function( idx, repeat ) {
                $( repeat ).children( '.repeat-number' ).text( idx + 1 );
            } );
    }
};
