/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/domTree",
    "lib/trace",
],
function(Domplate, Lib, DomTree, FBTrace) { with (Domplate) {

// ********************************************************************************************* //

var ObjectLink = domplate(DomTree.Reps.Link,
{
    className: "ccLink",

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Event Handlers

    onClick: function(event)
    {
        Lib.cancelEvent(event);

        // Fire navigate event. It's processed by {@link TabNavigator}.
        Lib.fireEvent(event.target, "navigate", {
            type: "tabs/detailsTab",
            selection: this.getRepObject(event.target)
        });
    },
});

// ********************************************************************************************* //

return ObjectLink;

// ********************************************************************************************* //
}});
