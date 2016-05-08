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
 */
function LegTV(username, password) {
    this.username = username;
    this.password = password;
}

request = request.defaults({
    method: 'GET',
    path: 'http://legendas.tv/',
    headers: {
        'Host': 'legendas.tv'
    },
    jar: jar,
    proxy: this.proxy
});

/**
 * Download subtitle URL.
 *
 * @param parameters
 * @returns {promise}
 */
LegTV.prototype.download = function (parameters) {
    var def = q.defer();
    if (!parameters) {
        return def.resolve(false);
    }
    var url = parameters.url;
    var file = parameters.file;
    var subject = parameters.subject;

    console.log('Baixando legenda para %s.'.green, subject);

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
 * @returns {promise}
 */
LegTV.prototype.search = function (parameters) {
    var subject = parameters.subject;
    var def = q.defer();
    var searchUrl = 'http://legendas.tv/util/carrega_legendas_busca/' + encodeURIComponent(subject);

    request({
        url: searchUrl
    }, function (error, response, body) {
        var name = getEpisodeName(subject);
        var downloadUrl = filterDownloadList(body, name);
        if (!downloadUrl) {
            console.log('Nenhuma legenda encontrada para %s!'.yellow, subject);
            return def.resolve(false);
        }
        parameters.url = 'http://legendas.tv' + downloadUrl;
        return def.resolve(parameters);
    });

    return def.promise;
};

/**
 * Perform login at Legenda
 * @returns {promise}
 */
LegTV.prototype.login = function () {
    var def = q.defer();
    var body = '_method=POST' +
        '&' + encodeURIComponent('data[User][username]') + '=' + this.username +
        '&' + encodeURIComponent('data[User][password]') + '=' + this.password +
        '&' + encodeURIComponent('data[lembrar]') + '=on';

    request({
        method: 'POST',
        url: 'http://legendas.tv/login',
        body: body,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }, function (error, response) {
        if (error) {
            return def.reject('Falha ao conectar-se ao legendas.tv.\nVerifique sua conexão a internet e tente novamente.');
        }
        if (response.statusCode !== 302) {
            // TODO parse body and check for credentials error message.
            return def.reject('Falha ao fazer login.\nO site pode estar instável ou suas credenciais podem estar erradas. Verifique!');
        }
        console.log('Autenticado com sucesso ao legendas.tv!'.green);

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