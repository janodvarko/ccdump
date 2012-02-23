/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/domTree",
    "lib/trace",
],
function(Domplate, Lib, DomTree, FBTrace) { with (Domplate) {

// ********************************************************************************************* //

var ObjectLink = domplate(DomTree.Rep,
{
    className: "ccLink",

    tag:
        OBJECTLINK({href: "$object|getTargetUrl", onclick: "$onClick"}, "$object|getTitle"),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Event Handlers

    onClick: function(event)
    {
        Lib.cancelEvent(event);

        // Fire navigate event. It's processed by the main application object (tabView).
        Lib.fireEvent(event.target, "navigate", {
            type: "details",
            selection: this.getRepObject(event.target)
        });
    },

    getTargetUrl: function(object)
    {
        return object + "";
    },
});

// ********************************************************************************************* //

return ObjectLink;

// ********************************************************************************************* //
}});
