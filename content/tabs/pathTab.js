/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/trace",
    "tabs/baseTab",
    "lib/options",
    "app/objectTree",
    "app/objectGraphPathFinder",
    "app/objectTableView"
],

function(Domplate, Lib, FBTrace, BaseTab, Options, ObjectTree, ObjectGraphPathFinder,
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
    // Templates

    noPath:
        SPAN("No path found"),

    progressToolbarItem:
        SPAN({"class": "progressLabel toolbarButton", title: "Calculating the shortest path"}),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Content

    onUpdateBody: function(tabView, body)
    {
        BaseTab.prototype.onUpdateBody.apply(this, arguments);

        var content = body.querySelector(".tabContent");
        if (!tabView.selection)
        {
            this.noSelection.replace({}, content);
            return;
        }

        var self = this;
        var searchId = this.tabView.analyzer.getSearchId();
        var visitedId = this.tabView.analyzer.getSearchId();

        this.toolbar.setButtonText("progress", "Calculation in progress... ");
        this.toolbar.showButton("progress");

        // Calculate the shortest path from the the root to the object
        // (based on Dijkstra's algorithm). The calculation can take some time so,
        // it's done asynchronously.
        var pathFinder = new ObjectGraphPathFinder(searchId, visitedId);
        pathFinder.findPath(tabView.selection, tabView.input.object,
        {
            onProgress: function(progress)
            {
                var text = Math.round(progress*100)/100 + " %";
                self.toolbar.setButtonText("progress", "Calculation in progress... " + text);
            },

            onFinished: function(path)
            {
                self.toolbar.hideButton("progress");
                self.renderPath(content, path);
            }
        });
    },

    renderPath: function(parentNode, path)
    {
        Lib.eraseNode(parentNode);

        if (Lib.hasProperties(path))
        {
            // Render objects as a table.
            var table = new ObjectTableView();
            table.render(parentNode, path);
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
        var buttons = [];
        buttons.push({
            id: "progress",
            tag: this.progressToolbarItem
        });
        return buttons;
    },
});

// ********************************************************************************************* //

return PathTab;

// ********************************************************************************************* //
}});
