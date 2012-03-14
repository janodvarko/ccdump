/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/trace",
    "tabs/baseTab",
    "lib/options",
    "app/objectTree",
    "app/objectGraphGenerator",
    "app/objectTableView"
],

function(Domplate, Lib, FBTrace, BaseTab, Options, ObjectTree, ObjectGraphGenerator,
    ObjectTableView) {
with (Domplate) {

// ********************************************************************************************* //
// Home Tab

function PathTab()
{
}

PathTab.prototype = Lib.extend(BaseTab.prototype,
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Tab

    id: "Path",
    label: "Path",

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Content

    noPath:
        SPAN("No path found"),

    onUpdateBody: function(tabView, body)
    {
        BaseTab.prototype.onUpdateBody.apply(this, arguments);

        var content = body.querySelector(".tabContent");
        if (!tabView.selection)
        {
            this.noSelection.replace({}, content);
            return;
        }

        var searchId = this.tabView.analyzer.getSearchId();
        var generator = new ObjectGraphGenerator(searchId);
        this.path = generator.findPath(tabView.selection, tabView.input.object);

        this.renderPath(content);
    },

    renderPath: function(parentNode)
    {
        Lib.eraseNode(parentNode);

        if (Lib.hasProperties(this.path))
        {
            // Render objects as a table.
            var table = new ObjectTableView();
            table.render(parentNode, this.path);
        }
        else
        {
            this.noPath.replace({}, parentNode);
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Toolbar

    getToolbarButtons: function()
    {
        // No search box in this tab
        return [];
    },
});

// ********************************************************************************************* //

return PathTab;

// ********************************************************************************************* //
}});
