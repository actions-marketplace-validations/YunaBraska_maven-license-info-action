import fs, {PathOrFileDescriptor} from "fs";
import os from "os";
import path from "path";

export type ResultType = string | number | boolean | null;

export class License {
    constructor(
        public name: string,
        public version: string,
        public scope: string,
        public isLimited: boolean = false
    ) {
    }

    toString(): string {
        return `name [${this.name}] version [${this.version}] limited [${this.isLimited}] scope [${this.scope}]`;
    }
}

export class Dependency {
    line: string = '';
    group: string = '';
    artifact: string = '';
    version: string = '';
    scope: string = '';
    url: string = '';
    licenses: License[] = [];

    toString(): string {
        return `group [${this.group}] artifact [${this.artifact}] version [${this.version}] scope [${this.scope}]`;
    }
}

export type ScopeResult = {
    dependencies: Dependency[],
    licenses: License[]
};

export type RunResult = {
    result: Map<string, ResultType>,
    errors: string[]
};

export function str(result: string | number | boolean | null | undefined): string {
    return (result ?? '').toString();
}

export function int(result: string | number | boolean | null | undefined): number {
    if (typeof result === 'number') {
        return result;
    } else if (typeof result === 'string') {
        const parsedInt = Number.parseInt(result, 10);
        if (Number.isNaN(parsedInt)) {
            return 0;
        }
        return parsedInt;
    } else {
        return 0;
    }
}

export function strShort(input: string, cutAt: number): string {
    input = input.trim();
    let threshold = input.endsWith('.') ? 2 : 3;
    if (cutAt > threshold && input.length > (cutAt - threshold)) {
        return input.substring(0, (cutAt - threshold)) + ".".repeat(threshold);
    } else {
        return input;
    }
}

export function isEmpty(input: string | number | boolean | null | undefined): boolean {
    return input === null || input === undefined || String(input).trim().length === 0;
}

export function sortMap(input: Map<string, any>): Map<string, any> {
    const sortedEntries = Array.from(input.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return new Map(sortedEntries);
}

export function replaceNullWithEmptyMap(input: Map<string, any>): Map<string, any> {
    const output = new Map<string, any>();
    input.forEach((value, key) => {
        if (value === null || value === undefined || value === 'null') {
            output.set(key, '');
        } else {
            output.set(key, value);
        }
    });
    return output;
}

export function cmd(workDir: PathOrFileDescriptor, ...commands: string[]): string | null {
    return execCmd(workDir, false, commands);
}

export function cmdLog(workDir: PathOrFileDescriptor, ...commands: string[]): string | null {
    return execCmd(workDir, true, commands);
}

export function execCmd(workDir: PathOrFileDescriptor, logError: boolean, commands: string[]): string | null {
    for (const command of commands) {
        let result = null;
        try {
            let devNull = os.platform().toLowerCase().startsWith('win') ? " 2>NUL" : " 2>/dev/null"
            result = require('child_process').execSync(command + (logError ? devNull : ''), {
                cwd: workDir.toString(),
                encoding: 'utf8',
                timeout: 10000
            });
        } catch (error) {
            if (logError) {
                console.debug(error);
            }
            continue;
        }
        if (!isEmpty(result)) {
            return result.trim();
        }
    }
    return null;
}

export function listFiles(dir: PathOrFileDescriptor, deep: number, filter: string, resultList: PathOrFileDescriptor[], deep_current: number): PathOrFileDescriptor[] {
    deep_current = deep_current || 0
    resultList = resultList || []
    if (deep > -1 && deep_current > deep) {
        return resultList;
    }
    const files = fs.readdirSync(dir.toString(), {withFileTypes: true});
    for (const file of files) {
        if (file.isDirectory()) {
            listFiles(path.join(dir.toString(), file.name), deep, filter, resultList, deep_current++);
        } else if (!filter || new RegExp(filter).test(file.name)) {
            resultList.push(path.join(dir.toString(), file.name));
        }
    }
    return resultList;
}
