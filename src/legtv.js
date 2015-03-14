var request = require('request');
var q = require('q');
var fs = require('fs');
var utils = require(__dirname + '/utils');
var jar = request.jar();
require('colors');

/**
 * Classe LegTV.
 *
 * @constructor
 * @param username
 * @param password
 * @param proxy
 */
function LegTV(username, password, proxy) {
    this.username = username;
    this.password = password;
    this.proxy = proxy || false;
}

request = request.defaults({
    method:  'GET',
    path:    'http://legendas.tv/',
    headers: {
        'Host': 'legendas.tv'
    },
    jar:     jar,
    proxy:   this.proxy
});

/**
 * Download subtitle URL.
 *
 * @param url
 * @param file
 * @param name
 * @returns {Deferred.promise}
 */
LegTV.prototype.download = function (url, file, name) {
    var def = q.defer();

    console.log('Baixando %s'.green, name);

    request({
        url: url
    }).pipe(fs.createWriteStream(file).on('finish', function () {
        def.resolve({
            name: name,
            file: file,
        });
    }));

    return def.promise;
};

/**
 * Search for given subject
 * @param subject
 * @returns {Deferred.promise}
 */
LegTV.prototype.search = function (subject) {
    var def = q.defer();
    var searchUrl = 'http://legendas.tv/legenda/busca/' + encodeURIComponent(subject);

    console.log('Buscando %s'.green, subject);

    request({
        url: searchUrl
    }, function (error, response, body) {
        var name = utils.getEpisodeName(subject);
        var downloadUrl = 'http://legendas.tv' + utils.filterDownloadList(body, name);

        def.resolve({
            downloadUrl: downloadUrl,
            name:        name
        });
    });

    return def.promise;
};

/**
 * Perform login at Legenda
 * @returns {Deferred.promise}
 */
LegTV.prototype.login = function () {
    var def = q.defer();
    var body = '_method=POST' +
        '&' + encodeURIComponent('data[User][username]') + '=' + this.username +
        '&' + encodeURIComponent('data[User][password]') + '=' + this.password +
        '&' + encodeURIComponent('data[lembrar]') + '=on';

    request({
        method:  'POST',
        url:     'http://legendas.tv/login',
        body:    body,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }, function (error, response) {
        if (response.statusCode !== 302) {
            console.log('Falha ao fazer login.'.red);
            return;
        }
        console.log('Autenticado com sucesso!'.green);

        def.resolve(true);
    });

    return def.promise;
};

/**
 * @param username
 * @param password
 * @param proxy
 * @returns {LegTV}
 */
exports.create = function (username, password, proxy) {
    return new LegTV(username, password, proxy);
};