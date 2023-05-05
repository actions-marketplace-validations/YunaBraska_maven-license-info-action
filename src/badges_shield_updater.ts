import {PathOrFileDescriptor, readFileSync, writeFileSync} from "fs";
import {int, isEmpty, listFiles, ResultType, str} from './common_processing';

const REGEX_BADGE_GENERIC = /!\[c_(.*?)]\s*\(.*\/badge\/(.*?)(\?.*?)?\)/mg;

const brightgreen = '4c1'
const green = '97CA00'
const yellowgreen = 'a4a61d'
const yellow = 'dfb317'
const orange = 'fe7d37'
const red = 'e05d44'
const blue = '007EC6'
const grey = '555'
const lightgrey = '9f9f9f'
const pink = 'ffc0cb'
const purple = '9370db'

function setColor(key: string, val: string, color: string): string {
    key = key.toLowerCase();
    if (key.startsWith('dependency_count')) {
        let count = int(val)
        if (count < 10) {
            color = brightgreen;
        } else if (count < 20) {
            color = green;
        } else if (count < 40) {
            color = yellowgreen;
        } else if (count < 60) {
            color = orange;
        } else {
            color = red;
        }
    } else if (key.startsWith('license_count')) {
        let count = int(val)
        if (count < 4) {
            color = brightgreen;
        } else if (count < 8) {
            color = green;
        } else if (count < 16) {
            color = yellowgreen;
        } else if (count < 32) {
            color = orange;
        } else {
            color = red;
        }
    }
    return color;
}

export function updateBadges(result: Map<string, ResultType>, workDir: string | Buffer | URL | number, deep: number) {
    listFiles(workDir, deep, '.*\\.(md|markdown|mdown|mkd|mdwn|mdtext|mdtxt)', [], 0).forEach(file => {
        const fileContentOrg = readFileSync(file, 'utf-8');
        let content = str(fileContentOrg);
        content = content.replace(REGEX_BADGE_GENERIC, (match, key, link) => {
            // Get the value from the result map based on the captured key
            return updateLink(file, key, clearKeyOrValue(str(result.get(key))), match, str(link));
        });

        // Write the updated content back to the file
        if (content !== fileContentOrg) {
            writeFileSync(file, content, 'utf-8');
            console.debug(`Saved file [${file}]`)
        }
    });
}

function updateLink(file: PathOrFileDescriptor, key: string, value: string, match: string, link: string) {
    let color: string;
    if (isEmpty(value)) {
        // value = 'not_available';
        // color = red;
        //do not replace anything as it could come from a different action
    } else {
        color = orange;
        color = setColor(key, value, isEmpty(color) ? orange : color);
        //format key
        key = clearKeyOrValue(key)
        key = key.startsWith('dependency_count')? `dependencies` + key.substring('dependency_count'.length) : key;
        key = key.startsWith('license_count')? `licenses` + key.substring('license_count'.length) : key;
        // Replace the link with the new value
        if (match.toLowerCase().includes('shields.io')) {
            console.debug(`Updated [shields.io] key [${key}] file [${file}]`)
            return match.replace(link, `${key}-${value}-${color}`);
        } else if (match.toLowerCase().includes('badgen.net')) {
            console.debug(`Updated [badgen.net] key [${key}] file [${file}]`)
            return match.replace(link, `${key}/${value}/${color}`);
        }
    }
    return match
}

function clearKeyOrValue(keyOrValue: string): string {
    return (keyOrValue.toLowerCase().startsWith('x_') ? keyOrValue.substring(2) : keyOrValue).trim().replace(/[^a-zA-Z0-9\\.\s]/g, '_').replace('__', '_').replace('._', '.');
}


