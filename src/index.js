(function () {
    'use strict';

    var config = require(__dirname + '/../config');
    var utils = require(__dirname + '/utils');
    var legtv = require(__dirname + '/legtv').create(config.username, config.password, config.proxy);
    var q = require('q');
    var def = q.defer();
    require('colors');

    console.log('Legendas.TV Downloader\nBy Ravan Scafi\n'.blue);

    utils.fileList(config.seriesPath)
        .then(function (response) {
            var fileList = response.fileList;
            var subjects = response.subjects;
            var len = subjects.length;

            if (!len) {
                console.log('Nenhum episódio sem legenda.\nÓtimo!'.green);
                def.resolve(true);
            }

            console.log('%d episódio(s) sem legenda.'.yellow, len);
            legtv.login().then(function () {

                subjects.forEach(function (subject) {
                    var tmpFile = config.seriesPath + '/tmp/' + subject + '.rar';

                    legtv.search(subject)
                        .then(function (response) {
                            var downloadUrl = response.downloadUrl;
                            var name = response.name;
                            return legtv.download(downloadUrl, tmpFile, name, fileList);
                        })
                        .then(function () {
                            //TODO fix folder inside rar breaking everything
                            return utils.unrar(tmpFile, name, fileList);
                        });
                });
            });
        });

    return def.promise;
})();