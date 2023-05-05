"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveToFiles = void 0;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
function saveToFiles(scopeResult, outputDir) {
    const licenses = scopeResult.licenses;
    const dependencies = scopeResult.dependencies;
    writeJson(dependencies, outputDir);
    writeLicensesJson(licenses, outputDir);
    writeCsv(dependencies, outputDir);
    writeLicensesCsv(licenses, outputDir);
    writeMarkdown(dependencies, outputDir);
    writeLicensesMarkdown(licenses, outputDir);
    writeXml(dependencies, outputDir);
    writeLicensesXml(licenses, outputDir);
}
exports.saveToFiles = saveToFiles;
function writeJson(dependencies, outputFolder) {
    console.log(`Writing file [dependencies.json]`);
    fs_1.default.writeFileSync(path_1.default.join(outputFolder.toString(), 'dependencies.json'), JSON.stringify(dependencies, null, 4));
}
function writeLicensesJson(licenses, outputFolder) {
    console.log(`Writing file [licenses.json]`);
    fs_1.default.writeFileSync(path_1.default.join(outputFolder.toString(), 'licenses.json'), JSON.stringify(licenses, null, 4));
}
function writeCsv(dependencies, outputFolder) {
    console.log(`Writing file [dependencies.csv]`);
    const csvHeader = `"Line","Group","Artifact","Version","Scope","URL","Licenses"${os_1.default.EOL}`;
    const csvRows = [];
    dependencies.forEach((dep) => {
        const licenses = dep.licenses.map((lic) => `${lic.name} ${lic.version || ''}`).join(';');
        csvRows.push(`"${dep.line}","${dep.group}","${dep.artifact}","${dep.version}","${dep.scope}","${dep.url}","${licenses}"${os_1.default.EOL}`);
    });
    fs_1.default.writeFileSync(path_1.default.join(outputFolder.toString(), 'dependencies.csv'), csvHeader + csvRows.join(''));
}
function writeLicensesCsv(licenseMap, outputFolder) {
    console.log(`Writing file [licenses.csv]`);
    const csvHeader = `"Name","Version","Limited","Scope"${os_1.default.EOL}`;
    const csvRows = [];
    licenseMap.forEach((l, scope) => {
        csvRows.push(`"${l.name}","${l.version}","${l.isLimited}","${l.scope}"${os_1.default.EOL}`);
    });
    fs_1.default.writeFileSync(path_1.default.join(outputFolder.toString(), 'licenses.csv'), csvHeader + csvRows.join(''));
}
function writeMarkdown(dependencies, outputFolder) {
    console.log(`Writing file [dependencies.md]`);
    let dependencyMap = dependencies.reduce((map, d) => {
        const scope = d.scope;
        const group = map.get(scope) || [];
        group.push(d);
        map.set(scope, group);
        return map;
    }, new Map());
    let markdown = `# Dependencies${os_1.default.EOL}${os_1.default.EOL}`;
    markdown += `| Line | Group | Artifact | Version | Scope | URL | Licenses |${os_1.default.EOL}`;
    markdown += `| ---- | ----- | -------- | ------- | ----- | --- | -------- |${os_1.default.EOL}`;
    dependencyMap.forEach((deps, scope) => {
        deps.forEach((d) => {
            const licenses = d.licenses.map((license) => `${license.name}${license.version ? ` (${license.version})` : ''}`).join('<br>');
            markdown += `| ${d.line} | ${d.group} | ${d.artifact} | ${d.version} | ${d.scope} | ${d.url} | ${licenses} |${os_1.default.EOL}`;
        });
    });
    fs_1.default.writeFileSync(path_1.default.join(outputFolder.toString(), 'dependencies.md'), markdown);
}
function writeLicensesMarkdown(licenses, outputFolder) {
    console.log(`Writing file [licenses.md]`);
    let licenseMap = licenses.reduce((map, l) => {
        const scope = l.scope;
        const group = map.get(scope) || [];
        group.push(l);
        map.set(scope, group);
        return map;
    }, new Map());
    let markdown = `# Licenses${os_1.default.EOL}${os_1.default.EOL}`;
    markdown += `| Name | Version | Limited | Scope |${os_1.default.EOL}`;
    markdown += `| ---- | ------- | ------- | ----- |${os_1.default.EOL}`;
    licenseMap.forEach((lic, scope) => {
        lic.forEach((l) => {
            markdown += `| ${l.name} | ${l.version} | ${l.isLimited} | ${l.scope} |${os_1.default.EOL}`;
        });
    });
    fs_1.default.writeFileSync(path_1.default.join(outputFolder.toString(), 'licenses.md'), markdown);
}
function writeXml(dependencyMap, outputFolder) {
    console.log(`Writing file [dependencies.xml]`);
    let xml = `<?xml version="1.0" encoding="UTF-8"?>${os_1.default.EOL}`;
    xml += `<dependencies>${os_1.default.EOL}`;
    dependencyMap.forEach((dep) => {
        xml += `    <dependency>${os_1.default.EOL}`;
        xml += `        <groupId>${dep.group}</groupId>${os_1.default.EOL}`;
        xml += `        <artifactId>${dep.artifact}</artifactId>${os_1.default.EOL}`;
        xml += `        <version>${dep.version}</version>${os_1.default.EOL}`;
        xml += `        <scope>${dep.scope}</scope>${os_1.default.EOL}`;
        xml += `        <url>${dep.url}</url>${os_1.default.EOL}`;
        xml += `        <licenses>${os_1.default.EOL}`;
        dep.licenses.forEach((license) => {
            xml += `            <license>${os_1.default.EOL}`;
            xml += `                <name>${license.name}</name>${os_1.default.EOL}`;
            if (license.version) {
                xml += `                <version>${license.version}</version>${os_1.default.EOL}`;
            }
            xml += `            </license>${os_1.default.EOL}`;
        });
        xml += `        </licenses>${os_1.default.EOL}`;
        xml += `    </dependency>${os_1.default.EOL}`;
    });
    xml += `</dependencies>${os_1.default.EOL}`;
    fs_1.default.writeFileSync(path_1.default.join(outputFolder.toString(), 'dependencies.xml'), xml);
}
function writeLicensesXml(licenseMap, outputFolder) {
    console.log(`Writing file [licenses.xml]`);
    let xml = `<?xml version="1.0" encoding="UTF-8"?>${os_1.default.EOL}`;
    xml += `<licenses>${os_1.default.EOL}`;
    licenseMap.forEach((l, scope) => {
        xml += `    <license>${os_1.default.EOL}`;
        xml += `        <name>${l.name}</name>${os_1.default.EOL}`;
        xml += `        <version>${l.version}</version>${os_1.default.EOL}`;
        xml += `        <version>${l.scope}</version>${os_1.default.EOL}`;
        xml += `        <limited>${l.isLimited}</limited>${os_1.default.EOL}`;
        xml += `    </license>${os_1.default.EOL}`;
    });
    xml += `</licenses>${os_1.default.EOL}`;
    fs_1.default.writeFileSync(path_1.default.join(outputFolder.toString(), 'licenses.xml'), xml);
}
