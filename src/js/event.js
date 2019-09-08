/**
 * @module event
 */
// TODO: add second "propagate" parameter to constructors to add .enketo namespace to event.

/**
 * Data update event.
 *
 * @static
 * @param {*} detail - Data to be passed with event
 * @return {CustomEvent} Custom "dataupdate" event
 */
function DataUpdate( detail ) {
    return new CustomEvent( 'dataupdate', { detail } );
}

/**
 * Fake focus event.
 *
 * @return {CustomEvent} Custom "fakefocus" event (bubbling)
 */
function FakeFocus() {
    return new CustomEvent( 'fakefocus', { bubbles: true } );
}

/**
 * Apply focus event.
 *
 * @return {CustomEvent} Custom "applyfocus" event
 */
function ApplyFocus() {
    return new CustomEvent( 'applyfocus' );
}

/**
 * Page flip event.
 *
 * @return {CustomEvent} Custom "pageflip" event (bubbling)
 */
function PageFlip() {
    return new CustomEvent( 'pageflip', { bubbles: true } );
}

/**
 * Removed event.
 *
 * @param {*} detail - Data to be passed with event
 * @return {CustomEvent} Custom "removed" event (bubbling)
 */
function Removed( detail ) {
    return new CustomEvent( 'removed', { detail, bubbles: true } );
}

/**
 * Add repeat event.
 *
 * @param {*} detail - Data to be passed with event
 * @return {CustomEvent} Custom "addrepeat" event (bubbling)
 */
function AddRepeat( detail ) {
    return new CustomEvent( 'addrepeat', { detail, bubbles: true } );
}

/**
 * Remove repeat event.
 *
 * @return {CustomEvent} Custom "removerepeat" event (bubbling)
 */
function RemoveRepeat() {
    return new CustomEvent( 'removerepeat', { bubbles: true } );
}

/**
 * Change language event.
 *
 * @return {CustomEvent} Custom "changelanguage" event (bubbling)
 */
function ChangeLanguage() {
    return new CustomEvent( 'changelanguage', { bubbles: true } );
}

/**
 * Change event.
 *
 * @return {Event} "change" event (bubbling)
 */
function Change() {
    return new Event( 'change', { bubbles: true } );
}

/**
 * Input event.
 *
 * @return {Event} "input" event (bubbling)
 */
function Input() {
    return new Event( 'input', { bubbles: true } );
}

/**
 * Input update event.
 *
 * @return {CustomEvent} Custom "inputupdate" event (bubbling)
 */
function InputUpdate() {
    return new CustomEvent( 'inputupdate', { bubbles: true } );
}

/**
 * Edited event.
 *
 * @return {CustomEvent} Custom "edited" event (bubbling)
 */
function Edited() {
    return new CustomEvent( 'edited', { bubbles: true } );
}

/**
 * Validation complete event.
 *
 * @return {CustomEvent} Custom "validationcomplete" event (bubbling)
 */
function ValidationComplete() {
    return new CustomEvent( 'validationcomplete', { bubbles: true } );
}

/**
 * Invalidated event.
 *
 * @return {CustomEvent} Custom "invalidated" event (bubbling)
 */
function Invalidated() {
    return new CustomEvent( 'invalidated', { bubbles: true } );
}

/**
 * Progress update event.
 *
 * @param {*} detail - Data to be passed with event
 * @return {CustomEvent} Custom "progressupdate" event (bubbling)
 */
function ProgressUpdate( detail ) {
    return new CustomEvent( 'progressupdate', { detail, bubbles: true } );
}

/**
 * Go to hidden event.
 *
 * @return {CustomEvent} Custom "gotohidden" event (bubbling)
 */
function GoToHidden() {
    return new CustomEvent( 'gotohidden', { bubbles: true } );
}

export default {
    DataUpdate,
    FakeFocus,
    ApplyFocus,
    PageFlip,
    Removed,
    AddRepeat,
    RemoveRepeat,
    ChangeLanguage,
    Change,
    Input,
    InputUpdate,
    Edited,
    ValidationComplete,
    Invalidated,
    ProgressUpdate,
    GoToHidden
};
