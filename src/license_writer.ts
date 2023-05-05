import fs, {PathOrFileDescriptor} from "fs";
import os from "os";
import path from "path";
import {Dependency, License, ScopeResult} from "./common_processing";

export function saveToFiles(scopeResult: ScopeResult, outputDir: PathOrFileDescriptor): void {
    const licenses = scopeResult.licenses;
    const dependencies = scopeResult.dependencies;
    writeJson(dependencies, outputDir);
    writeLicensesJson(licenses, outputDir);
    writeCsv(dependencies, outputDir);
    writeLicensesCsv(licenses, outputDir);
    writeMarkdown(dependencies, outputDir);
    writeLicensesMarkdown(licenses, outputDir)
    writeXml(dependencies, outputDir);
    writeLicensesXml(licenses, outputDir);
}

function writeJson(dependencies: Dependency[], outputFolder: PathOrFileDescriptor): void {
    console.log(`Writing file [dependencies.json]`)
    fs.writeFileSync(path.join(outputFolder.toString(), 'dependencies.json'), JSON.stringify(dependencies, null, 4));
}

function writeLicensesJson(licenses: License[], outputFolder: PathOrFileDescriptor): void {
    console.log(`Writing file [licenses.json]`)
    fs.writeFileSync(path.join(outputFolder.toString(), 'licenses.json'), JSON.stringify(licenses, null, 4));
}

function writeCsv(dependencies: Dependency[], outputFolder: PathOrFileDescriptor): void {
    console.log(`Writing file [dependencies.csv]`)
    const csvHeader = `"Line","Group","Artifact","Version","Scope","URL","Licenses"${os.EOL}`;
    const csvRows: string[] = [];
    dependencies.forEach((dep) => {
        const licenses = dep.licenses.map((lic) => `${lic.name} ${lic.version || ''}`).join(';');
        csvRows.push(`"${dep.line}","${dep.group}","${dep.artifact}","${dep.version}","${dep.scope}","${dep.url}","${licenses}"${os.EOL}`);
    });
    fs.writeFileSync(path.join(outputFolder.toString(), 'dependencies.csv'), csvHeader + csvRows.join(''));
}

function writeLicensesCsv(licenseMap: License[], outputFolder: PathOrFileDescriptor): void {
    console.log(`Writing file [licenses.csv]`)
    const csvHeader = `"Name","Version","Limited","Scope"${os.EOL}`;
    const csvRows: string[] = [];
    licenseMap.forEach((l, scope) => {
        csvRows.push(`"${l.name}","${l.version}","${l.isLimited}","${l.scope}"${os.EOL}`);
    });
    fs.writeFileSync(path.join(outputFolder.toString(), 'licenses.csv'), csvHeader + csvRows.join(''));
}

function writeMarkdown(dependencies: Dependency[], outputFolder: PathOrFileDescriptor): void {
    console.log(`Writing file [dependencies.md]`)
    let dependencyMap = dependencies.reduce((map, d) => {
        const scope = d.scope;
        const group = map.get(scope) || [];
        group.push(d);
        map.set(scope, group);
        return map;
    }, new Map<string, Dependency[]>());
    let markdown = `# Dependencies${os.EOL}${os.EOL}`;
    markdown += `| Line | Group | Artifact | Version | Scope | URL | Licenses |${os.EOL}`;
    markdown += `| ---- | ----- | -------- | ------- | ----- | --- | -------- |${os.EOL}`;
    dependencyMap.forEach((deps, scope) => {
        deps.forEach((d) => {
            const licenses = d.licenses.map((license) => `${license.name}${license.version ? ` (${license.version})` : ''}`).join('<br>');
            markdown += `| ${d.line} | ${d.group} | ${d.artifact} | ${d.version} | ${d.scope} | ${d.url} | ${licenses} |${os.EOL}`;
        });
    });
    fs.writeFileSync(path.join(outputFolder.toString(), 'dependencies.md'), markdown);
}

function writeLicensesMarkdown(licenses: License[], outputFolder: PathOrFileDescriptor): void {
    console.log(`Writing file [licenses.md]`)
    let licenseMap = licenses.reduce((map, l) => {
        const scope = l.scope;
        const group = map.get(scope) || [];
        group.push(l);
        map.set(scope, group);
        return map;
    }, new Map<string, License[]>());
    let markdown = `# Licenses${os.EOL}${os.EOL}`;
    markdown += `| Name | Version | Limited | Scope |${os.EOL}`;
    markdown += `| ---- | ------- | ------- | ----- |${os.EOL}`;
    licenseMap.forEach((lic, scope) => {
        lic.forEach((l) => {
            markdown += `| ${l.name} | ${l.version} | ${l.isLimited} | ${l.scope} |${os.EOL}`;
        });
    });
    fs.writeFileSync(path.join(outputFolder.toString(), 'licenses.md'), markdown);
}

function writeXml(dependencyMap: Dependency[], outputFolder: PathOrFileDescriptor): void {
    console.log(`Writing file [dependencies.xml]`)
    let xml = `<?xml version="1.0" encoding="UTF-8"?>${os.EOL}`
    xml += `<dependencies>${os.EOL}`
    dependencyMap.forEach((dep) => {
        xml += `    <dependency>${os.EOL}`
        xml += `        <groupId>${dep.group}</groupId>${os.EOL}`
        xml += `        <artifactId>${dep.artifact}</artifactId>${os.EOL}`
        xml += `        <version>${dep.version}</version>${os.EOL}`
        xml += `        <scope>${dep.scope}</scope>${os.EOL}`
        xml += `        <url>${dep.url}</url>${os.EOL}`
        xml += `        <licenses>${os.EOL}`;
        dep.licenses.forEach((license) => {
            xml += `            <license>${os.EOL}`
            xml += `                <name>${license.name}</name>${os.EOL}`;
            if (license.version) {
                xml += `                <version>${license.version}</version>${os.EOL}`;
            }
            xml += `            </license>${os.EOL}`;
        });
        xml += `        </licenses>${os.EOL}`;
        xml += `    </dependency>${os.EOL}`;
    });
    xml += `</dependencies>${os.EOL}`;
    fs.writeFileSync(path.join(outputFolder.toString(), 'dependencies.xml'), xml);
}

function writeLicensesXml(licenseMap: License[], outputFolder: PathOrFileDescriptor): void {
    console.log(`Writing file [licenses.xml]`)
    let xml = `<?xml version="1.0" encoding="UTF-8"?>${os.EOL}`
    xml += `<licenses>${os.EOL}`
    licenseMap.forEach((l, scope) => {
        xml += `    <license>${os.EOL}`
        xml += `        <name>${l.name}</name>${os.EOL}`
        xml += `        <version>${l.version}</version>${os.EOL}`
        xml += `        <version>${l.scope}</version>${os.EOL}`
        xml += `        <limited>${l.isLimited}</limited>${os.EOL}`
        xml += `    </license>${os.EOL}`
    });
    xml += `</licenses>${os.EOL}`;
    fs.writeFileSync(path.join(outputFolder.toString(), 'licenses.xml'), xml);
}
