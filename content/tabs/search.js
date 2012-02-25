/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/popupMenu",
    "lib/trace",
],
function(Domplate, Lib, Menu, FBTrace) { with (Domplate) {

// ********************************************************************************************* //
// Search

// Module object
var Search = {};

// ********************************************************************************************* //
// Search Box

Search.Box = domplate(
{
    tag:
        SPAN({"class": "searchBox"},
            SPAN({"class": "searchTextBox"},
                INPUT({"class": "searchInput", type: "text", placeholder: "Search",
                    onkeydown: "$onKeyDown"}
                ),
                SPAN({"class": "arrow", onclick: "$onOpenOptions"},
                    "&nbsp;"
                )
            )
        ),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Events

    onKeyDown: function(event)
    {
        var tab = Lib.getAncestorByClass(event.target, "tabBody");
        var searchInput = Lib.getElementByClass(tab, "searchInput");
        setTimeout(Lib.bindFixed(this.search, this, tab, event.keyCode, searchInput.value));
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Implementation

    initialize: function(element)
    {
        //var searchInput = Lib.getElementByClass(element, "searchInput");
        //var resizer = Lib.getElementByClass(element, "resizer");
        //Search.Resizer.initialize(searchInput, resizer);
    },

    search: function(tab, keyCode, prevText)
    {
        var searchBox = Lib.getElementByClass(tab, "searchBox");
        var searchInput = Lib.getElementByClass(tab, "searchInput");
        searchInput.removeAttribute("status");

        var text = searchInput.value;

        // Support for incremental search, changing the text also causes search.
        if (text == prevText && keyCode != 13)
            return;

        // The search input box looses focus if something is selected on the page
        // So, switch off the incremental search for webkit (works only on Enter)
        if (keyCode != 13)
            return;

        var result = tab.repObject.onSearch(text, keyCode);

        // Red background if there is no match.
        if (!result && text)
            searchInput.setAttribute("status", "notfound");
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Options

    onOpenOptions: function(event)
    {
        var e = Lib.fixEvent(event);
        Lib.cancelEvent(event);

        if (!Lib.isLeftClick(event))
            return;

        var target = e.target;
        var element = Lib.getAncestorByClass(target, "searchBox");
        if (element.getAttribute("disabled") == "true")
            return;

        var items = this.getMenuItems(target);
        if (!items)
            return;

        // Finally, display the the popup menu.
        // xxxHonza: the old <DIV> can be still visible.
        var menu = new Menu({id: "searchOptions", items: items});
        menu.showPopup(target);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Menu Definition

    getMenuItems: function(target)
    {
        var tab = Lib.getAncestorByClass(target, "tabBody");
        var items = tab.repObject.getSearchOptions();
        return items;
    },

    onOption: function(name)
    {
        Cookies.toggleCookie(name);

        var searchInput = Lib.getElementByClass(document.documentElement, "searchInput");
        searchInput.removeAttribute("status");
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

    doSearch: function(text, tab)
    {
        var searchInput = Lib.getElementByClass(tab, "searchInput");
        searchInput.value = text;

        setTimeout(Lib.bindFixed(this.search, this, tab, 13, text));
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // State

    enable: function(element)
    {
        element.removeAttribute("disabled");

        var searchInput = Lib.getElementByClass(element, "searchInput");
        searchInput.removeAttribute("disabled");
    },

    disable: function(element)
    {
        element.setAttribute("disabled", "true");

        var searchInput = Lib.getElementByClass(element, "searchInput");
        searchInput.setAttribute("disabled", "true");
    },

    /**
     * Returns the current search string.
     */
    getValue: function(element)
    {
        var searchInput = Lib.getElementByClass(element, "searchInput");
        return searchInput.value;
    }
});

// ********************************************************************************************* //

return Search;

// ********************************************************************************************* //
}});
