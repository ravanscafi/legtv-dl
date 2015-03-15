var fs = require('fs');
var rarfile = require('rarfile');
var glob = require('glob');
var q = require('q');
var Utils = module.exports;
require('colors');

/**
 * List tv shows and subtitles from seriesPath.
 *
 * @param path
 * @returns {Deferred.promise}
 */
Utils.fileList = function (path) {
    var def = q.defer();
    var globFiles = path + '/**/*.@(mp4|mkv|avi|mpg|mpeg|ogg|rmvb|wmv|mov|srt)';

    glob(globFiles, function (error, files) {
        var filtered = Utils.filterFileList(files);

        return def.resolve({
            fileList: files,
            subjects: filtered
        });
    });

    return def.promise;
};

/**
 * Extract the given .rar file to target folder.
 *
 * @param parameters
 */
Utils.extract = function (parameters) {
    var file = parameters.file;
    var name = parameters.name;
    var fileList = parameters.fileList;

    console.log('Extraindo %s'.green, parameters.subject ? parameters.subject : name);

    var rf = new rarfile.RarFile(file).on('ready', function (rf) {
        var files = rf.names;
        var response = Utils.targetFolder(name, fileList);
        var path = response.path;
        var fileName = response.name;

        if (!path || !fileName) {
            console.log('Erro ao linkar legenda! :(');
            return;
        }

        var file = Utils.bestMatch(files, fileName, path);

        if (!file) {
            console.log('Nenhuma legenda encontrada! :(');
            return;
        }
        console.log('File Name: "%s"\nPath: "%s"\nMelhor Match: "%s"', fileName, path, file);

        var outfile = fs.createWriteStream(path + '/' + fileName + '.srt');
        rf.pipe(file, outfile);
    })
};

/**
 * Find the best file for target name.
 *
 * @param files
 * @param target
 * @param path
 * @returns {string|bool}
 */
Utils.bestMatch = function (files, target, path) {
    files = files.filter(function (file) {
        return /\.srt$/i.test(file) && !/^\./.test(file);
    });

    // no .srt files, no deal :(
    if (!files.length) {
        return false;
    }

    // only one, so be it
    if (files.length === 1) {
        return files[0];
    }

    // try a perfect match by target name
    var regex = new RegExp(target.replace(/\s/g, '.'), 'i');
    for (var i = 0; i < files.length; i++) {
        if (regex.test(files[i])) {
            return files[i]
        }
    }

    // try a perfect match by target folder name
    regex = new RegExp(path.split('/').pop().replace(/\s/g, '.'), 'i');
    for (i = 0; i < files.length; i++) {
        if (regex.test(files[i])) {
            return files[i]
        }
    }

    // well, we tried
    return files[0];
};

/**
 * Remove extension from files to see if their names matches (show vs subtitle)
 *
 * @param file1
 * @param file2
 * @returns {boolean}
 */
Utils.compareWithoutFileExtension = function (file1, file2) {
    file1 = file1.replace(/\.(\w+)$/, '');
    file2 = file2.replace(/\.(\w+)$/, '');

    return file1 === file2;
};

/**
 * Naive attempt to parse tv show names from file list.
 *
 * @param files
 * @returns {Array.<T>}
 */
Utils.identifyTvShows = function (files) {
    return files.map(function (file) {
        file = file
            .replace(/\.(\w+)$/, "") //remove extensão do arquivo
            .replace(/^.*\//g, "") //remove path do arquivo
            .replace(/\./g, " ") //troca pontos por espaços
            .replace(/'/g, " ") //remove aspas
            .replace(/(\D)20[01]\d(\D)/, '$1$2') //remove ano
            .replace(/(1080|720|480)[pi]/gi, '') //remove qualidade
            .replace(/(\sh\s|x)264/i, '') //remove encoding
            .replace(/(\d{2})(\d{2})(\d{2})/, 's$1e$2e$3') // 071213 => s07e12e13
            .replace(/(\d)(\d{2})(\d{2})/, 's$1e$2e$3') // 71213 => s07e12e13
            .replace(/(\d{2})(\d{2})/, 's$1e$2') // 1012 => s10e12
            .replace(/(\d)(\d{2})/, 's0$1e$2') // 309 => s03e09
            .replace(/s(\d)(e\d{2})/i, 's0$1$2') // s4e11 => s04e11
            .replace(/(s\d{2}(e\d{2}){1,2}).*$/i, '$1') // trim depois do episodio
            .replace(/\s{2,}/g, ' ') //remove varios espaços
            .replace(/^(?!.*s\d{2}e\d{2}.*)$/, ''); //remove falsos positivos

        if (!/s\d{2}(e\d{2}){1,2}/i.test(file)) return '';

        return file.toLowerCase()
    }).filter(Boolean)
};

/**
 * Get a file list, remove files that has a matching srt, then attempt to identify tv shows from files.
 *
 * @param files
 * @returns {Array.<T>}
 */
Utils.filterFileList = function (files) {
    var filtered = [];

    files.forEach(function (file) {
        if (/\.srt$/.test(file)) {
            if (filtered.length && Utils.compareWithoutFileExtension(file, filtered[filtered.length - 1])) {
                filtered.pop();
            }
        } else {
            filtered.push(file);
        }
    });

    return Utils.identifyTvShows(filtered);
};

/**
 * Find the target folder where the tv show file is, so that we can move the subtitle there.
 * @param file
 * @param list
 * @returns {{path: string, name: string}}
 */
Utils.targetFolder = function (file, list) {
    var regex = new RegExp(file.replace(/\s/g, '.'), 'i');
    var tmp;
    var response = {
        path: '',
        name: '',
    };

    //TODO improve performance (forEach run for all elements even if matched)
    list.forEach(function (el) {
        if (regex.test(el)) {
            tmp = el.split('/');

            response.name = tmp.pop().replace(/\.[^\.]+?$/, '');
            response.path = tmp.join('/');
        }
    });

    return response;
};