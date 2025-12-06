//https://github.com/actions/toolkit/tree/main/packages/
import {PathOrFileDescriptor} from "fs";
import {
    cmd, cmdLog,
    Dependency,
    isEmpty,
    License,
    replaceNullWithEmptyMap,
    ResultType,
    RunResult,
    ScopeResult,
    sortMap
} from './common_processing';
import path from "path";
import os from "os";
import {updateBadges} from "./badges_shield_updater";
import {saveToFiles} from "./license_writer";

const fs = require('fs');
const core = require('@actions/core');

const VERSION_PATTERN = /(\d+[\.*\d]*)/gmi
const LICENSE_NAME_PATTERN = /\(?([^\d\.\n\/\\),]+)/gmi
const AVAILABLE_SCOPES = ['compile', 'provided', 'runtime', 'test', 'system', 'import'];
const LICENSE_LIMIT_LIST = [
    'APL',
    'GPL',
    'AGPL',
    'MPL',
    'LGPL',
    'EPL',
    'EUPL',
    'CC-BY-SA',
    'CC-BY-NC',
    'Artistic[-azAZ09]*(?!1)\\d+',
]

try {
    let workDir = core.getInput('work-dir');
    let failLicenseRegex = core.getInput('fail-license-regex') || null;
    let failDependencyRegex = core.getInput('fail-dependency-regex') || null;
    let outputDir = core.getInput('output-dir') || null;
    let deep = parseInt(core.getInput('deep')) || -1;
    let excludeScopes = core.getInput('exclude-scopes') || null;
    let nullToEmpty = core.getInput('null-to-empty') || null;

    let workspace = process.env['GITHUB_WORKSPACE']?.toString() || null;
    if (!workDir || workDir === '.') {
        workDir = getWorkingDirectory(workspace);
    } else if (!path.isAbsolute(workDir.toString())) {
        outputDir = path.join(__dirname, workDir.toString())
    }
    if (outputDir === '.') {
        outputDir = workDir;
    }

    let runResult = run(
        workDir,
        deep,
        failLicenseRegex,
        failDependencyRegex,
        outputDir,
        excludeScopes,
        !isEmpty(nullToEmpty) ? nullToEmpty.toLowerCase() === 'true' : true
    );
    let result = runResult.result;
    result.set('GITHUB_WORKSPACE', workspace || null);

    console.log(JSON.stringify(Object.fromEntries(sortMap(result)), null, 4));

    result.forEach((value, key) => {
        core.setOutput(key, value);
    });

    if (runResult.errors.length != 0) {
        let errorMessage = '';
        runResult.errors.forEach(error => {
            errorMessage += `${error}${os.EOL}`;
        });
        core.setFailed(errorMessage);
    }
} catch (e) {
    if (typeof e === "string") {
        core.setFailed(e.toUpperCase());
    } else if (e instanceof Error) {
        core.setFailed(e.message);
    }
}

function run(
    workDir: PathOrFileDescriptor,
    deep: number,
    failLicenseRegex: string | null,
    failDependencyRegex: string | null,
    outputDir: PathOrFileDescriptor,
    excludeScopes: string | null,
    nullToEmpty: boolean
): RunResult {
    //DEFAULTS
    let platform = process.platform;
    excludeScopes = isEmpty(excludeScopes) ? null : excludeScopes?.trim().toLowerCase().replace(' ', '') || null;
    if (!outputDir) {
        outputDir = path.join(workDir.toString(), 'target', 'maven-license-info-action');
    } else if (!path.isAbsolute(outputDir.toString())) {
        outputDir = path.join(workDir.toString(), outputDir.toString())
    }
    let result = new Map<string, ResultType>();
    result.set('work-dir', workDir.toString());
    result.set('fail-license-regex', failLicenseRegex);
    result.set('fail-dependency-regex', failDependencyRegex);
    result.set('output-dir', outputDir.toString());
    result.set('exclude-scopes', excludeScopes);
    result.set('null-to-empty', nullToEmpty);
    if (fs.readdirSync(workDir.toString(), {withFileTypes: true}).length === 0) {
        return {result, errors: [`Empty work-dir [${workDir}] - nothing to process`]}
    }
    fs.mkdirSync(outputDir.toString(), {recursive: true});
    const scopeResult: ScopeResult = getResultsForScopes(excludeScopes, outputDir, workDir, platform);

    //sort && unique
    let licenses = scopeResult.licenses.filter((l, i, list) => i === list.findIndex((item) => item.name === l.name && item.version === l.version)).sort((a, b) => `${a.toString()}`.localeCompare(`${b.toString()}`));
    let dependencies = scopeResult.dependencies.filter((d, i, list) => i === list.findIndex((item) => item.line === d.line)).sort((a, b) => `${a.line}`.localeCompare(`${b.line}`));
    saveToFiles(scopeResult, outputDir);
    setOutputs(result, licenses, dependencies);
    updateBadges(result, workDir, deep);
    return {
        result: sortMap(nullToEmpty ? replaceNullWithEmptyMap(result) : result),
        errors: checkDependencies(dependencies, failLicenseRegex, failDependencyRegex)
    };
}

function extractDependencies(line: string, scope: string): Dependency {
    const dependency: Dependency = new Dependency();
    let matches = line.match(/(\(.*?\)\s*)/g);
    if (matches && matches.length > 1) {
        let dependencyStr = matches[matches.length - 1];
        let urlStart = Math.max(Math.max(dependencyStr.indexOf('https:'), dependencyStr.indexOf('http:')), dependencyStr.indexOf('${'));
        dependency.scope = scope;
        dependency.url = clearValue(dependencyStr.substring(urlStart));
        dependency.line = clearValue(dependencyStr.substring(0, urlStart));
        dependency.group = clearValue(dependency.line.split(':')[0]);
        dependency.artifact = clearValue(dependency.line.split(':')[1]);
        dependency.version = clearValue(dependency.line.split(':')[2]);
        //(GPL2 w/ CPE)
        for (const licenseStr of matches.slice(0, -1).flatMap((item) => item.split('w/')).flatMap((item) => item.split('/'))) {
            let versions = licenseStr.match(VERSION_PATTERN);
            let licenseVersion = versions && versions.length > 0 ? versions[versions.length - 1] : '';
            let licenseNames = licenseStr.match(LICENSE_NAME_PATTERN);
            let licenseName = licenseNames && licenseNames.length > 0 ? licenseNames[0] : '';
            licenseName = licenseName.toLowerCase().endsWith(' v') ? licenseName.substring(0, licenseName.length - 2) : licenseName;
            if (
                //invalid licenses
                !licenseName.toLowerCase().includes('without dependencies')
                && !licenseName.toLowerCase().includes('aggregator')
                && !licenseName.includes('SpEL')
            ) {
                licenseName = toLicenseShortName(clearValue(licenseName))
                licenseVersion = clearValue(licenseVersion) || '1';
                dependency.licenses.push(new License(licenseName, licenseVersion, scope, isLicenseWithLimit(`${licenseName} ${licenseVersion}`)));
            }
        }
    }
    return dependency;
}

function toLicenseShortName(licenseName: string): string {
    let words = licenseName.split(' ');
    //The Apache License => Apache License
    //The Apache Software License => Apache License
    words = words && words.length > 1 && words[0].trim().toLowerCase() === 'the' ? words.slice(1) : words;
    words = words && words.length > 2 && words[words.length - 2].trim().toLowerCase() === 'software' && words[words.length - 1].trim().toLowerCase() === 'license' ? words.filter((value) => value.trim().toLowerCase() !== 'software') : words;
    if (words && words.length > 1) {
        let hasFirstUpCaseWord = words[0] === words[0].toUpperCase();
        if (hasFirstUpCaseWord && words.length == 2 && words[1].trim().toLowerCase() === 'license') {
            //MIT License => MIT
            //BSD License => License
            return words[0];
        } else if (hasFirstUpCaseWord && words.length > 2) {
            //GNU Lesser General Public License => LGPL
            return words.slice(1).join('').replace(/[^A-Z]/g, '');
        } else if (!hasFirstUpCaseWord && words.length > 2) {
            //Eclipse Public License => EPL
            return words.join('').replace(/[^A-Z]/g, '');
        }
    }
    return words.join(' ');
}

function getLicenseList(dependencies: Dependency[]): License[] {
    let result = dependencies
        .flatMap((dep) => dep.licenses)
        .filter((license, index, self) =>
                index === self.findIndex((l) => (
                    l.name === license.name && l.version === license.version
                ))
        );
    return Object.values(result).sort((a, b) =>
        (a.name + a.version || '').localeCompare(b.name + b.version || '')
    );
}


function clearValue(input: string): string {
    input = input || '';
    input = input.replace('(', '').replace(')', '').replace('-', '').trim();
    input = input.toLowerCase().endsWith(' v') ? input.substring(0, input.length - 2).trim() : input;
    return input.endsWith('-') ? input.substring(0, input.length - 1).trim() : input;
}

function getMavenCmd(workDir: PathOrFileDescriptor, platform: string): string {
    try {
        let wrapperMapFile = path.join(workDir.toString(), '.mvn', 'wrapper', 'maven-wrapper.properties');
        let has_wrapper = (fs.existsSync(path.join(workDir.toString(), 'mvnw.cmd')) || fs.existsSync(path.join(workDir.toString(), 'mvnw')) || fs.existsSync(wrapperMapFile));
        return has_wrapper ? (platform === "win32" ? '.\\mvnw.cmd' : './mvnw') : 'mvn';
    } catch (err) {
        console.error(err);
    }
    return 'mvn';
}

function checkDependencies(dependencies: Dependency[], failLicenseRegexStr: string | null, failDependencyRegexStr: string | null): string[] {
    const errors: string[] = [];
    const failLicenseRegex = failLicenseRegexStr ? new RegExp(failLicenseRegexStr) : null;
    const failDependencyRegex = failDependencyRegexStr ? new RegExp(failDependencyRegexStr) : null;
    dependencies.forEach((dep) => {
        dep.licenses.forEach((license) => {
            if (failLicenseRegex && failLicenseRegex.test(`${license.name}:${license.version}`)) {
                const value = `License [${license.name}:${license.version}] for dependency [${dep.line}] matches the failLicenseRegex`;
                errors.push(value);
            }
        });

        if (failDependencyRegex && failDependencyRegex.test(`${dep.line}`)) {
            const value = `Dependency [${dep.line}] matches the failDependencyRegex`;
            errors.push(value);
        }
    });

    return errors;
}

function isLicenseWithLimit(license: string) {
    for (const regexStr of LICENSE_LIMIT_LIST) {
        const regex = new RegExp(`${regexStr}`, 'i');
        if (regex.test(license)) {
            return true;
        }
    }
    return false;
}

function parseDependencies(outputFile: string, scope: string) {
    let dependencies: Dependency[] = [];
    if (fs.existsSync(outputFile)) {
        fs.readFileSync(outputFile, {encoding: 'utf-8'}).split(/\r?\n/).forEach(function (line: string) {
            if (!isEmpty(line) && line.includes('(')) {
                dependencies.push(extractDependencies(line, scope))
            }
        });
    }
    return dependencies;
}


function getResultsForScopes(excludeScopes: string | null, outputDir: string | Buffer | URL | number, workDir: string | Buffer | URL | number, platform: string): ScopeResult {
    const scopeResult: ScopeResult = {
        dependencies: [],
        licenses: []
    };
    const mavenCmd = getMavenCmd(workDir, platform);
    for (let i = 0; i < AVAILABLE_SCOPES.length; i++) {
        let scope = AVAILABLE_SCOPES[i];
        if (!excludeScopes || !excludeScopes.includes(scope)) {
            let outputFileRaw = path.join(outputDir.toString(), `${scope}.raw`);
            let command_log = cmdLog(workDir, `${mavenCmd} license:add-third-party -U -Dlicense.outputDirectory="${path.dirname(outputFileRaw)}" -Dlicense.thirdPartyFilename="${path.basename(outputFileRaw)}" -Dlicense.excludedScopes="${AVAILABLE_SCOPES.filter(s => s !== scope).join(',')}"`);
            if (command_log?.toLowerCase().includes('error')) {
                break;
            }
            let scopeDependencies = parseDependencies(outputFileRaw, scope);
            if (scopeDependencies.length > 0) {
                let scopeLicenses = getLicenseList(scopeDependencies);
                scopeResult.dependencies = scopeResult.dependencies.concat(scopeDependencies);
                scopeResult.licenses = scopeResult.licenses.concat(scopeLicenses);
            }
        }
    }
    return scopeResult;
}

function setOutputs(result: Map<string, ResultType>, licenses: License[], dependencies: Dependency[]) {
    console.log(`Saving results`)
    result.set('license_count', licenses.length);
    result.set('license_list', licenses.map(l => l.name + ':' + l.version || '').join(', '));
    result.set('license_limited_list', licenses.filter(l => l.isLimited).map(l => l.name + ':' + l.version || '').join(', '));
    result.set('license_count_limited', licenses.filter(l => l.isLimited).length);
    result.set('license_count_compile', licenses.filter(l => l.scope === 'compile').length);
    result.set('license_count_provided', licenses.filter(l => l.scope === 'provided').length);
    result.set('license_count_runtime', licenses.filter(l => l.scope === 'runtime').length);
    result.set('license_count_test', licenses.filter(l => l.scope === 'test').length);
    result.set('license_count_system', licenses.filter(l => l.scope === 'system').length);
    result.set('license_count_import', licenses.filter(l => l.scope === 'import').length);

    result.set('dependency_count', dependencies.length);
    result.set('dependency_list', dependencies.map(value => value.line).join(', '));
    result.set('dependency_count_compile', dependencies.filter(l => l.scope === 'compile').length);
    result.set('dependency_count_provided', dependencies.filter(l => l.scope === 'provided').length);
    result.set('dependency_count_runtime', dependencies.filter(l => l.scope === 'runtime').length);
    result.set('dependency_count_test', dependencies.filter(l => l.scope === 'test').length);
    result.set('dependency_count_system', dependencies.filter(l => l.scope === 'system').length);
    result.set('dependency_count_import', dependencies.filter(l => l.scope === 'import').length);

    result.set('scopes', licenses.map(l => l.scope).sort((a, b) => a.localeCompare(b)).filter((scope, i, arr) => i === 0 || arr[i - 1] !== scope).join(", "));
    result.set('scopes_all', AVAILABLE_SCOPES.sort((a, b) => a.localeCompare(b)).join(', '));
    console.log(`Saving results finish`)
}

function getWorkingDirectory(workspace: string | undefined | null): PathOrFileDescriptor {
    return workspace && fs.existsSync(workspace) ? workspace : process.cwd();
}

module.exports = {run};
