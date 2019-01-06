Events in Enketo Core
=======================

##### inputupdate.enketo
Fired on a form control when it is programmatically updated and when this results in a change in value

#### valuechange.enketo
Fired on a form control when it is updated directly by the user and when this results in a change in value

##### invalidated.enketo
Fired on a form control when it has failed constraint, datatype, or required validation. 

##### dataupdate
Fired on model.$events, when a single model value has changed its value, a repeat is added, or a node is removed. It passes an "update object".

##### dataupdate.enketo
Propagates the internal 'dataupdate' event by firing it on the form.or element.

##### removed
Fired on model.$events, when a node is removed. It passes an "update object".

##### removed.enketo
Propagates the internal 'removed' event by firing it on the form.or element.

##### gotohidden.enketo
Fired on form control when an attempt is made to 'go to' this field but it is hidden from view because it is irrelevant.

##### pageflip
Fired when user flips to a new page, on the page itself.
