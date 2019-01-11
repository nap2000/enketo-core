import Widget from '../../js/widget';
import { getSiblingElements } from '../../js/dom-utils';

import $ from 'jquery';

/**
 * Compact Picker. Hides text labels if a media label is present.
 */
class CompactPicker extends Widget {

    static get selector() {
        return '.or-appearance-compact, .or-appearance-quickcompact, [class*="or-appearance-compact-"]';
    }

    _init() {
        this.element.querySelectorAll( '.option-label' ).forEach( function( optionLabel ) {
            if ( getSiblingElements( optionLabel, 'img, video, audio' ).length > 0 ) {
                optionLabel.style.display = 'none';
            }
        } );
        $( this.element ).find( '.itemset-template' ).each( function() {        // smap hide the itemset template
            $( this ).css( 'display', 'none' );
        });
    }

}

export default CompactPicker;
