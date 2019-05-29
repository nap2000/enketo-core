/**
 * Simple file manager with cross-browser support. That uses the FileReader
 * to create previews. Can be replaced with a more advanced version that
 * obtains files from storage.
 *
 * The replacement should support the same public methods and return the same
 * types.
 */

import $ from 'jquery';

import { getFilename, dataUriToBlobSync } from './utils';
import fileStore from '../../webform/file-storage';
import { t } from 'enketo/translator';

const fileManager = {};

var supported = typeof FileReader !== 'undefined',
    notSupportedAdvisoryMsg = '';

/**
 * Initialize the file manager .
 * @return {[type]} promise boolean or rejection with Error
 */
fileManager.init = () => Promise.resolve( true );

/**
 * Whether the filemanager is waiting for user permissions
 * @return {Boolean} [description]
 */
fileManager.isWaitingForPermissions = () => false;

/**
 * Obtains a URL that can be used to show a preview of the file when used
 * as a src attribute.
 *
 * It is meant for media previews and media downloads.
 *
 * @param  {?string|Object} subject File or filename in local storage
 * @return {[type]}         promise url string or rejection with Error
 */
fileManager.getFileUrl = subject => new Promise( ( resolve, reject ) => {
    let error;

    if ( !subject ) {

        resolve( null );

    } else if ( typeof subject === 'string' ) {
	    if(subject.startsWith('http')) {                        // some random URL
		    resolve(subject);
	    } else if(fileStore.isSupported()) {
	        var dirname = "/" + window.gLoadedInstanceID;
            var url = fileStore.getFile(subject, dirname);
            if(url) {
                resolve(url);
            } else {
                resolve(location.origin + "/" + subject);		// URL must be from the server
            }
        }


    } else if ( typeof subject === 'object' ) {

	    if ( subject.type.startsWith("image") || subject.type.startsWith("audio")
		        || subject.type.startsWith("video") ) {

		    if (fileManager.isTooLarge(subject)) {
			    error = new Error(t('filepicker.toolargeerror', {maxSize: fileManager.getMaxSizeReadable()}));
			    reject(error);
		    } else {
			    resolve(URL.createObjectURL(subject));
		    }
	    } else {
	    	resolve( null );
	    }

    } else {

        reject( new Error( 'Unknown error occurred' ) );

    }
} );

/**
 * Similar to getFileURL, except that this one is guaranteed to return an objectURL
 *
 * It is meant for loading images into a canvas.
 *
 * @param  {?string|Object} subject File or filename in local storage
 * @return {[type]}         promise url string or rejection with Error
 */
fileManager.getObjectUrl = subject => fileManager.getFileUrl( subject )
    .then( url => {
        if ( /https?:\/\//.test( url ) ) {
            return fileManager.urlToBlob( url ).then( URL.createObjectURL );
        }
        return url;
    } );

fileManager.urlToBlob = url => {
    const xhr = new XMLHttpRequest();

    return new Promise( resolve => {
        xhr.open( 'GET', url );
        xhr.responseType = 'blob';
        xhr.onload = () => {
            resolve( xhr.response );
        };
        xhr.send();
    } );
};

/**
 * Obtain files currently stored in file input elements of open record
 * @return {[File]} array of files
 */
fileManager.getCurrentFiles = () => {
    const files = [];

    // Get any files inside file input elements or text input elements for drawings.
    $( 'form.or' ).find( 'input[type="file"]:not(.ignore), input[type="text"][data-drawing="true"]' ).each( function() {
        let newFilename;
        let file = null;
        let canvas = null;
        if ( this.type === 'file' ) {
            file = this.files[ 0 ]; // Why doesn't this fail for empty file inputs?
        } else if ( this.value ) {
            canvas = $( this ).closest( '.question' )[ 0 ].querySelector( '.draw-widget canvas' );
            if ( canvas ) {
                // TODO: In the future, we could simply do canvas.toBlob() instead
                file = dataUriToBlobSync( canvas.toDataURL() );
                file.name = this.value;
            }
        }

        if ( file && file.name ) {
            // Correct file names by adding a unique-ish postfix
            // First create a clone, because the name property is immutable
            // TODO: in the future, when browser support increase we can invoke
            // the File constructor to do this.
            newFilename = getFilename( file, this.dataset.filenamePostfix );
            file = new Blob( [ file ], {
                type: file.type
            } );

            file.name = newFilename;

            files.push( file );
        }
    } );
    return files;
};

/**
 * Placeholder function to check if file size is acceptable.
 *
 * @param  {Blob}  file [description]
 * @return {Boolean}      [description]
 */
fileManager.isTooLarge = () => false;

/**
 * Replace with function that determines max size published in OpenRosa server response header.
 */
fileManager.getMaxSizeReadable = () => `${5}MB`;

/*
 * Convert object to data url
 */
fileManager.getDataUrl = function( subject ) {
	var error, reader;

	return new Promise( resolve => {
		if ( !subject ) {
			resolve( null );
		} else if ( typeof subject === 'object' ) {

			reader = new FileReader();
			reader.onload = function( e ) {
				resolve( e.target.result );
			};
			reader.onerror = function( e ) {
				reject( error );
			};
			reader.readAsDataURL( subject );

		} else {
			reject( new Error( 'Unknown error occurred' ) );
		}
	} );

}


export default fileManager;
