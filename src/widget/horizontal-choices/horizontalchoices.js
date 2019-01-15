import Widget from '../../js/widget';

/**
 * Horizontal Choices Widgets. Adds a filler if the last row contains two elements.
 * The filler avoids the last radiobutton or checkbox to not be lined up correctly below the second column.
 */
class HorizontalChoices extends Widget {

    static get selector() {
        return '.or-appearance-horizontal';
    }

    _init() {
        this.element.querySelectorAll( '.option-wrapper' ).forEach( wrapper => {
            const COLUMNS = 3;

            //let fillers = COLUMNS - wrapper.querySelectorAll( 'label' ).not( '.itemset-template' ).length % COLUMNS;   // smap exclude template
	        let fillers = COLUMNS - wrapper.querySelectorAll( 'label' ).length % COLUMNS;

            while ( fillers < COLUMNS && fillers > 0 ) {
                wrapper.append( document.createRange().createContextualFragment( '<label class="filler"></label>' ) );
                fillers--;
            }
            // if added to correct question type, add initialized class
            this.question.classList.add( 'or-horizontal-initialized' );
        } );
    }
}

export default HorizontalChoices;
