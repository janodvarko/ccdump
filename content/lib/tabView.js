/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/trace"
],

function(Domplate, Lib, FBTrace) { with (Domplate) {

//*************************************************************************************************

/**
 * @domplate TabViewTempl is a template used by {@link TabView} widget.
 */
var TabViewTempl = domplate(
/** @lends TabViewTempl */
{
    tag:
        TABLE({"class": "tabView", cellpadding: 0, cellspacing: 0,
            _repObject: "$tabView"},
            TBODY(
                TR({"class": "tabViewRow"},
                    TD({"class": "tabViewCol", valign: "top"},
                        TAG("$tabList", {tabView: "$tabView"})
                    )
                )
            )
        ),

    tabList:
        DIV({"class": "tabViewBody", onclick: "$onClickTab"},
            DIV({"class": "$tabView.id\\Bar tabBar"}),
            DIV({"class": "$tabView.id\\Bodies tabBodies"})
        ),

    tabHeaderTag:
        A({"class": "$tab.id\\Tab tab",
            view: "$tab.id", _repObject: "$tab"},
            "$tab.label"
        ),

    tabBodyTag:
        DIV({"class": "tab$tab.id\\Body tabBody", _repObject: "$tab"}),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Event Handlers

    hideTab: function(context)
    {
        return false;
    },

    onClickTab: function(event)
    {
        var e = Lib.fixEvent(event);
        var tabView = this.getTabView(e.target);
        tabView.onClickTab(e);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Coupling with TabView instance.

    getTabView: function(node)
    {
        var tabView = Lib.getAncestorByClass(node, "tabView");
        if (tabView)
            return tabView.repObject;
    }
});

//*************************************************************************************************

function TabView(id)
{
    this.id = id;
    this.tabs = [];
    this.listeners = [];
    this.tabBarVisibility = true;
}

/**
 * @widget TabView represents a widget for tabbed UI interface.
 */
TabView.prototype =
/** @lends TabView */
{
    appendTab: function(tab)
    {
        this.tabs.push(tab);
        tab.tabView = this;
        return tab;
    },

    appendTabBefore: function(tab, tabId)
    {
        for (var i in this.tabs)
        {
            var beforeTab = this.tabs[i];
            if (beforeTab.id == tabId)
            {
                this.tabs.splice(i, 0, tab);
                tab.tabView = this;
                return tab;
            }
        }

        // Specified tab isn't there, so just append at the end.
        return this.appendTab(tab);
    },

    removeTab: function(tabObj)
    {
        for (var i in this.tabs)
        {
            var tab = this.tabs[i];
            if (tab == tabObj)
            {
                this.tabs.splice(i, 1);
                break;
            }
        }

        // Bail out if the tab view isn't rendered yet.
        if (!this.element)
            return;

        // Bail out if the tab itself isn't rendered yet.
        if (!tabObj._header || !tabObj._body)
            return;

        // Select different tab if the current one is about to be removed.
        if (Lib.hasClass(tabObj._header, "selected"))
        {
            var nextSelectedTab = tabObj._header.previousSibling || tabObj._header.nextSibling;

            // If it's null, there is no tab now.
            if (nextSelectedTab)
                this.selectTab(nextSelectedTab);
        }

        // Remove the associated tab element from the UI
        if (tabObj._header)
            tabObj._header.parentNode.removeChild(tabObj._header);

        // Remove the associated tab body element from the UI
        if (tabObj._body)
            tabObj._body.parentNode.removeChild(tabObj._body);
    },

    getTab: function(tabId)
    {
        for (var i in this.tabs)
        {
            var tab = this.tabs[i];
            if (tab.id == tabId)
                return tab;
        }
    },

    selectTabByName: function(tabId)
    {
        var tab = Lib.getElementByClass(this.element, tabId + "Tab");
        if (tab)
            this.selectTab(tab);
    },

    showTabBar: function(show)
    {
        if (this.element)
        {
            if (show)
                this.element.removeAttribute("hideTabBar");
            else
                this.element.setAttribute("hideTabBar", "true");
        }
        else
        {
            this.tabBarVisibility = show;
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Listeners

    addListener: function(listener)
    {
        this.listeners.push(listener);
    },

    removeListener: function(listener)
    {
        Lib.remove(this.listeners, listener);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    // xxxHonza: this should be private.
    onClickTab: function(e)
    {
        var tab = Lib.getAncestorByClass(e.target, "tab");
        if (tab)
            this.selectTab(tab);
    },

    selectTab: function(tab)
    {
        if (!Lib.hasClass(tab, "tab"))
            return;

        if (Lib.hasClass(tab, "selected") && tab._updated)
            return;

        var view = tab.getAttribute("view");

        // xxxHonza: this is null if the user clicks on an example on the home page.
        if (!view)
            return;

        var viewBody = Lib.getAncestorByClass(tab, "tabViewBody");

        // Deactivate current tab.
        if (viewBody.selectedTab)
        {
            viewBody.selectedTab.removeAttribute("selected");
            viewBody.selectedBody.removeAttribute("selected");

            // IE workaround. Removing the "selected" attribute
            // doesn't update the style (associated using attribute selector).
            // So use a class name instead.
            Lib.removeClass(viewBody.selectedTab, "selected");
            Lib.removeClass(viewBody.selectedBody, "selected");
        }

        // Store info about new active tab. Each tab has to have a body, 
        // which is identified by class.
        var tabBody = Lib.getElementByClass(viewBody, "tab" + view + "Body");
        if (!tabBody)
            FBTrace.sysout("TabView.selectTab; ERROR Missing tab body", tab);

        viewBody.selectedTab = tab;
        viewBody.selectedBody = tabBody;

        // Activate new tab.
        viewBody.selectedTab.setAttribute("selected", "true");
        viewBody.selectedBody.setAttribute("selected", "true");

        // IE workaround. Adding the "selected" attribute doesn't
        // update the style. Use class name instead.
        Lib.setClass(viewBody.selectedBody, "selected");
        Lib.setClass(viewBody.selectedTab, "selected");

        this.updateTabBody(viewBody, view);
    },

    // xxxHonza: should be private
    updateTabBody: function(viewBody, view)
    {
        var tab = viewBody.selectedTab.repObject;
        if (tab._updated)
            return;

        tab._updated = true;

        // Render default content if available.
        if (tab.bodyTag)
            tab.bodyTag.replace({tab: tab}, tab._body);

        // Call also onUpdateBody for dynamic body update.
        if (tab && tab.onUpdateBody)
            tab.onUpdateBody(this, tab._body);

        // Dispatch to all listeners.
        for (var i=0; i<this.listeners.length; i++)
        {
            var listener = this.listeners[i];
            if (listener.onUpdateBody)
                listener.onUpdateBody(this, tab._body);
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    render: function(parentNode)
    {
        this.element = TabViewTempl.tag.replace({tabView: this}, parentNode, TabViewTempl);
        Lib.setClass(this.element, this.id);

        this.showTabBar(this.tabBarVisibility);

        for (var i in this.tabs)
        {
            var tab = this.tabs[i];
            this.renderTab(tab, parentNode);
        }

        return this.element;
    },

    renderTab: function(tab, parentNode, beforeTabId)
    {
        var beforeTab = this.getTab(beforeTabId);
        if (!parentNode)
            parentNode = this.element;

        var tabHeaderTag = tab.tabHeaderTag ? tab.tabHeaderTag : TabViewTempl.tabHeaderTag;
        var tabBodyTag = tab.tabBodyTag ? tab.tabBodyTag : TabViewTempl.tabBodyTag;

        try
        {
            if (beforeTab)
            {
                tab._header = tabHeaderTag.insertBefore({tab:tab}, Lib.$(parentNode, "tabBar"),
                    tab, beforeTab._header);
                tab._body = tabBodyTag.insertBefore({tab:tab}, Lib.$(parentNode, "tabBodies"),
                    tab, beforeTab._body);
            }
            else
            {
                tab._header = tabHeaderTag.insertBefore({tab:tab}, Lib.$(parentNode, "tabBar"));
                tab._body = tabBodyTag.insertBefore({tab:tab}, Lib.$(parentNode, "tabBodies"));
            }

            tab.initialize(tab._header, tab._body);
        }
        catch (e)
        {
            FBTrace.sysout("TabView.appendTab; EXCEPTION ", e);
        }
    }
}

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

TabView.Tab = function() {}
TabView.Tab.prototype =
{
    initialize: function()
    {
    },

    invalidate: function()
    {
        this._updated = false;
        if (this._body)
            Lib.eraseNode(this._body);
    },

    select: function()
    {
        this.tabView.selectTabByName(this.id);
    }
}

return TabView;

// ************************************************************************************************
}});
