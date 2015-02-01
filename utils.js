var fs = require('fs'),
    rarfile = require('rarfile'),
    glob = require('glob'),
    q = require('q'),
    Utils = module.exports;
require('colors');

Utils.fileList = function (path) {
    var def = q.defer(),
        globFiles = path + '/**/*.@(mp4|mkv|avi|mpg|mpeg|ogg|rmvb|wmv|mov|srt)';

    glob(globFiles, function (error, files) {
        var filtered = Utils.filterFileList(files);

        def.resolve({
            fileList: files,
            subjects: filtered
        });
    });

    return def.promise;
};

Utils.unrar = function (rarFile, targetName, fileList) {
    console.log('Extraindo %s'.green, targetName);

    var rf = new rarfile.RarFile(rarFile).on('ready', function (rf) {
        var files = rf.names,
            path = Utils.targetFolder(targetName, fileList);

        files.forEach(function (file) {
            if (!/\.srt$/i.test(file) || /__MACOSX/i.test(file))
                return;

            file = file.replace(/^.*\\/g, "");


            var outfile = fs.createWriteStream(path + file);
            rf.pipe(file, outfile);
        })
    })
};

Utils.filterDownloadList = function (body, name) {
    var pattern = new RegExp('(/download/\\w+/[\\w\\.%_-]+/' + name + '[\\w\\.%_-]+?)".+?(\\d+)\\sdownloads', 'gi'),
        match,
        downloads = 0,
        url = '';

    while (match = pattern.exec(body)) {
        if (match[2] > downloads) {
            downloads = match[2];
            url = match[1].replace(/download/, 'downloadarquivo');
        }
    }
    return url;
};

Utils.getEpisodeName = function (name) {
    return name.replace(/\s/g, '.');
};


Utils.compareWithoutFileExtension = function (file1, file2) {
    file1 = file1.replace(/\.(\w+)$/, '');
    file2 = file2.replace(/\.(\w+)$/, '');

    return file1 === file2;
};

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
            .replace(/(\d{2})(\d{2})/, 's$1e$2') // 1012 => s10e12
            .replace(/(\d)(\d{2})/, 's0$1e$2') // 309 => s03e09
            .replace(/s(\d)(e\d{2})/i, 's0$1$2') // s4e11 => s04e11
            .replace(/(s\d{2}e\d{2}).*$/i, '$1') // trim depois do episodio
            .replace(/\s{2,}/g, ' ') //remove varios espaços
            .replace(/^(?!.*s\d{2}e\d{2}.*)$/, ''); //remove falsos positivos

        if (!/s\d{2}e\d{2}/i.test(file)) return '';

        return file.toLowerCase()
    }).filter(Boolean)
};

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

Utils.targetFolder = function (file, list) {
    var regex = new RegExp(module.exports.getEpisodeName(file), 'i'),
        match = './';

    list.forEach(function (el) {
        if (regex.test(el)) {
            match = el.replace(/\/[^\/]+$/, '/');
        }
    });

    return match;
};