/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/domTree",
    "analyzer",
    "lib/trace"
], function(Domplate, DomTree, Analyzer, FBTrace) {

// ********************************************************************************************* //

function ObjectTree(input)
{
    this.input = input
}

ObjectTree.prototype = Domplate.domplate(DomTree.prototype,
{
    createMember: function(type, name, value, level)
    {
        if (name == "name")
            return null;

        var member = DomTree.prototype.createMember(type, name, value, level);
        member.hasChildren = this.hasProperties(value);
        return member;
    },

    hasProperties: function(ob)
    {
        if (typeof(ob) == "string")
            return false;

        try {
            for (var name in ob)
            {
                if (name != "name")
                    return true;
            }
        } catch (exc) {}
        return false;
    },

    getValue: function(member)
    {
        if (member.value instanceof Analyzer.CCObject)
        {
            return member.value.name + " [ref: " + member.value.refcount + "]" +
                " marked: " + member.value.gcmarked;
        }
        else if (member.value.name)
        {
            return member.value.name;
        }

        return member.value;
    },
});

// ********************************************************************************************* //

return ObjectTree;

// ********************************************************************************************* //
});
