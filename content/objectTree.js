/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/DomTree",
    "analyzer"
], function(Domplate, DomTree, Analyzer) {

// ********************************************************************************************* //

function ObjectTree(input)
{
    this.input = input
}

ObjectTree.prototype = Domplate.domplate(DomTree.prototype,
{
    createMember: function(type, name, value, level)
    {
        var member = DomTree.prototype.createMember(type, name, value, level);
        return member;
    },

    getValue: function(member)
    {
        if (member.value instanceof Analyzer.CCObject)
            return member.value.name + " [ref: " + member.value.refcount + "]" +
                " marked: " + member.value.gcmarked;

        return member.value;
    },
});

// ********************************************************************************************* //

return ObjectTree;

// ********************************************************************************************* //
});
