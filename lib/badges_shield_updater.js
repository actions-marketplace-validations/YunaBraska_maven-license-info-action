"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBadges = void 0;
const fs_1 = require("fs");
const common_processing_1 = require("./common_processing");
const REGEX_BADGE_GENERIC = /!\[c_(.*?)]\s*\(.*\/badge\/(.*?)(\?.*?)?\)/mg;
const brightgreen = '4c1';
const green = '97CA00';
const yellowgreen = 'a4a61d';
const yellow = 'dfb317';
const orange = 'fe7d37';
const red = 'e05d44';
const blue = '007EC6';
const grey = '555';
const lightgrey = '9f9f9f';
const pink = 'ffc0cb';
const purple = '9370db';
function setColor(key, val, color) {
    key = key.toLowerCase();
    if (key.startsWith('dependency_count')) {
        let count = (0, common_processing_1.int)(val);
        if (count < 10) {
            color = brightgreen;
        }
        else if (count < 20) {
            color = green;
        }
        else if (count < 40) {
            color = yellowgreen;
        }
        else if (count < 60) {
            color = orange;
        }
        else {
            color = red;
        }
    }
    else if (key.startsWith('license_count')) {
        let count = (0, common_processing_1.int)(val);
        if (count < 4) {
            color = brightgreen;
        }
        else if (count < 8) {
            color = green;
        }
        else if (count < 16) {
            color = yellowgreen;
        }
        else if (count < 32) {
            color = orange;
        }
        else {
            color = red;
        }
    }
    return color;
}
function updateBadges(result, workDir, deep) {
    (0, common_processing_1.listFiles)(workDir, deep, '.*\\.(md|markdown|mdown|mkd|mdwn|mdtext|mdtxt)', [], 0).forEach(file => {
        const fileContentOrg = (0, fs_1.readFileSync)(file, 'utf-8');
        let content = (0, common_processing_1.str)(fileContentOrg);
        content = content.replace(REGEX_BADGE_GENERIC, (match, key, link) => {
            // Get the value from the result map based on the captured key
            return updateLink(file, key, clearKeyOrValue((0, common_processing_1.str)(result.get(key))), match, (0, common_processing_1.str)(link));
        });
        // Write the updated content back to the file
        if (content !== fileContentOrg) {
            (0, fs_1.writeFileSync)(file, content, 'utf-8');
            console.debug(`Saved file [${file}]`);
        }
    });
}
exports.updateBadges = updateBadges;
function updateLink(file, key, value, match, link) {
    let color;
    if ((0, common_processing_1.isEmpty)(value)) {
        // value = 'not_available';
        // color = red;
        //do not replace anything as it could come from a different action
    }
    else {
        color = orange;
        color = setColor(key, value, (0, common_processing_1.isEmpty)(color) ? orange : color);
        //format key
        key = clearKeyOrValue(key);
        key = key.startsWith('dependency_count') ? `dependencies` + key.substring('dependency_count'.length) : key;
        key = key.startsWith('license_count') ? `licenses` + key.substring('license_count'.length) : key;
        // Replace the link with the new value
        if (match.toLowerCase().includes('shields.io')) {
            console.debug(`Updated [shields.io] key [${key}] file [${file}]`);
            return match.replace(link, `${key}-${value}-${color}`);
        }
        else if (match.toLowerCase().includes('badgen.net')) {
            console.debug(`Updated [badgen.net] key [${key}] file [${file}]`);
            return match.replace(link, `${key}/${value}/${color}`);
        }
    }
    return match;
}
function clearKeyOrValue(keyOrValue) {
    return (keyOrValue.toLowerCase().startsWith('x_') ? keyOrValue.substring(2) : keyOrValue).trim().replace(/[^a-zA-Z0-9\\.\s]/g, '_').replace('__', '_').replace('._', '.');
}
