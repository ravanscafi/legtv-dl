var fs = require('fs');
var rarfile = require('rarfile'); //TODO change this package to another one that we can use with promises
var glob = require('glob');
var q = require('q');
var Utils = module.exports;
require('colors');

/**
 * List tv shows and subtitles from seriesPath.
 * @param path
 * @returns {Deferred.promise}
 */
Utils.fileList = function (path) {
    var def = q.defer();
    var globFiles = path + '/**/*.@(mp4|mkv|avi|mpg|mpeg|ogg|rmvb|wmv|mov|srt)';

    glob(globFiles, function (error, files) {
        return def.resolve(Utils.filterFileList(files));
    });

    return def.promise;
};

/**
 * Extract the given .rar file to target folder.
 * @param parameters
 */
Utils.extract = function (parameters) {
    if (!parameters) {
        return;
    }
    var file = parameters.file;
    var originalFiles = parameters.originalFiles;
    var subjectList = parameters.subjectList;
    var subject = parameters.subject;

    console.log('Extraindo %s.'.green, parameters.subject);

    new rarfile.RarFile(file).on('ready', function (rf) {
        var files = rf.names;
        var response = Utils.targetFolder(subject, subjectList, originalFiles);
        var path = response.path;
        var fileName = response.name;

        if (!path || !fileName) {
            console.log('Erro ao linkar legenda de %s! Entre em contato com o desenvolvedor.'.yellow, subject);
            return;
        }

        var file = Utils.bestMatch(files, fileName, path);

        if (!file) {
            console.log('Nenhuma legenda encontrada para %s!\nTente novamente mais tarde para ver se foi publicada ou verifique o nome do arquivo.'.yellow, subject);
            return;
        }

        var outfile = fs.createWriteStream(path + '/' + fileName + '.srt');
        rf.pipe(file, outfile);
    });
};

/**
 * Find the best file for target name.
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
            return files[i];
        }
    }

    // try a perfect match by target folder name
    // perhaps it can produce a lot of false positives, but it's better than nothing
    regex = new RegExp(path.split('/').pop().replace(/\s/g, '.'), 'i');
    for (i = 0; i < files.length; i++) {
        if (regex.test(files[i])) {
            return files[i];
        }
    }

    //TODO ask user for which subtitle he wants.

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
 * @returns {{originalFiles: Array, subjectList: Array}}
 */
Utils.identifyTvShows = function (files) {
    var filtered = files.map(function (file) {
        file = file
            .replace(/\.(\w+)$/, "") //remove extensão do arquivo
            .replace(/^.*\//g, "") //remove path do arquivo
            .replace(/\./g, " ") //troca pontos por espaços
            .replace(/'/g, " ") //remove aspas
            .replace(/(\D)20[01]\d(\D)/, '$1$2') //remove ano, 2000 e posterior - pode causar erros com séries na temporada 20, porém vale o risco.
            .replace(/(1080|720|480)[pi]/gi, '') //remove qualidade
            .replace(/(\sh\s|x)264/i, '') //remove encoding
            .replace(/(\d{2})(\d{2})(\d{2})/, 's$1e$2e$3') // 071213 => s07e12e13
            .replace(/(\d)(\d{2})(\d{2})/, 's$1e$2e$3') // 71213 => s07e12e13
            .replace(/(\d{2})(\d{2})/, 's$1e$2') // 1012 => s10e12
            .replace(/(\d)(\d{2})/, 's0$1e$2') // 309 => s03e09
            .replace(/s(\d)(e\d{2})/i, 's0$1$2') // s4e11 => s04e11
            .replace(/(s\d{2}(e\d{2}){1,2}).*$/i, '$1') // trim depois do episodio
            .replace(/\s{2,}/g, ' ') //remove varios espaços
            .replace(/^(?!.*s\d{2}e\d{2}.*)$/, ''); //remove falsos positivos (ou filmes - suporte no futuro)

        if (!/s\d{2}(e\d{2}){1,2}/i.test(file)) return false; //se não bater com o padrão de numeração de episódios

        return file.toLowerCase();
    });

    var subjectList = [];
    var originalFiles = [];

    for (var i = 0; i < filtered.length; i++) {
        if (filtered[i] !== false) {
            subjectList.push(filtered[i]);
            originalFiles.push(files[i]);
        }
    }

    return {
        originalFiles: originalFiles,
        subjectList:   subjectList
    };
};

/**
 * Get a file list, remove files that has a matching srt, then attempt to identify tv shows from files.
 *
 * @param files
 * @returns {{originalFiles: Array, subjectList: Array}}
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
 * @param subject
 * @param list
 * @param originalFiles
 * @returns {{path: string, name: string}}
 */
Utils.targetFolder = function (subject, list, originalFiles) {
    var tmp;
    var pos;
    var response = {
        path: '',
        name: '',
    };

    if ((pos = list.indexOf(subject)) > -1) {
        tmp = originalFiles[pos].split('/');

        response.name = tmp.pop().replace(/\.[^\.]+?$/, '');
        response.path = tmp.join('/');
    }

    return response;
};

/**
 * Log errors to console.
 * @param error
 */
Utils.errorHandler = function (error) {
    console.log('Erro! %s'.red, error);
};

/**
 * Handle the process of fetching a subtitle.
 * @param legtv
 * @param path
 * @param subject
 * @param subjectList
 * @param originalFiles
 * @returns {Deferred.promise}
 */
 Utils.fetchSubtitle = function (legtv, path, subject, subjectList, originalFiles) {
     var def = q.defer();
     var tmpPath = path + '/tmp/';

     fs.stat(tmpPath, function (error, stat){
         if (error) {
             try {
                 fs.mkdirSync(tmpPath, 0755)
             } catch (e) {
                 console.log(e.message())
             }
         }
     })

     var tmpFile = tmpPath + subject + '.rar';

     legtv.search({subject: subject, file: tmpFile, subjectList: subjectList, originalFiles: originalFiles})
         .then(legtv.download)
         .then(Utils.extract)
         .then(def.resolve)
         .fail(Utils.errorHandler)
         .done();

     return def.promise;
 };
