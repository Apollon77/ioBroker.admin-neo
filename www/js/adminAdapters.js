/* global systemLang, availableLanguages */

function Adapters(main) {
    'use strict';

    var that = this;

    this.curRepository = null;
    this.curRepoLastUpdate = null;
    this.curInstalled = null;
    this.list = [];
    this.$grid = $('#grid-adapters');
    this.main = main;
    this.tree = [];
    this.data = {};
    this.urls = {};
    this.groupImages = {
        'common adapters_group': 'img/group/common.png',
        'hardware_group': 'img/group/hardware.png', //will be deleted after split
        'platform_group': 'img/group/platform.png',
        'kitchen&home_group': 'img/group/kitchen.png',
        'garden_group': 'img/group/garden.png',
        'cameras': 'img/group/camera.png',
        'alarm': 'img/group/alarm.png',
        'script_group': 'img/group/script.png',
        'media_group': 'img/group/media.png',
        'communication_group': 'img/group/communication.png',
        'visualisation_group': 'img/group/visualisation.png',
        'storage_group': 'img/group/storage.png',
        'weather_group': 'img/group/weather.png',
        'schedule_group': 'img/group/schedule.png',
        'vis_group': 'img/group/vis.png',
        'service_group': 'img/group/service.png'
    };

    this.isList = false;
    this.filterVals = {length: 0};
    this.onlyInstalled = false;
    this.onlyUpdatable = false;
    this.currentFilter = '';
    this.isCollapsed = {};

    this.types = {
        occ: 'schedule'
    };

    this.prepare = function () {
        that.$grid.fancytree({
            extensions: ['table', 'gridnav', 'filter', 'themeroller'],
            checkbox: false,
            table: {
                indentation: 20      // indent 20px per node level
            },
            source: that.tree,
            renderColumns: function (event, data) {
                var node = data.node;
                var $tdList = $(node.tr).find('>td');

                if (!that.data[node.key]) {
                    $tdList.eq(0).css({'font-weight': 'bold'});
                    //$(node.tr).addClass('ui-state-highlight');

                    // Calculate total count of adapter and count of installed adapter
                    for (var c = 0; c < that.tree.length; c++) {
                        if (that.tree[c].key === node.key) {
                            $tdList.eq(1).html(that.tree[c].desc).css({'overflow': 'hidden', 'white-space': 'nowrap', position: 'relative'});
                            var installed = 0;
                            for (var k = 0; k < that.tree[c].children.length; k++) {
                                if (that.data[that.tree[c].children[k].key].installed)
                                    installed++;
                            }
                            var title;
                            if (!that.onlyInstalled && !that.onlyUpdatable) {
                                title = '[<span title="' + _('Installed from group') + '">' + installed + '</span> / <span title="' + _('Total count in group') + '">' + that.tree[c].children.length + '</span>]';
                            } else {
                                title = '<span title="' + _('Installed from group') + '">' + installed + '</span>';
                            }
                            $tdList.eq(4).html(title).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                            break;
                        }
                    }
                    return;
                }
                $tdList.eq(0).css({'overflow': 'hidden', 'white-space': 'nowrap'});
                $tdList.eq(1).html(that.data[node.key].desc).css({'overflow': 'hidden', "white-space": "nowrap", position: 'relative', 'font-weight': that.data[node.key].bold ? 'bold' : null});
                $tdList.eq(2).html(that.data[node.key].keywords).css({'overflow': 'hidden', "white-space": "nowrap"}).attr('title', that.data[node.key].keywords);

                $tdList.eq(3).html(that.data[node.key].version).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap", position: 'relative'});
                $tdList.eq(4).html(that.data[node.key].installed).css({'padding-left': '10px', 'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(5).html(that.data[node.key].platform).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(6).html(that.data[node.key].license).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(7).html(that.data[node.key].install).css({'text-align': 'center'});
                that.initButtons(node.key);
                // If we render this element, that means it is expanded
                if (that.isCollapsed[that.data[node.key].group]) {
                    that.isCollapsed[that.data[node.key].group] = false;
                    that.main.saveConfig('adaptersIsCollapsed', JSON.stringify(that.isCollapsed));
                }
            },
            gridnav: {
                autofocusInput: false,
                handleCursorKeys: true
            },
            filter: {
                mode: 'hide',
                autoApply: true
            },
            collapse: function (event, data) {
                if (that.isCollapsed[data.node.key])
                    return;
                that.isCollapsed[data.node.key] = true;
                that.main.saveConfig('adaptersIsCollapsed', JSON.stringify(that.isCollapsed));
            }
        });

        $('#btn_collapse_adapters').button({icons: {primary: 'ui-icon-folder-collapsed'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#process_running_adapters').show();
            setTimeout(function () {
                that.$grid.fancytree('getRootNode').visit(function (node) {
                    if (!that.filterVals.length || node.match || node.subMatch)
                        node.setExpanded(false);
                });
                $('#process_running_adapters').hide();
            }, 100);
        });

        $('#btn_expand_adapters').button({icons: {primary: 'ui-icon-folder-open'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#process_running_adapters').show();
            setTimeout(function () {
                that.$grid.fancytree('getRootNode').visit(function (node) {
                    if (!that.filterVals.length || node.match || node.subMatch)
                        node.setExpanded(true);
                });
                $('#process_running_adapters').hide();
            }, 100);
        });

        $('#btn_list_adapters').button({icons: {primary: 'ui-icon-grip-dotted-horizontal'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#process_running_adapters').show();
            that.isList = !that.isList;
            if (that.isList) {
                $('#btn_list_adapters').addClass('ui-state-error');
                $('#btn_expand_adapters').hide();
                $('#btn_collapse_adapters').hide();
                $(this).attr('title', _('list'));
            } else {
                $('#btn_list_adapters').removeClass('ui-state-error');
                $('#btn_expand_adapters').show();
                $('#btn_collapse_adapters').show();
                $(this).attr('title', _('tree'));
            }
            that.main.saveConfig('adaptersIsList', that.isList);
            $('#process_running_adapters').show();

            setTimeout(function () {
                that.init(true);
                $('#process_running_adapters').hide();
            }, 200);
        });

        $('#btn_filter_adapters').button({icons: {primary: 'ui-icon-star'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#process_running_adapters').show();
            that.onlyInstalled = !that.onlyInstalled;
            if (that.onlyInstalled) {
                $('#btn_filter_adapters').addClass('ui-state-error');
            } else {
                $('#btn_filter_adapters').removeClass('ui-state-error');
            }
            that.main.saveConfig('adaptersOnlyInstalled', that.onlyInstalled);

            setTimeout(function () {
                that.init(true);
                $('#process_running_adapters').hide();
            }, 200);
        });

        $('#btn_filter_updates').button({icons: {primary: 'ui-icon-info'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#process_running_adapters').show();
            that.onlyUpdatable = !that.onlyUpdatable;
            if (that.onlyUpdatable) {
                $('#btn_filter_updates').addClass('ui-state-error');
                $('#btn_upgrade_all').show();
            } else {
                $('#btn_filter_updates').removeClass('ui-state-error');
                $('#btn_upgrade_all').hide();
            }
            that.main.saveConfig('adaptersOnlyUpdatable', that.onlyUpdatable);

            setTimeout(function () {
                that.init(true);
                $('#process_running_adapters').hide();
            }, 200);
        });

        $('#btn_filter_custom_url')
                .addClass('icon-github')
                .button({text: false})
                .html('')
                .css({width: 18, height: 18}).unbind('click')
                .click(function () {
                    // prepare adapters
                    var text = '<option value="">' + _('none') + '</option>';
                    var order = [];
                    var url;
                    for (url in that.urls) {
                        order.push(url);
                    }
                    order.sort();

                    for (var o = 0; o < order.length; o++) {
                        var user = that.urls[order[o]].match(/\.com\/([-_$§A-Za-z0-9]+)\/([-._$§A-Za-z0-9]+)\//);
                        if (user && user.length >= 2 && (that.main.config.expertMode || order[o].indexOf('js-controller') === -1)) {
                            text += '<option value="https://github.com/' + user[1] + '/ioBroker.' + order[o] + '/tarball/master ' + order[o] + '">' + order[o] + '</option>';
                        }
                    }
                    $('#install-github-link').html(text).val(that.main.config.adaptersGithub || '');

                    $('#install-tabs').tabs('option', 'active', that.main.config.adaptersInstallTab || 0);

                    $('#dialog-install-url').dialog({
                        autoOpen: true,
                        modal: true,
                        width: 650,
                        height: 240,
                        open: function (event) {
                            $(event.target).parent().find('.ui-dialog-titlebar-close .ui-button-text').html('');
                        },
                        buttons: [
                            {
                                id: 'dialog-install-url-button',
                                text: _('Install'),
                                click: function () {
                                    var isCustom = !!$('#install-tabs').tabs('option', 'active');

                                    $('#dialog-install-url').dialog('close');
                                    var url;
                                    var debug;
                                    var adapter;
                                    if (isCustom) {
                                        url = $('#install-url-link').val();
                                        debug = $('#install-url-debug').prop('checked') ? ' --debug' : '';
                                        adapter = '';
                                    } else {
                                        var parts = $('#install-github-link').val().split(' ');
                                        url = parts[0];
                                        debug = $('#install-github-debug').prop('checked') ? ' --debug' : '';
                                        adapter = ' ' + parts[1];
                                    }

                                    if (!url) {
                                        that.main.showError(_('Invalid link'));
                                        return;
                                    }

                                    that.main.cmdExec(null, 'url "' + url + '"' + adapter + debug, function (exitCode) {
                                        if (!exitCode)
                                            that.init(true, true);
                                    });
                                }
                            },
                            {
                                text: _('Cancel'),
                                click: function () {
                                    $('#dialog-install-url').dialog('close');
                                }
                            }
                        ]
                    });
                });

        $('#btn_upgrade_all').button({icons: {primary: 'ui-icon-flag'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            that.main.confirmMessage(_('Do you want to upgrade all adapters?'), _('Question'), 'help', function (result) {
                if (result) {
                    that.main.cmdExec(null, 'upgrade', function (exitCode) {
                        if (!exitCode)
                            that.init(true);
                    });
                }
            });
        });

        $('#btn-adapters-expert-mode').button({
            icons: {primary: 'ui-icon-person'},
            text: false
        }).css({width: 18, height: 18}).attr('title', _('_Toggle expert mode')).click(function () {
            that.main.config.expertMode = !that.main.config.expertMode;
            that.main.saveConfig('expertMode', that.main.config.expertMode);
            that.updateExpertMode();
            that.main.tabs.instances.updateExpertMode();
        });
        if (that.main.config.expertMode)
            $('#btn-adapters-expert-mode').addClass('ui-state-error');

        $('#install-tabs').tabs({
            activate: function (event, ui) {
                switch (ui.newPanel.selector) {
                    case '#install-github':
                        that.main.saveConfig('adaptersInstallTab', 0);
                        break;
                    case '#install-custom':
                        that.main.saveConfig('adaptersInstallTab', 1);
                        break;
                }
            }
        });
        // save last selected adapter
        $('#install-github-link').change(function () {
            that.main.saveConfig('adaptersGithub', $(this).val());
        });
        $('#install-url-link').keyup(function (event) {
            if (event.which === 13) {
                $('#dialog-install-url-button').trigger('click');
            }
        });

        // Load settings
        that.isList = that.main.config.adaptersIsList || false;
        that.onlyInstalled = that.main.config.adaptersOnlyInstalled || false;
        that.onlyUpdatable = that.main.config.adaptersOnlyUpdatable || false;
        that.currentFilter = that.main.config.adaptersCurrentFilter || '';
        that.isCollapsed = that.main.config.adaptersIsCollapsed ? JSON.parse(that.main.config.adaptersIsCollapsed) : {};
        $('#adapters-filter').val(that.currentFilter);

        if (that.isList) {
            $('#btn_list_adapters').addClass('ui-state-error').attr('title', _('tree'));
            $('#btn_expand_adapters').hide();
            $('#btn_collapse_adapters').hide();
        }

        if (that.onlyInstalled)
            $('#btn_filter_adapters').addClass('ui-state-error');

        if (that.onlyUpdatable || that.main.config.expertMode) {
            if (that.onlyUpdatable)
                $('#btn_filter_updates').addClass('ui-state-error');
            $('#btn_upgrade_all').show();
        } else {
            $('#btn_upgrade_all').hide();
        }

        $('#btn_refresh_adapters').button({icons: {primary: 'ui-icon-refresh'}, text: false}).css({width: 18, height: 18}).click(function () {
            that.init(true, true);
        });

        // add filter processing
        $('#adapters-filter').keyup(function () {
            $(this).trigger('change');
        }).on('change', function () {
            if (that.filterTimer) {
                clearTimeout(that.filterTimer);
            }
            that.filterTimer = setTimeout(function () {
                that.filterTimer = null;
                that.currentFilter = $('#adapters-filter').val().toLowerCase();
                that.main.saveConfig('adaptersCurrentFilter', that.currentFilter);
                that.$grid.fancytree('getTree').filterNodes(customFilter, false);
            }, 400);
        });

        $('#adapters-filter-clear').button({icons: {primary: 'ui-icon-close'}, text: false}).css({width: 16, height: 16}).click(function () {
            $('#adapters-filter').val('').trigger('change');
        });
    };

    this.updateExpertMode = function () {
        this.init(true);
        if (that.main.config.expertMode) {
            $('#btn-adapters-expert-mode').addClass('ui-state-error');
            $('#btn_upgrade_all').show();
        } else {
            $('#btn-adapters-expert-mode').removeClass('ui-state-error');

            if (that.onlyUpdatable) {
                $('#btn_upgrade_all').show();
            } else {
                $('#btn_upgrade_all').hide();
            }
        }
    };

    function customFilter(node) {
        //if (node.parent && node.parent.match) return true;

        if (that.currentFilter) {
            if (!that.data[node.key])
                return false;

            if ((that.data[node.key].name && that.data[node.key].name.toLowerCase().indexOf(that.currentFilter) !== -1) ||
                    (that.data[node.key].title && that.data[node.key].title.toLowerCase().indexOf(that.currentFilter) !== -1) ||
                    (that.data[node.key].keywords && that.data[node.key].keywords.toLowerCase().indexOf(that.currentFilter) !== -1) ||
                    (that.data[node.key].desc && that.data[node.key].desc.toLowerCase().indexOf(that.currentFilter) !== -1)) {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    }

    this.getAdaptersInfo = function (host, update, updateRepo, callback) {
        if (!host)
            return;

        if (!callback)
            throw 'Callback cannot be null or undefined';
        if (update) {
            // Do not update too often
            if (!this.curRepoLastUpdate || ((new Date()).getTime() - this.curRepoLastUpdate > 1000)) {
                this.curRepository = null;
                this.curInstalled = null;
            }
        }

        if (this.curRunning) {
            this.curRunning.push(callback);
            return;
        }

        if (!this.curRepository) {
            this.main.socket.emit('sendToHost', host, 'getRepository', {repo: this.main.systemConfig.common.activeRepo, update: updateRepo}, function (_repository) {
                if (_repository === 'permissionError') {
                    console.error('May not read "getRepository"');
                    _repository = {};
                }

                that.curRepository = _repository || {};
                if (that.curRepository && that.curInstalled && that.curRunning) {
                    that.curRepoLastUpdate = (new Date()).getTime();
                    setTimeout(function () {
                        for (var c = 0; c < that.curRunning.length; c++) {
                            that.curRunning[c](that.curRepository, that.curInstalled);
                        }
                        that.curRunning = null;
                    }, 0);
                }
            });
        }
        if (!this.curInstalled) {
            this.main.socket.emit('sendToHost', host, 'getInstalled', null, function (_installed) {
                if (_installed === 'permissionError') {
                    console.error('May not read "getInstalled"');
                    _installed = {};
                }

                that.curInstalled = _installed || {};
                if (that.curRepository && that.curInstalled) {
                    that.curRepoLastUpdate = (new Date()).getTime();
                    setTimeout(function () {
                        for (var c = 0; c < that.curRunning.length; c++) {
                            that.curRunning[c](that.curRepository, that.curInstalled);
                        }
                        that.curRunning = null;
                    }, 0);
                }
            });
        }

        if (this.curInstalled && this.curRepository) {
            setTimeout(function () {
                if (that.curRunning) {
                    for (var c = 0; c < that.curRunning.length; c++) {
                        that.curRunning[c](that.curRepository, that.curInstalled);
                    }
                    that.curRunning = null;
                }
                if (callback)
                    callback(that.curRepository, that.curInstalled);
            }, 0);
        } else {
            this.curRunning = [callback];
        }
    };

    this.resize = function (width, height) {
        $('#grid-adapters-div').height($(window).height() - $('#tabs .ui-tabs-nav').height() - 50);
    };

    this.enableColResize = function () {
        if (!$.fn.colResizable)
            return;
        if (this.$grid.is(':visible')) {
            this.$grid.colResizable({liveDrag: true});
        } /*else {
         setTimeout(function () {
         enableColResize();
         }, 1000);
         }*/
    };

    function getNews(actualVersion, adapter) {
        var text = '';
        if (adapter.news) {
            for (var v in adapter.news) {
                if (systemLang === v)
                    text += (text ? '\n' : '') + adapter.news[v];
                if (v in availableLanguages)
                    continue;
                if (v === actualVersion)
                    break;
                text += (text ? '\n' : '') + (adapter.news[v][systemLang] || adapter.news[v].en);
            }
        }
        return text;
    }

    function checkDependencies(dependencies) {
        if (!dependencies)
            return '';
        // like [{"js-controller": ">=0.10.1"}]
        var adapters;
        if (dependencies instanceof Array) {
            adapters = {};
            for (var a = 0; a < dependencies.length; a++) {
                if (typeof dependencies[a] === 'string')
                    continue;
                for (var b in dependencies[a])
                    adapters[b] = dependencies[a][b];
            }
        } else {
            adapters = dependencies;
        }

        for (var adapter in adapters) {
            if (adapter === 'js-controller') {
                if (!semver.satisfies(that.main.objects['system.host.' + that.main.currentHost].common.installedVersion, adapters[adapter]))
                    return _('Invalid version of %s. Required %s', adapter, adapters[adapter]);
            } else {
                if (!that.main.objects['system.adapter.' + adapter] || !that.main.objects['system.adapter.' + adapter].common || !that.main.objects['system.adapter.' + adapter].common.installedVersion)
                    return _('No version of %s', adapter);
                if (!semver.satisfies(that.main.objects['system.adapter.' + adapter].common.installedVersion, adapters[adapter]))
                    return _('Invalid version of %s', adapter);
            }
        }
        return '';
    }

    // ----------------------------- Adapters show and Edit ------------------------------------------------
    this.init = function (update, updateRepo) {
        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init();
            }, 250);
            return;
        }

        if (typeof this.$grid !== 'undefined' && (!this.$grid[0]._isInited || update)) {
            this.$grid[0]._isInited = true;

            $('#process_running_adapters').show();

            this.$grid.find('tbody').html('');

            this.getAdaptersInfo(this.main.currentHost, update, updateRepo, function (repository, installedList) {
                var obj;
                var version;
                var tmp;
                var adapter;

                var listInstalled = [];
                var listUnsinstalled = [];

                if (installedList) {
                    for (adapter in installedList) {
                        if (!installedList.hasOwnProperty(adapter))
                            continue;
                        obj = installedList[adapter];
                        if (!obj || obj.controller || adapter === 'hosts')
                            continue;
                        listInstalled.push(adapter);
                    }
                    listInstalled.sort();
                }

                that.urls = {};
                // List of adapters for repository
                for (adapter in repository) {
                    if (!repository.hasOwnProperty(adapter))
                        continue;
                    that.urls[adapter] = repository[adapter].meta;
                    obj = repository[adapter];
                    if (!obj || obj.controller)
                        continue;
                    version = '';
                    if (installedList && installedList[adapter])
                        continue;
                    listUnsinstalled.push(adapter);
                }
                listUnsinstalled.sort();

                that.tree = [];
                that.data = {};

                // list of the installed adapters
                for (var i = 0; i < listInstalled.length; i++) {
                    adapter = listInstalled[i];

                    obj = installedList ? installedList[adapter] : null;

                    if (obj) {
                        that.urls[adapter] = installedList[adapter].readme || installedList[adapter].extIcon || installedList[adapter].licenseUrl;
                        if (!that.urls[adapter])
                            delete that.urls[adapter];
                    }

                    if (!obj || obj.controller || adapter === 'hosts')
                        continue;
                    var installed = '';
                    var icon = obj.icon;
                    version = '';

                    if (repository[adapter] && repository[adapter].version)
                        version = repository[adapter].version;

                    if (repository[adapter] && repository[adapter].extIcon)
                        icon = repository[adapter].extIcon;

                    if (obj.version) {
                        var news = '';
                        var updatable = false;
                        var updatableError = '';
                        if (!that.main.upToDate(version, obj.version)) {
                            news = getNews(obj.version, repository[adapter]);
                            // check if version is compatible with current adapters and js-controller
                            updatable = true;
                            updatableError = checkDependencies(repository[adapter].dependencies);
                        }
                        installed = '<table style="border: 0; border-collapse: collapse;' + (news ? 'font-weight: bold;' : '') + '" cellspacing="0" cellpadding="0" class="ui-widget"><tr><td style="border: 0; padding: 0; width: 50px" title="' + news + '">' + obj.version + '</td>';

                        var _instances = 0;
                        var _enabled = 0;

                        // Show information about installed and enabled instances
                        for (var z = 0; z < that.main.instances.length; z++) {
                            if (main.objects[that.main.instances[z]].common.name === adapter) {
                                _instances++;
                                if (main.objects[that.main.instances[z]].common.enabled)
                                    _enabled++;
                            }
                        }
                        if (_instances) {
                            installed += '<td style="border: 0; padding: 0; width:40px">[<span title="' + _('Installed instances') + '">' + _instances + '</span>';
                            if (_enabled)
                                installed += '/<span title="' + _('Active instances') + '" class="true">' + _enabled + '</span>';
                            installed += ']</td>';
                        } else {
                            installed += '<td style="border: 0; padding: 0; width: 40px"></td>';
                        }

                        tmp = installed.split('.');
                        if (updatable) {
                            installed += '<td style="border: 0; padding: 0; width: 30px"><button class="adapter-update-submit" data-adapter-name="' + adapter + '" ' + (updatableError ? ' disabled title="' + updatableError + '"' : 'title="' + _('update') + '"') + '></button></td>';
                            version = version.replace('class="', 'class="updateReady ');
                            $('a[href="#tab-adapters"]').addClass('updateReady');
                        } else if (that.onlyUpdatable) {
                            continue;
                        }

                        installed += '</tr></table>';
                    }
                    if (version) {
                        tmp = version.split('.');
                        if (tmp[0] === '0' && tmp[1] === '0' && tmp[2] === '0') {
                            version = '<span class="planned" title="' + _("planned") + '">' + version + '</span>';
                        } else if (tmp[0] === '0' && tmp[1] === '0') {
                            version = '<span class="alpha" title="' + _("alpha") + '">' + version + '</span>';
                        } else if (tmp[0] === '0') {
                            version = '<span class="beta" title="' + _("beta") + '">' + version + '</span>';
                        } else if (version === 'npm error') {
                            version = '<span class="error" title="' + _("Cannot read version from NPM") + '">' + _('npm error') + '</span>';
                        } else {
                            version = '<span class="stable" title="' + _("stable") + '">' + version + '</span>';
                        }
                    }

                    var group = (obj.type || that.types[adapter] || 'common adapters') + '_group';
                    var desc = (typeof obj.desc === 'object') ? (obj.desc[systemLang] || obj.desc.en) : obj.desc;
                    desc += showUploadProgress(group, adapter, that.main.states['system.adapter.' + adapter + '.upload'] ? that.main.states['system.adapter.' + adapter + '.upload'].val : 0);

                    that.data[adapter] = {
                        image: icon ? '<img src="' + icon + '" width="22px" height="22px" />' : '',
                        name: adapter,
                        title: (obj.title || '').replace('ioBroker Visualisation - ', ''),
                        desc: desc,
                        keywords: obj.keywords ? obj.keywords.join(' ') : '',
                        version: version,
                        installed: installed,
                        bold: obj.highlight || false,
                        install: '<button data-adapter-name="' + adapter + '" class="adapter-install-submit" title="' + _('add instance') + '"></button>' +
                                '<button ' + (obj.readme ? '' : 'disabled="disabled" ') + 'data-adapter-name="' + adapter + '" data-adapter-url="' + obj.readme + '" class="adapter-readme-submit" title="' + _('readme') + '"></button>' +
                                '<button ' + (installed ? '' : 'disabled="disabled" ') + 'data-adapter-name="' + adapter + '" class="adapter-delete-submit" title="' + _('delete adapter') + '"></button>' +
                                ((that.main.config.expertMode) ? '<button data-adapter-name="' + adapter + '" class="adapter-update-custom-submit" title="' + _('install specific version') + '"></button>' : ''),
                        platform: obj.platform,
                        group: group,
                        license: obj.license || '',
                        licenseUrl: obj.licenseUrl || ''
                    };

                    if (!obj.type)
                        console.log('"' + adapter + '": "common adapters",');
                    if (obj.type && that.types[adapter])
                        console.log('Adapter "' + adapter + '" has own type. Remove from admin.');

                    if (!that.isList) {
                        var igroup = -1;
                        for (var j = 0; j < that.tree.length; j++) {
                            if (that.tree[j].key === that.data[adapter].group) {
                                igroup = j;
                                break;
                            }
                        }
                        if (igroup < 0) {
                            that.tree.push({
                                title: _(that.data[adapter].group),
                                desc: showUploadProgress(group),
                                key: that.data[adapter].group,
                                folder: true,
                                expanded: !that.isCollapsed[that.data[adapter].group],
                                children: [],
                                icon: that.groupImages[that.data[adapter].group]
                            });
                            igroup = that.tree.length - 1;
                        }
                        that.tree[igroup].children.push({
                            icon: icon,
                            title: that.data[adapter].title || adapter,
                            key: adapter
                        });
                    } else {
                        that.tree.push({
                            icon: icon,
                            title: that.data[adapter].title || adapter,
                            key: adapter
                        });
                    }
                }

                if (!that.onlyInstalled && !that.onlyUpdatable) {
                    for (i = 0; i < listUnsinstalled.length; i++) {
                        adapter = listUnsinstalled[i];

                        obj = repository[adapter];
                        if (!obj || obj.controller)
                            continue;
                        version = '';
                        if (installedList && installedList[adapter])
                            continue;

                        if (repository[adapter] && repository[adapter].version) {
                            version = repository[adapter].version;
                            tmp = version.split('.');
                            if (tmp[0] === '0' && tmp[1] === '0' && tmp[2] === '0') {
                                version = '<span class="planned" title="' + _("planned") + '">' + version + '</span>';
                            } else if (tmp[0] === '0' && tmp[1] === '0') {
                                version = '<span class="alpha" title="' + _("alpha") + '">' + version + '</span>';
                            } else if (tmp[0] === '0') {
                                version = '<span class="beta" title="' + _("beta") + '">' + version + '</span>';
                            } else if (version === 'npm error') {
                                version = '<span class="error" title="' + _("Cannot read version from NPM") + '">' + _('npm error') + '</span>';
                            } else {
                                version = '<span class="stable" title="' + _("stable") + '">' + version + '</span>';
                            }
                        }

                        var group = (obj.type || that.types[adapter] || 'common adapters') + '_group';
                        var desc = (typeof obj.desc === 'object') ? (obj.desc[systemLang] || obj.desc.en) : obj.desc;
                        desc += showUploadProgress(adapter, that.main.states['system.adapter.' + adapter + '.upload'] ? that.main.states['system.adapter.' + adapter + '.upload'].val : 0);

                        that.data[adapter] = {
                            image: repository[adapter].extIcon ? '<img src="' + repository[adapter].extIcon + '" width="22px" height="22px" />' : '',
                            name: adapter,
                            title: (obj.title || '').replace('ioBroker Visualisation - ', ''),
                            desc: desc,
                            keywords: obj.keywords ? obj.keywords.join(' ') : '',
                            version: version,
                            bold: obj.highlight,
                            installed: '',
                            install: '<button data-adapter-name="' + adapter + '" class="adapter-install-submit">' + _('add instance') + '</button>' +
                                    '<button ' + (obj.readme ? '' : 'disabled="disabled" ') + ' data-adapter-name="' + adapter + '" data-adapter-url="' + obj.readme + '" class="adapter-readme-submit">' + _('readme') + '</button>' +
                                    '<button disabled="disabled" data-adapter-name="' + adapter + '" class="adapter-delete-submit">' + _('delete adapter') + '</button>' +
                                    ((that.main.config.expertMode) ? '<button data-adapter-name="' + adapter + '" class="adapter-update-custom-submit" title="' + _('install specific version') + '"></button>' : ''),
                            platform: obj.platform,
                            license: obj.license || '',
                            licenseUrl: obj.licenseUrl || '',
                            group: group
                        };

                        if (!obj.type)
                            console.log('"' + adapter + '": "common adapters",');
                        if (obj.type && that.types[adapter])
                            console.log('Adapter "' + adapter + '" has own type. Remove from admin.');

                        if (!that.isList) {
                            var igroup = -1;
                            for (var j = 0; j < that.tree.length; j++) {
                                if (that.tree[j].key === that.data[adapter].group) {
                                    igroup = j;
                                    break;
                                }
                            }
                            if (igroup < 0) {
                                that.tree.push({
                                    title: _(that.data[adapter].group),
                                    key: that.data[adapter].group,
                                    folder: true,
                                    expanded: !that.isCollapsed[that.data[adapter].group],
                                    children: [],
                                    icon: that.groupImages[that.data[adapter].group]
                                });
                                igroup = that.tree.length - 1;
                            }
                            that.tree[igroup].children.push({
                                title: that.data[adapter].title || adapter,
                                icon: repository[adapter].extIcon,
                                desc: showUploadProgress(group),
                                key: adapter
                            });
                        } else {
                            that.tree.push({
                                icon: repository[adapter].extIcon,
                                title: that.data[adapter].title || adapter,
                                key: adapter
                            });
                        }
                    }
                }

                that.$grid.fancytree('getTree').reload(that.tree);
                $('#grid-adapters .fancytree-icon').each(function () {
                    if ($(this).attr('src'))
                        $(this).css({width: 22, height: 22});

                    $(this).hover(function () {
                        var text = '<div class="icon-large" style="' +
                                'left: ' + Math.round($(this).position().left + $(this).width() + 5) + 'px;"><img src="' + $(this).attr('src') + '"/></div>';
                        var $big = $(text);
                        $big.insertAfter($(this));
                        $(this).data('big', $big[0]);
                        var h = parseFloat($big.height());
                        var top = Math.round($(this).position().top - ((h - parseFloat($(this).height())) / 2));
                        if (h + top > (window.innerHeight || document.documentElement.clientHeight)) {
                            top = (window.innerHeight || document.documentElement.clientHeight) - h;
                        }
                        $big.css({top: top});

                    }, function () {
                        var big = $(this).data('big');
                        $(big).remove();
                        $(this).data('big', undefined);
                    });
                });
                $('#process_running_adapters').hide();
                if (that.currentFilter)
                    that.$grid.fancytree('getTree').filterNodes(customFilter, false);

                that.enableColResize();
            });
        }
    };

    function showLicenseDialog(adapter, callback) {
        var $dialogLicense = $('#dialog-license');
        // Is adapter installed
        if (that.data[adapter].installed || !that.data[adapter].licenseUrl) {
            callback(true);
            return;
        }
        $('#license_language').hide();
        $('#license_diag').hide();
        $('#license_language_label').hide();
        $('#license_checkbox').hide();

        var timeout = setTimeout(function () {
            timeout = null;
            callback(true);
        }, 10000);

        if (!that.data[adapter].licenseUrl) {
            that.data[adapter].licenseUrl = 'https://raw.githubusercontent.com/ioBroker/ioBroker.' + template.common.name + '/master/LICENSE';
        }
        if (typeof that.data[adapter].licenseUrl === 'object') {
            that.data[adapter].licenseUrl = that.data[adapter].licenseUrl[systemLang] || that.data[adapter].licenseUrl.en;
        }
        // Workaround
        // https://github.com/ioBroker/ioBroker.vis/blob/master/LICENSE =>
        // https://raw.githubusercontent.com/ioBroker/ioBroker.vis/master/LICENSE
        if (that.data[adapter].licenseUrl.indexOf('github.com') !== -1) {
            that.data[adapter].licenseUrl = that.data[adapter].licenseUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }

        that.main.socket.emit('httpGet', that.data[adapter].licenseUrl, function (error, response, body) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;

                if (!error && body) {
                    $dialogLicense.css({'z-index': 200});
                    body = body.toString().replace(/\r\n/g, '<br>');
                    body = body.replace(/\n/g, '<br>');
                    $('#license_text').html(body);
                    $dialogLicense.dialog({
                        autoOpen: true,
                        modal: true,
                        width: 600,
                        height: 400,
                        open: function (event) {
                            $(event.target).parent().find('.ui-dialog-titlebar-close .ui-button-text').html('');
                        },
                        buttons: [
                            {
                                text: _('agree'),
                                click: function () {
                                    $dialogLicense.dialog('close');
                                    callback(true);
                                }
                            },
                            {
                                text: _('not agree'),
                                click: function () {
                                    $dialogLicense.dialog('close');
                                    callback(false);
                                }
                            }
                        ],
                        close: function () {
                            callback(false);
                        }
                    });
                } else {
                    callback(true);
                }
            }
        });
    }

    this.initButtons = function (adapter) {
        $('.adapter-install-submit[data-adapter-name="' + adapter + '"]').button({
            text: false,
            icons: {
                primary: 'ui-icon-plusthick'
            }
        }).css({width: 22, height: 18}).unbind('click').on('click', function () {
            var adapter = $(this).attr('data-adapter-name');
            that.getAdaptersInfo(that.main.currentHost, false, false, function (repo, installed) {
                var obj = repo[adapter];

                if (!obj)
                    obj = installed[adapter];

                if (!obj)
                    return;

                if (obj.license && obj.license !== 'MIT') {
                    // Show license dialog!
                    showLicenseDialog(adapter, function (isAgree) {
                        if (isAgree) {
                            that.main.cmdExec(null, 'add ' + adapter, function (exitCode) {
                                if (!exitCode)
                                    that.init(true);
                            });
                        }
                    });
                } else {
                    that.main.cmdExec(null, 'add ' + adapter, function (exitCode) {
                        if (!exitCode)
                            that.init(true);
                    });
                }
            });
        });

        $('.adapter-delete-submit[data-adapter-name="' + adapter + '"]').button({
            icons: {primary: 'ui-icon-trash'},
            text: false
        }).css({width: 22, height: 18}).unbind('click').on('click', function () {
            var name = $(this).attr('data-adapter-name');
            that.main.confirmMessage(_('Are you sure?'), _('Question'), 'help', function (result) {
                if (result) {
                    that.main.cmdExec(null, 'del ' + name, function (exitCode) {
                        if (!exitCode)
                            that.init(true);
                    });
                }
            });
        });

        $('.adapter-readme-submit[data-adapter-name="' + adapter + '"]').button({
            icons: {primary: 'ui-icon-help'},
            text: false
        }).css({width: 22, height: 18}).unbind('click').on('click', function () {
            window.open($(this).attr('data-adapter-url'), $(this).attr('data-adapter-name') + ' ' + _('readme'));
        });

        $('.adapter-update-submit[data-adapter-name="' + adapter + '"]').button({
            icons: {primary: 'ui-icon-refresh'},
            text: false
        }).css({width: 22, height: 18}).unbind('click').on('click', function () {
            var aName = $(this).attr('data-adapter-name');
            if (aName === 'admin')
                that.main.waitForRestart = true;

            that.main.cmdExec(null, 'upgrade ' + aName, function (exitCode) {
                if (!exitCode)
                    that.init(true);
            });
        });

        var $button = $('.adapter-update-custom-submit[data-adapter-name="' + adapter + '"]');
        $button.button({
            text: false,
            icons: {
                primary: ' ui-icon-triangle-1-s'
            }
        }).css({width: 22, height: 18}).unbind('click').on('click', function () {
            var versions = [];
            if (that.main.objects['system.adapter.' + adapter].common.news) {
                for (var id in that.main.objects['system.adapter.' + adapter].common.news) {
                    versions.push(id);
                }
            } else {
                versions.push(that.main.objects['system.adapter.' + adapter].common.version);
            }
            var menu = '';
            for (var v = 0; v < versions.length; v++) {
                menu += '<li data-version="' + versions[v] + '" data-adapter-name="' + $(this).data('adapter-name') + '" class="adapters-versions-link"><b>' + versions[v] + '</b></li>';
            }
            menu += '<li class="adapters-versions-link">' + _('Close') + '</li>';

            var $adaptersMenu = $('#adapters-menu');
            if ($adaptersMenu.data('inited'))
                $adaptersMenu.menu('destroy');

            var pos = $(this).position();
            $adaptersMenu.html(menu);
            if (!$adaptersMenu.data('inited')) {
                $adaptersMenu.data('inited', true);
                $adaptersMenu.mouseleave(function () {
                    $(this).hide();
                });
            }

            $adaptersMenu.menu().css({
                left: pos.left - $adaptersMenu.width(),
                top: pos.top
            }).show();

            $('.adapters-versions-link').unbind('click').click(function () {
                //if ($(this).data('link')) window.open($(this).data('link'), $(this).data('instance-id'));
                var adapter = $(this).data('adapter-name');
                var version = $(this).data('version');
                if (version && adapter) {
                    that.main.cmdExec(null, 'upgrade ' + adapter + '@' + version, function (exitCode) {
                        if (!exitCode)
                            that.init(true);
                    });
                }

                $('#adapters-menu').hide();
            });
        });

        if (!that.main.objects['system.adapter.' + adapter]) {
            $button.button('disable');
        }
    };

    this.objectChange = function (id, obj) {
        // Update Adapter Table
        if (id.match(/^system\.adapter\.[a-zA-Z0-9-_]+$/)) {
            if (obj) {
                if (this.list.indexOf(id) === -1)
                    this.list.push(id);
            } else {
                var j = this.list.indexOf(id);
                if (j !== -1) {
                    this.list.splice(j, 1);
                }
            }

            if (typeof this.$grid !== 'undefined' && this.$grid[0]._isInited) {
                this.init(true);
            }
        }
    };

    function showUploadProgress(group, adapter, percent) {
        var text = '';
        if (adapter || typeof group === 'string') {
            if (adapter) {
                text += '<div class="adapter-upload-progress" data-adapter-name="' + adapter + '"';
            } else {
                text += '<div class="group-upload-progress"';
            }
            text += ' data-adapter-group="' + group + '" style="position: absolute; width: 100%; height: 100%; opacity: ' + (percent ? 0.7 : 0) + '; top: 0; left: 0">';
        } else {
            percent = group;
        }
        text += percent ? '<table title="' + _('Upload') + ' ' + percent + '%" class="no-space" style="width:100%; height: 100%; opacity: 0.7"><tr style="height: 100%" class="no-space"><td class="no-space" style="width:' + percent + '%;background: blue"></td><td style="width:' + (100 - percent) + '%;opacity: 0.1" class="no-space"></td></tr></table>' : '';

        if (adapter)
            text += '</div>';
        return text;
    }

    this.stateChange = function (id, state) {
        if (id && state) {
            var adapter = id.match(/^system\.adapter\.([\w\d-]+)\.upload$/);
            if (adapter) {
                var $adapter = $('.adapter-upload-progress[data-adapter-name="' + adapter[1] + '"]');
                var text = showUploadProgress(state.val);
                $adapter.html(text).css({opacity: state.val ? 0.7 : 0});
                $('.group-upload-progress[data-adapter-group="' + $adapter.data('adapter-group') + '"]').html(text).css({opacity: state.val ? 0.7 : 0});
            }
        }
    };
}
