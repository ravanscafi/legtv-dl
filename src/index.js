(function () {
    'use strict';
    var config = require(__dirname + '/../config');
    var utils = require(__dirname + '/utils');
    var legtv = require(__dirname + '/legtv').create(config.username, config.password);
    var q = require('q');
    var seriesPaths = config.seriesPaths;
    var async = require('async');

    require('colors');

    console.log('\x1Bc'); // clear console
    console.log(' _                           _            _          '.blue + '      _                     _                 _           '.green);
    console.log('| | ___  __ _  ___ _ __   __| | __ _ ___ | |___   __ '.blue + '   __| | _____      ___ __ | | ___   __ _  __| | ___ _ __ '.green);
    console.log('| |/ _ \\/ _` |/ _ \\ \'_ \\ / _` |/ _` / __|| __\\ \\ / / '.blue + '  / _` |/ _ \\ \\ /\\ / / \'_ \\| |/ _ \\ / _` |/ _` |/ _ \\ \'__|'.green);
    console.log('| |  __/ (_| |  __/ | | | (_| | (_| \\__ \\| |_ \\ V /  '.blue + ' | (_| | (_) \\ V  V /| | | | | (_) | (_| | (_| |  __/ |   '.green);
    console.log('|_|\\___|\\__, |\\___|_| |_|\\__,_|\\__,_|___(_)__| \\_/   '.blue + '  \\__,_|\\___/ \\_/\\_/ |_| |_|_|\\___/ \\__,_|\\__,_|\\___|_|   '.green);
    console.log('        |___/                                        '.blue + '                                                          '.green);
    console.log('                                                                                                 by Ravan Scafi\n'.blue);

    seriesPaths.forEach(processPath);

    function processPath(path) {
        utils
            .fileList(path)
            .then(function (response) {
                var subjectList = response.subjectList;
                var originalFiles = response.originalFiles;
                var subjectListLength = subjectList.length;

                if (!subjectListLength) {
                    console.log('Nenhum episódio sem legenda em %s.\nÓtimo, não é mesmo!? 😉\n\n'.green, path);
                    return false;
                }

                console.log('%d episódio%s sem legenda em %s. Deixa comigo! 😉'.yellow, subjectListLength, subjectListLength > 1 ? 's' : '', path);
                legtv.login()
                    .then(function () {
                        subjectList
                            .forEach(function (subject) {
                                utils.fetchSubtitle(legtv, path, subject, subjectList, originalFiles);
                            });
                    })
                    .fail(utils.errorHandler);
            });
    }

})();