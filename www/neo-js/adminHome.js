function Home(main) {
    "use strict";

    var that = this;
    this.menuIcon = 'fa-home';

    this.main = main;

    this.prepare = function () {
        $('#menu-home-div').load("templates/home.html", function () {

        });
    };

    this.init = function () {

        if (this.main.currentHost) {
            var totalRam = that.main.menus.instances.calculateTotalRam('home');
            var freeRam = that.main.menus.instances.calculateFreeMem('home');
            $('#homeTotalRamText').text($.i18n('totalRamText', totalRam, freeRam));

            var logSize = that.main.menus.logs.logSize;
            $('#homeLogSize').text(logSize + " MB");

            that.main.menus.adapters.getAdaptersInfo(this.main.currentHost, null, null, function (repository, installedList) {

                var listUpdatable = [];
                var listNew = [];

                if (installedList) {
                    for (var adapter in installedList) {
                        if (!installedList.hasOwnProperty(adapter)) {
                            continue;
                        }
                        var obj = installedList[adapter];
                        if (!obj || obj.controller || adapter === 'hosts' || !obj.version) {
                            continue;
                        }
                        var version = '';
                        if (repository[adapter] && repository[adapter].version) {
                            version = repository[adapter].version;
                        }
                        if (!that.main.upToDate(version, obj.version)) {
                            listUpdatable.push(adapter);
                        }

                    }
                    listUpdatable.sort();
                }
                fillList('update', listUpdatable, repository, installedList);

                var now = new Date();
                for (var adapter in repository) {
                    if (!repository.hasOwnProperty(adapter)) {
                        continue;
                    }
                    var obj = repository[adapter];
                    if (!obj || obj.controller) {
                        continue;
                    }
                    if (installedList && installedList[adapter]) {
                        continue;
                    }
                    if (!obj.published || !((now - new Date(obj.published)) < 3600000 * 24 * 31)) {
                        continue;
                    }
                    listNew.push(adapter);
                }
                listNew.sort();

                fillList('new', listNew, repository, installedList);

            });
        }

        requestCrossDomain("http://forum.iobroker.net/feed.php?mode=topics", that.getForumData);

        this.main.fillContent('#menu-home-div');

        startClock();
    };

    this.getForumData = function (data) {
        if (data['results'] && data['results'][0]) {
            var $forumContent = $($.parseXML(data['results'][0]));

            $('#forumTitle').text($forumContent.find('title:first').text());
            $('#forumTime').text($forumContent.find('updated:first').text());
            $('#forum-link').attr("href", $forumContent.find('link:nth-of-type(2)').attr('href'));

            $('#forumList').empty();
            $('entry', $forumContent).each(function () {
                var $item = $('#forumEntryTemplate').children().clone(true, true);
                $item.find('.forumClass').text($(this).find('category').eq(0).attr('label').replace('ioBroker ', ''));
                $item.find('.titleLink').text($(this).find('title').eq(0).text())
                        .attr('href', $(this).find('link').eq(0).attr('href'));
                $item.find('.description').html($(this).find('content').eq(0).text());
                $item.find('.postimage').addClass('img-responsive');
                $item.find('.description a').attr('target', '_blank');
                $item.find('.byline').text(main.formatDate(new Date($(this).find('updated').eq(0).text()), false, true) + " - " + $(this).find('name').eq(0).text());
                $('#forumList').prepend($item);
            });
        }
    };

    function fillList(type, list, repository, installedList) {
        var $ul = $('#' + type + 'HomeList');
        $ul.empty();

        var isInstalled = type === "update";

        for (var i = 0; i < list.length; i++) {

            var $tmpLiElement = $('#' + type + 'HomeListTemplate').children().clone(true, true);

            var adapter = list[i];
            var obj = isInstalled ? (installedList ? installedList[adapter] : null) : repository[adapter];

            $tmpLiElement.find('.title').text((obj.title || '').replace('ioBroker Visualisation - ', ''));
            $tmpLiElement.find('.version').text(obj.version);

            if (isInstalled && repository[adapter]) {
                $tmpLiElement.find('.newVersion').text(repository[adapter].version);
                var news = that.main.menus.adapters.getNews(obj.version, repository[adapter])
                if (news) {
                    $tmpLiElement.find('.notesVersion').attr('title', news);
                } else {
                    $tmpLiElement.find('.notesVersion').remove();
                }
            } else if (!isInstalled) {
                if (obj.readme) {
                    $tmpLiElement.find('.adapter-readme-submit').attr('data-md-url', obj.readme.replace('https://github.com', 'https://raw.githubusercontent.com').replace('blob/', ''));
                } else {
                    $tmpLiElement.find('.adapter-readme-submit').remove();
                }
            }

            $ul.append($tmpLiElement);
        }
    }

    function startClock() {
        isClockOn = true;
        secInterval = setInterval(function () {
            var seconds = new Date().getSeconds();
            var sdegree = seconds * 6;
            var srotate = "rotate(" + sdegree + "deg)";

            $("#cssSec").css({"-moz-transform": srotate, "-webkit-transform": srotate});

        }, 1000);


        hourInterval = setInterval(function () {
            var hours = new Date().getHours();
            if (hours === 0) {
                getActualDate();
            }
            var mins = new Date().getMinutes();
            var hdegree = hours * 30 + (mins / 2);
            var hrotate = "rotate(" + hdegree + "deg)";

            $("#cssHour").css({"-moz-transform": hrotate, "-webkit-transform": hrotate});

        }, 1000);


        minInterval = setInterval(function () {
            var mins = new Date().getMinutes();
            var mdegree = mins * 6;
            var mrotate = "rotate(" + mdegree + "deg)";

            $("#cssMin").css({"-moz-transform": mrotate, "-webkit-transform": mrotate});

        }, 1000);

        getActualDate();

        $(window).on('resize', checkWindowSize);
        checkWindowSize();
    }

    function getActualDate() {
        var MONTH = [
            'january',
            'february',
            'march',
            'april',
            'may',
            'june',
            'july',
            'august',
            'september',
            'october',
            'november',
            'december'
        ];
        var DOW = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday'
        ];
        var date = new Date();
        $('#date_now').text(date.getDate() + ". " + $.i18n(MONTH[date.getMonth()]) + " " + date.getFullYear());
        $('#weekday_now').text($.i18n(DOW[date.getDay()]));
    }

    function checkWindowSize() {
        var windowsize = $(window).width();
        if (windowsize < 992) {
            $('.clock').prependTo('.justify-content-start');
        } else {
            $('.clock').appendTo('.justify-content-start');
        }
    }

}