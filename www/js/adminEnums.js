function Enums(main) {
    'use strict';

    var that = this;
    this.menuIcon = 'fa-list-ol';
    this.main = main;
    this.list = [];
    this.enumEdit = null;
    this.updateTimers = null;

    var enumCurrentParent = '';
    var tasks = [];

    function enumRename(oldId, newId, newName, callback) {

    }
    function _enumRename(oldId, newId, newName, callback) {
    }

    function enumAddChild(parent, newId, name) {
    }

    function enumMembers(id) {
    }

    function prepareEnumMembers() {
    }

    this.prepare = function () {
    };

    this.init = function (update, expandId) {
        this.main.fillContent('#menu-enums-div');
    };

    this.objectChange = function (id, obj) {
    };

}