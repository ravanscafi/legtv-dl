var config = require('./config'),
    q = require('q'),
    glob = require('glob'),
    subtitlesGlob = config.seriesPath + '/**/*.@(srt)',
    tvShowsGlob = config.seriesPath + '/**/*.@(mp4|mkv|avi|mpg|mpeg|ogg|rmvb|wmv|mov)';

/**
 * Perform missing subtitles search.
 */
function run() {
    q.nfcall(glob, subtitlesGlob)
        .then(removeExtensionList)
        .then(searchTvShows);
}

/**
 * @param {string} el
 * @returns {string}
 */
function removeExtension(el) {
    return el.replace(/\.[^\.]+?$/i, '');
}

/**
 * @param {Array} list
 * @returns {Array}
 */
function removeExtensionList(list) {
    return list.map(removeExtension);
}

/**
 * Search for TV Shows and ask for subtitle if not found.
 * @param subsList
 */
function searchTvShows(subsList) {
    glob(tvShowsGlob).on('match', function (elem) {
        elem = removeExtension(elem);

        if (subsList.indexOf(elem) < 0)
            retriveSubtitle(elem);
    });
}

function retriveSubtitle(tvShowFile) {
    console.log(tvShowFile);
}

run();