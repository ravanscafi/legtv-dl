var config = require(__dirname + '/../config');
var utils = require(__dirname + '/utils');
var legtv = require(__dirname + '/legtv').create(config.username, config.password, config.proxy);
var q = require('q');
var def = q.defer();
var path = config.seriesPath;

require('colors');

function run() {
    console.log('Legendas.TV Downloader\nBy Ravan Scafi\n'.blue);
    utils.fileList(path)
        .then(function (response) {
            var fileList = response.fileList;
            var subjects = response.subjects;
            var len = subjects.length;

            if (!len) {
                console.log('Nenhum episódio sem legenda.\nÓtimo!'.green);
                def.resolve(true);
            }

            console.log('%d episódio(s) sem legenda.'.yellow, len);
            legtv.login()
                .then(function () {
                    var queue = [];
                    subjects.forEach(function (subject) {
                        queue.push(fetchSubtitle(path, subject, fileList));
                    });

                    q.all(queue)
                        .then(function () {
                            def.resolve(true);
                        });
                });
        });

    return def.promise;
}

function fetchSubtitle(path, subject, fileList) {
    var tmpFile = path + '/tmp/' + subject + '.rar';
    var q = require('q');
    var def = q.defer();
    console.log('Fui chamado! %s'.red, subject);

    legtv.search(subject)
        .then(function (response) {
            var downloadUrl = response.downloadUrl;
            var name = response.name;
            return legtv.download(downloadUrl, tmpFile, name);
        })
        .then(function (response) {
            return utils.unrar(response.file, response.name, fileList);
        }).then(function () {
            return def.resolve(true);
        });

    return def.promise;
}

run();