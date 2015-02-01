var rarfile = require('rarfile');
new rarfile.RarFile('tmp/tmpthe big bang theory s08e12.rar').on('ready', function(rf) {
    console.log(rf.names);
});