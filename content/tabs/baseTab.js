/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/trace",
    "lib/tabView",
    "lib/toolbar",
    "lib/options",
    "tabs/search",
],

function(Domplate, Lib, FBTrace, TabView, Toolbar, Options, Search) {
with (Domplate) {

// ********************************************************************************************* //
// Home Tab

function BaseTab()
{
}

BaseTab.prototype = Lib.extend(TabView.Tab.prototype,
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Tab

    bodyTag:
        DIV({"class": ""},
            DIV({"class": "tabToolbar"}),
            DIV({"class": "tabContent"})
        ),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Content

    onUpdateBody: function(tabView, body)
    {
        this.toolbar = new Toolbar();

        // Initialize toolbar.
        this.toolbar.addButtons(this.getToolbarButtons());
        this.toolbar.render(body.querySelector(".tabToolbar"));
    },

    getTabContent: function()
    {
        return this._body.querySelector(".tabContent");
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Toolbar

    getToolbarButtons: function()
    {
        var buttons = [];

        buttons.push({
            id: "search",
            tag: Search.Box.tag,
            initialize: Search.Box.initialize,
            disable: Search.Box.disable,
            enable: Search.Box.enable
        });

        return buttons;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Search

    onSearch: function(text, keyCode)
    {
        // TODO: implement in derived tabs.
    },

    getSearchOptions: function()
    {
        var items = [];

        items.push("-");
        items.push({
            label: "Clear Search Results",
            command: Lib.bindFixed(this.doSearch, this, "")
        });
        items.push({
            label: "Case Sensitive",
            checked: Options.getPref("search.caseSensitive"),
            command: Lib.bindFixed(this.onOption, this, "search.caseSensitive")
        });
        items.push({
            label: "Use Regular Expressions",
            checked: Options.getPref("search.useRegExp"),
            command: Lib.bindFixed(this.onOption, this, "search.useRegExp")
        });
        items.push("-");
        items.push({
            label: "Table Layout",
            checked: Options.getPref("search.tableLayout"),
            command: Lib.bindFixed(this.onOption, this, "search.tableLayout")
        });

        return items;
    },

    onOption: function(name)
    {
        Options.tooglePref(name);
    },

    getSearchBox: function()
    {
        return Lib.getElementByClass(this._body, "searchBox");
    }
});

// ********************************************************************************************* //

return BaseTab;

// ********************************************************************************************* //
}});
