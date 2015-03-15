var request = require('request');
var q = require('q');
var fs = require('fs');
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
 * @param parameters
 * @returns {Deferred.promise}
 */
LegTV.prototype.download = function (parameters) {
    var url = parameters.url;
    var file = parameters.file;
    var subject = parameters.subject;
    var def = q.defer();

    console.log('Baixando legenda para %s'.green, subject);

    request({
        url: url
    }).pipe(fs.createWriteStream(file).on('finish', function () {
        return def.resolve(parameters);
    }));

    return def.promise;
};

/**
 * Search for given subject
 * @param parameters
 * @returns {Deferred.promise}
 */
LegTV.prototype.search = function (parameters) {
    var subject = parameters.subject;
    var def = q.defer();
    var searchUrl = 'http://legendas.tv/util/carrega_legendas_busca/' + encodeURIComponent(subject);

    console.log('Buscando legenda para %s'.green, subject);

    request({
        url: searchUrl
    }, function (error, response, body) {
        parameters.name = getEpisodeName(subject);
        parameters.url = 'http://legendas.tv' + filterDownloadList(body, parameters.name);
        if(!parameters.url) {
            console.log('Legenda não encontrada para %s.'.red, subject);
            return def.reject();
        }
        return def.resolve(parameters);
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
            return def.reject();
        }
        console.log('Autenticado com sucesso!'.green);

        return def.resolve(true);
    });

    return def.promise;
};

/**
 * Parse
 *
 * @param body
 * @param name
 * @returns {string}
 */
function filterDownloadList(body, name) {
    //TODO pegar somente legendas em português.
    //TODO verificar possibilidade de pegar legenda em destaque (aparece nas buscas?)
    var pattern = new RegExp('(/download/\\w+/[\\w\\.%_-]+/' + name + '[\\w\\.%_-]+?)".+?(\\d+)\\sdownloads', 'gi');
    var match;
    var downloads = 0;
    var url = '';

    while (match = pattern.exec(body)) {
        if (parseInt(match[2]) > downloads) {
            downloads = parseInt(match[2]);
            url = match[1].replace(/download/, 'downloadarquivo');
        }
    }
    return url;
}

/**
 * Replace spaces with dots for search.
 *
 * @param name
 * @returns {string}
 */
function getEpisodeName(name) {
    return name.replace(/\s/g, '.');
}

/**
 * @param username
 * @param password
 * @param proxy
 * @returns {LegTV}
 */
exports.create = function (username, password, proxy) {
    return new LegTV(username, password, proxy);
};