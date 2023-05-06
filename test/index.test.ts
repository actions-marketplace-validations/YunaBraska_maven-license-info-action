import * as fs from "fs";
import {PathOrFileDescriptor} from "fs";
import * as os from 'os';
import * as path from 'path';
import {isEmpty} from '../src/common_processing';

const main = require('../src/index');

let workDir: PathOrFileDescriptor;

beforeEach(() => {
    workDir = path.join(os.tmpdir(), 'license_info_action_test');
    removeDir(workDir);
    copyDir(path.join(__dirname, addWinSupport('resources/maven/project/wrapper_17')), workDir)
});

afterEach(() => {
    removeDir(workDir);
});

test('Test on empty dir', () => {
    workDir = path.join(workDir.toString(), 'empty_dir');
    fs.mkdirSync(workDir);
    let outputs = main.run(null, workDir, -1, null, null, null, null, null);
    expect(outputs.errors[0]).toEqual(`Empty work-dir [${workDir}] - nothing to process`);
});

//Also used for shield demo
test('Test on wrapper_17 dir', () => {
    let realWorkDir = path.join(__dirname, addWinSupport('resources/maven/project/wrapper_17'));
    let outputs = main.run(null, realWorkDir, -1, null, null, null, null, null);
    expect(outputs.result.get('scopes')).toEqual('compile, test');
    expect(outputs.result.get('scopes_all')).toEqual('compile, import, provided, runtime, system, test');

    expect(outputs.result.get('dependency_count')).toEqual(63);
    expect(outputs.result.get('dependency_count_compile')).toEqual(34);
    expect(outputs.result.get('dependency_count_import')).toEqual(0);
    expect(outputs.result.get('dependency_count_provided')).toEqual(0);
    expect(outputs.result.get('dependency_count_runtime')).toEqual(0);
    expect(outputs.result.get('dependency_count_system')).toEqual(0);
    expect(outputs.result.get('dependency_count_test')).toEqual(29);
    expect(outputs.result.get('dependency_list')).toContain("com.itextpdf:itextpdf:5.5.0");

    expect(outputs.result.get('license_count')).toEqual(10);
    expect(outputs.result.get('license_count_compile')).toEqual(7);
    expect(outputs.result.get('license_count_import')).toEqual(0);
    expect(outputs.result.get('license_count_provided')).toEqual(0);
    expect(outputs.result.get('license_count_runtime')).toEqual(0);
    expect(outputs.result.get('license_count_system')).toEqual(0);
    expect(outputs.result.get('license_count_test')).toEqual(3);
    expect(outputs.result.get('license_list')).toEqual('AGPL:3, Apache License:2.0, BSD:3, CPE:1, EDL:1.0, EPL:1.0, EPL:2.0, GPL:2, LGPL:1, MIT:1');
    expect(outputs.result.get('license_limited_list')).toEqual('AGPL:3, EPL:1.0, EPL:2.0, GPL:2, LGPL:1');
});

test('Test on wrapper_17 dir with scope excludes', () => {
    let outputs = main.run(null, workDir, -1, null, null, null, 'import, provided, runtime, system, test', null);
    expect(outputs.result.get('scopes')).toEqual('compile');
    expect(outputs.result.get('scopes_all')).toEqual('compile, import, provided, runtime, system, test');

    expect(outputs.result.get('dependency_count')).toEqual(34);
    expect(outputs.result.get('dependency_count_compile')).toEqual(34);
    expect(outputs.result.get('dependency_count_import')).toEqual(0);
    expect(outputs.result.get('dependency_count_provided')).toEqual(0);
    expect(outputs.result.get('dependency_count_runtime')).toEqual(0);
    expect(outputs.result.get('dependency_count_system')).toEqual(0);
    expect(outputs.result.get('dependency_count_test')).toEqual(0);

    expect(outputs.result.get('license_count')).toEqual(7);
    expect(outputs.result.get('license_count_compile')).toEqual(7);
    expect(outputs.result.get('license_count_import')).toEqual(0);
    expect(outputs.result.get('license_count_provided')).toEqual(0);
    expect(outputs.result.get('license_count_runtime')).toEqual(0);
    expect(outputs.result.get('license_count_system')).toEqual(0);
    expect(outputs.result.get('license_count_test')).toEqual(0);
    expect(outputs.result.get('license_list')).toEqual('Apache License:2.0, CPE:1, EPL:1.0, EPL:2.0, GPL:2, LGPL:1, MIT:1');
    expect(outputs.result.get('license_limited_list')).toEqual('EPL:1.0, EPL:2.0, GPL:2, LGPL:1');
});

test('Test on wrapper_17 dir with fail regex', () => {
    let outputs = main.run(null, workDir, -1, 'AGPL', 'itextpdf', null, 'compile, import, provided, runtime, system', null);
    expect(outputs.errors[0]).toEqual('License [AGPL:3] for dependency [com.itextpdf:itextpdf:5.5.0] matches the failLicenseRegex');
    expect(outputs.errors[1]).toEqual('Dependency [com.itextpdf:itextpdf:5.5.0] matches the failDependencyRegex');
    expect(outputs.result.get('scopes')).toEqual('test');
    expect(outputs.result.get('scopes_all')).toEqual('compile, import, provided, runtime, system, test');

    expect(outputs.result.get('dependency_count')).toEqual(29);
    expect(outputs.result.get('dependency_count_compile')).toEqual(0);
    expect(outputs.result.get('dependency_count_import')).toEqual(0);
    expect(outputs.result.get('dependency_count_provided')).toEqual(0);
    expect(outputs.result.get('dependency_count_runtime')).toEqual(0);
    expect(outputs.result.get('dependency_count_system')).toEqual(0);
    expect(outputs.result.get('dependency_count_test')).toEqual(29);

    expect(outputs.result.get('license_count')).toEqual(6);
    expect(outputs.result.get('license_count_compile')).toEqual(0);
    expect(outputs.result.get('license_count_import')).toEqual(0);
    expect(outputs.result.get('license_count_provided')).toEqual(0);
    expect(outputs.result.get('license_count_runtime')).toEqual(0);
    expect(outputs.result.get('license_count_system')).toEqual(0);
    expect(outputs.result.get('license_count_test')).toEqual(6);
    expect(outputs.result.get('license_list')).toEqual('AGPL:3, Apache License:2.0, BSD:3, EDL:1.0, EPL:2.0, MIT:1');
    expect(outputs.result.get('license_limited_list')).toEqual('AGPL:3, EPL:2.0');
});

test('Test on wrapper_17 dir with different output dir', () => {
    let outputs = main.run(null, workDir, -1, null, null, addWinSupport('docs/licenses'), 'compile, import, provided, runtime, system', null);
    expect(outputs.result.get('scopes')).toEqual('test');
    expect(outputs.result.get('scopes_all')).toEqual('compile, import, provided, runtime, system, test');
    expect(outputs.result.get('output-dir')).toContain(addWinSupport('docs/licenses'));
    expect(outputs.result.get('dependency_count')).toEqual(29);
    expect(outputs.result.get('license_count')).toEqual(6);
});

test('Test isEmpty', () => {
    expect(isEmpty(null)).toEqual(true);
    expect(isEmpty(undefined)).toEqual(true);
    expect(isEmpty("")).toEqual(true);
    expect(isEmpty("false")).toEqual(false);
    expect(isEmpty("true")).toEqual(false);
    expect(isEmpty(true)).toEqual(false);
    expect(isEmpty(false)).toEqual(false);
    expect(isEmpty(0)).toEqual(false);
    expect(isEmpty(1)).toEqual(false);
});

function removeDir(folderPath: PathOrFileDescriptor) {
    if (fs.existsSync(folderPath.toString())) {
        fs.readdirSync(folderPath.toString()).forEach((file, index) => {
            const curPath = path.join(folderPath.toString(), file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // recurse
                removeDir(curPath);
            } else {
                // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath.toString());
    }
}

function copyDir(source: string, destination: string) {
    // Create the destination directory if it doesn't exist
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination);
    }

    // Get a list of all files and directories in the source directory
    const files = fs.readdirSync(source);

    // Loop through each file or directory in the source directory
    for (const file of files) {
        // Get the full path of the current file or directory
        const currentPath = path.join(source, file);

        // Get the stats of the current file or directory
        const stats = fs.statSync(currentPath);

        // If it's a file, copy it to the destination directory
        if (stats.isFile()) {
            fs.copyFileSync(currentPath, path.join(destination, file));
        }
        // If it's a directory, recursively copy its contents to the destination directory
        else if (stats.isDirectory()) {
            copyDir(currentPath, path.join(destination, file));
        }
    }
}

function addWinSupport(url: string): string {
    return process.platform === "win32" ? url.replace(/\//g, '\\') : url;
}



