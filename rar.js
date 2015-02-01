var fs = require('fs'),
    rarfile = require('rarfile'),
    file = './test.rar';

var rf = new rarfile.RarFile(file).on('ready', function (rf) {
    var files = rf.names,
        outfile = fs.createWriteStream(files[0]);
    rf.pipe(files[0], outfile);
});