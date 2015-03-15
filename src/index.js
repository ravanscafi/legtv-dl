var config = require(__dirname + '/../config');
var utils = require(__dirname + '/utils');
var legtv = require(__dirname + '/legtv').create(config.username, config.password, config.proxy);
var q = require('q');
var path = config.seriesPath;

require('colors');

function run() {
    var def = q.defer();

    console.log('Legendas.TV Downloader\nBy Ravan Scafi\n'.blue);
    utils.fileList(path)
        .then(function (response) {
            var fileList = response.fileList;
            var subjects = response.subjects;
            var len = subjects.length;

            if (!len) {
                console.log('Nenhum episódio sem legenda.\nÓtimo!'.green);
                return def.resolve(true);
            }

            console.log('%d episódio%s sem legenda.'.yellow, len, len > 1 ? 's' : '');
            legtv.login()
                .then(function () {
                    var queue = [];

                    subjects.forEach(function (subject) {
                        queue.push(function () {
                            return fetchSubtitle(path, subject, fileList);
                        });
                    });

                    func = queue.pop();
                    queue.reduce(q.when, func());
                });
        });

    return def.promise;
}

function fetchSubtitle(path, subject, fileList) {
    var tmpFile = path + '/tmp/' + subject + '.rar';
    var def = q.defer();

    legtv.search({subject: subject, file: tmpFile, fileList: fileList})
        .then(legtv.download)
        .then(utils.extract)
        .then(def.resolve)
        .done();

    return def.promise;
}

run();