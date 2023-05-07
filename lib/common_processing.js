"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFiles = exports.execCmd = exports.cmdLog = exports.cmd = exports.replaceNullWithEmptyMap = exports.sortMap = exports.isEmpty = exports.strShort = exports.int = exports.str = exports.Dependency = exports.License = void 0;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
class License {
    constructor(name, version, scope, isLimited = false) {
        this.name = name;
        this.version = version;
        this.scope = scope;
        this.isLimited = isLimited;
    }
    toString() {
        return `name [${this.name}] version [${this.version}] limited [${this.isLimited}] scope [${this.scope}]`;
    }
}
exports.License = License;
class Dependency {
    constructor() {
        this.line = '';
        this.group = '';
        this.artifact = '';
        this.version = '';
        this.scope = '';
        this.url = '';
        this.licenses = [];
    }
    toString() {
        return `group [${this.group}] artifact [${this.artifact}] version [${this.version}] scope [${this.scope}]`;
    }
}
exports.Dependency = Dependency;
function str(result) {
    return (result !== null && result !== void 0 ? result : '').toString();
}
exports.str = str;
function int(result) {
    if (typeof result === 'number') {
        return result;
    }
    else if (typeof result === 'string') {
        const parsedInt = Number.parseInt(result, 10);
        if (Number.isNaN(parsedInt)) {
            return 0;
        }
        return parsedInt;
    }
    else {
        return 0;
    }
}
exports.int = int;
function strShort(input, cutAt) {
    input = input.trim();
    let threshold = input.endsWith('.') ? 2 : 3;
    if (cutAt > threshold && input.length > (cutAt - threshold)) {
        return input.substring(0, (cutAt - threshold)) + ".".repeat(threshold);
    }
    else {
        return input;
    }
}
exports.strShort = strShort;
function isEmpty(input) {
    return input === null || input === undefined || String(input).trim().length === 0;
}
exports.isEmpty = isEmpty;
function sortMap(input) {
    const sortedEntries = Array.from(input.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return new Map(sortedEntries);
}
exports.sortMap = sortMap;
function replaceNullWithEmptyMap(input) {
    const output = new Map();
    input.forEach((value, key) => {
        if (value === null || value === undefined || value === 'null') {
            output.set(key, '');
        }
        else {
            output.set(key, value);
        }
    });
    return output;
}
exports.replaceNullWithEmptyMap = replaceNullWithEmptyMap;
function cmd(workDir, ...commands) {
    return execCmd(workDir, false, commands);
}
exports.cmd = cmd;
function cmdLog(workDir, ...commands) {
    return execCmd(workDir, true, commands);
}
exports.cmdLog = cmdLog;
function execCmd(workDir, logError, commands) {
    for (const command of commands) {
        let result = null;
        try {
            let devNull = os_1.default.platform().toLowerCase().startsWith('win') ? " 2>NUL" : " 2>/dev/null";
            result = require('child_process').execSync(command + (logError ? devNull : ''), {
                cwd: workDir.toString(),
                encoding: 'utf8',
                timeout: 10000
            });
        }
        catch (error) {
            if (logError) {
                console.debug(error);
            }
            return (error === null || error === void 0 ? void 0 : error.toString()) || 'Error';
            // continue;
        }
        if (!isEmpty(result)) {
            return result.trim();
        }
    }
    return null;
}
exports.execCmd = execCmd;
function listFiles(dir, deep, filter, resultList, deep_current) {
    deep_current = deep_current || 0;
    resultList = resultList || [];
    if (deep > -1 && deep_current > deep) {
        return resultList;
    }
    const files = fs_1.default.readdirSync(dir.toString(), { withFileTypes: true });
    for (const file of files) {
        if (file.isDirectory()) {
            listFiles(path_1.default.join(dir.toString(), file.name), deep, filter, resultList, deep_current++);
        }
        else if (!filter || new RegExp(filter).test(file.name)) {
            resultList.push(path_1.default.join(dir.toString(), file.name));
        }
    }
    return resultList;
}
exports.listFiles = listFiles;
