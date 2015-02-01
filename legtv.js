var config = require('./config'),
    request = require('request'),
    q = require('q'),
    fs = require('fs'),
    utils = require('./utils'),
    jar = request.jar(),
    LegTVDL = module.exports;
require('colors');

request = request.defaults({
    method: 'GET',
    path: 'http://legendas.tv/',
    headers: {'Host': 'legendas.tv'},
    jar: jar,
    proxy: config.proxy
});


LegTVDL.run = function () {
    var username = config.username,
        password = config.password,
        def = q.defer();
    console.log('Legendas.TV Downloader\nBy Ravan Scafi\n'.blue);
    utils.fileList(config.seriesPath).then(function (response) {
        var fileList = response.fileList,
            subjects = response.subjects,
            len = subjects.length;

        if (!len) {
            console.log('Nenhum episódio sem legenda.\nNada a fazer.'.green);
            def.resolve(true);
        }

        console.log('%d episódio(s) sem legenda.'.yellow, len);
        LegTVDL.login(username, password).then(function () {

            subjects.forEach(function (subject) {

                var tmpFile = 'tmp/tmp' + subject + '.rar';

                LegTVDL.search(subject).then(function (response) {
                    var downloadUrl = response.downloadUrl,
                        name = response.name;

                    LegTVDL.download(downloadUrl, tmpFile, name, fileList).then(function () {
                        utils.unrar(tmpFile, name, fileList);
                    });
                });
            });
        });
    });

    return def.promise;
};

LegTVDL.download = function (url, file, name, fileList) {
    console.log('Baixando %s'.green, name);

    var def = q.defer();

    request({
        url: url
    }).pipe(fs.createWriteStream(file).on('finish', function () {
        //utils.unrar(file, name, fileList);
        def.resolve();
    }));

    return def.promise;
};

LegTVDL.search = function (subject) {
    console.log('Buscando %s'.green, subject);

    var def = q.defer(),
        searchUrl = 'http://legendas.tv/legenda/busca/' + encodeURIComponent(subject);

    request({
        url: searchUrl
    }, function (error, response, body) {
        var name = utils.getEpisodeName(subject),
            downloadUrl = 'http://legendas.tv' + utils.filterDownloadList(body, name);

        def.resolve({
            downloadUrl: downloadUrl,
            name: name
        });
    });

    return def.promise;
};

LegTVDL.login = function (username, password) {

    var def = q.defer(),
        body = '_method=POST' +
            '&' + encodeURIComponent('data[User][username]') + '=' + username +
            '&' + encodeURIComponent('data[User][password]') + '=' + password +
            '&' + encodeURIComponent('data[lembrar]') + '=on';

    request({
        method: 'POST',
        url: 'http://legendas.tv/login',
        body: body,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }, function (error, response) {
        if (response.statusCode !== 302) {
            console.log('Falha ao fazer login.'.red);
            return
        }
        console.log('Autenticado com sucesso!'.green);

        def.resolve(true);
    });

    return def.promise;
};