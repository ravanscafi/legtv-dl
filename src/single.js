var config = require(__dirname + '/../config');
var legtv = require(__dirname + '/legtv').create(config.username, config.password, config.proxy);
var rarfile = require('rarfile');
var fs = require('fs');

var path = config.seriesPath + '/tmp/';

//uso: node src/single The Walking Dead s05e10
var subject = process.argv.splice(2).join(' ');

legtv.login()
    .then(function () {
        return legtv.search(subject)
    })
    .then(function (response) {
        var downloadUrl = response.downloadUrl;
        var name = response.name;
        var tmpFile = path + subject + '.rar';
        return legtv.download(downloadUrl, tmpFile, name);
    })
    .then(function (download) {
        var rf = new rarfile.RarFile(download.file).on('ready', function (rf) {
            var files = rf.names;
            var targetPath = path + download.name + '/';
            console.log('Extraindo para %s'.green, targetPath);

            fs.mkdir(targetPath);

            files.forEach(function (file) {
                if (!/\.srt$/i.test(file) || /__MACOSX/i.test(file))
                    return;

                file = file.replace(/^.*\\/g, "");

                var outfile = fs.createWriteStream(targetPath + file);
                rf.pipe(file, outfile);
            });
        });
    });