# maven-license-info-action

Validates & generates licenses from maven dependencies
See also [Common Software License Table](https://github.com/YunaBraska/software-licenses)

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/donate/?hosted_button_id=HFHFUT3G6TZF6)

[![Build][build_shield]][build_link]
[![Maintainable][maintainable_shield]][maintainable_link]
[![Coverage][coverage_shield]][coverage_link]
[![Issues][issues_shield]][issues_link]
[![Commit][commit_shield]][commit_link]
[![License][license_shield]][license_link]
[![Tag][tag_shield]][tag_link]
[![Size][size_shield]][size_shield]
![Label][label_shield]
![Label][node_version]

### Requirements

* maven e.g. mvn, mvnw.cmd, ./mvnw

### Features

* Generates license files *(Default target/maven-license-info-action)*
    * licenses.md
    * licenses.csv
    * licenses.json
    * licenses.xml
    * dependencies.md
    * dependencies.csv
    * dependencies.json
    * dependencies.xml
* update Shields/Badges
  see [ShieldsDemo](https://github.com/YunaBraska/maven-license-info-action/blob/main/test/resources/maven/project/wrapper_17/ShieldDemo.md)

## Usage

```yaml
# RUNNER
- name: "Maven License Info"
  id: "license_info"
  uses: YunaBraska/maven-license-info-action@main

  # CONFIGS (Optional)
  with:
    work-dir: '.'
    exclude-scopes: 'test,provided,system'
    fail-license-regex: 'GPL'
    fail-dependency-regex: 'org.apache:maven:1*'
    null-to-empty: 'true'

  # PRINT
- name: "Print License Info"
  run: |
    echo "scopes                   [${{ steps.license_info.outputs.license_count }}]"
    echo "license_list             [${{ steps.license_info.outputs.license_list }}]"
    echo "license_count            [${{ steps.license_info.outputs.license_count }}]"
    echo "license_system_test      [${{ steps.license_info.outputs.license_count_compile }}]"
    echo "license_count_compile    [${{ steps.license_info.outputs.license_count_compile }}]"
    echo "license_limited_list     [${{ steps.license_info.outputs.license_limited_list }}]"
    echo "dependency_list          [${{ steps.license_info.outputs.dependency_list }}]"
    echo "dependency_count         [${{ steps.license_info.outputs.dependency_count }}]"
    echo "dependency_count_test    [${{ steps.license_info.outputs.dependency_count_test }}]"
    echo "dependency_count_compile [${{ steps.license_info.outputs.dependency_count_compile }}]"

```

### Inputs

| parameter             | default                          | description                                                                                                      |
|-----------------------|----------------------------------|------------------------------------------------------------------------------------------------------------------|
| work-dir              | '.'                              | Work dir                                                                                                         |
| output-dir            | target/maven-license-info-action | output dir for files \[licenses.txt, licenses.md, licenses.csv, licenses.json, licenses.xml] ("." = current dir) |
| exclude-scopes        | null                             | A comma separated list of scopes to exclude (e.g. test,provided,system)                                          |
| fail-license-regex    | null                             | Regex on licenses which will cause the build to fail e.g. 'Apache License'                                       |
| fail-dependency-regex | null                             | Regex on dependency which will cause the build to fail e.g. 'org.apache:maven:1*'                                |
| null-to-empty         | true                             | Replaces null values with empty strings                                                                          |

### Outputs

| Name                      | Example                                                                                   | Default | Description                                                                                                          |
|---------------------------|-------------------------------------------------------------------------------------------|---------|----------------------------------------------------------------------------------------------------------------------|
| scopes                    | Compile, Test                                                                             | ''      | Number of third party dependencies                                                                                   |
| scopes_all                | compile, import, provided, runtime, system, test                                          | ''      | Number of third party dependencies                                                                                   |
| dependency_list           | org.maven:artifact:1.2.3, org.apache:artifact:4.5.6                                       | ''      | Branch_default commits that are not in the branch                                                                    |
| dependency_count          | 63                                                                                        | 0       | Number of third party dependencies                                                                                   |
| dependency_count_compile  | 34                                                                                        | 0       | Number of third party dependencies for scope \[compile]                                                              |
| dependency_count_import   | 0                                                                                         | 0       | Number of third party dependencies for scope \[import]                                                               |
| dependency_count_provided | 0                                                                                         | 0       | Number of third party dependencies for scope \[provided]                                                             |
| dependency_count_runtime  | 0                                                                                         | 0       | Number of third party dependencies for scope \[runtime]                                                              |
| dependency_count_system   | 0                                                                                         | 0       | Number of third party dependencies for scope \[system]                                                               |
| dependency_count_test     | 29                                                                                        | 0       | Number of third party dependencies for scope \[test]                                                                 |
| license_list              | AGPL:3, Apache License:2.0, BSD:3, CPE:1, EDL:1.0, EPL:1.0, EPL:2.0, GPL:2, LGPL:1, MIT:1 | ''      | List of used licenses                                                                                                |
| license_limited_list      | AGPL:3, EPL:1.0, EPL:2.0, GPL:2, LGPL:1                                                   | ''      | List of licenses which has limits ([Common Software License Table](https://github.com/YunaBraska/software-licenses)) |
| license_count             | 10                                                                                        | 0       | Number of licenses provided in third party dependencies                                                              |
| license_count_compile     | 7                                                                                         | 0       | Number of licenses provided in third party dependencies for scope \[compile]                                         |
| license_count_import      | 0                                                                                         | 0       | Number of licenses provided in third party dependencies for scope \[import]                                          |
| license_count_provided    | 0                                                                                         | 0       | Number of licenses provided in third party dependencies for scope \[provided]                                        |
| license_count_runtime     | 0                                                                                         | 0       | Number of licenses provided in third party dependencies for scope \[runtime]                                         |
| license_count_system      | 0                                                                                         | 0       | Number of licenses provided in third party dependencies for scope \[system]                                          |
| license_system_test       | 3                                                                                         | 0       | Number of licenses provided in third party dependencies for scope \[test]                                            |

### \[DEV] Setup Environment

* clean environment: `./clean_node.sh`
* Build: `npm run build` to "compile" `index.ts` to `./lib/index.js`
* Test: `npm run test`
* NodeJs 16: do not upgrade nodeJs as GitHub actions latest version is 16
* Hint: please do not remove the node modules as they are required for custom GitHub actions :(

[build_shield]: https://github.com/YunaBraska/maven-license-info-action/workflows/RELEASE/badge.svg

[build_link]: https://github.com/YunaBraska/maven-license-info-action/actions/workflows/publish.yml/badge.svg

[maintainable_shield]: https://img.shields.io/codeclimate/maintainability/YunaBraska/maven-license-info-action?style=flat-square

[maintainable_link]: https://codeclimate.com/github/YunaBraska/maven-license-info-action/maintainability

[coverage_shield]: https://img.shields.io/codeclimate/coverage/YunaBraska/maven-license-info-action?style=flat-square

[coverage_link]: https://codeclimate.com/github/YunaBraska/maven-license-info-action/test_coverage

[issues_shield]: https://img.shields.io/github/issues/YunaBraska/maven-license-info-action?style=flat-square

[issues_link]: https://github.com/YunaBraska/maven-license-info-action/commits/main

[commit_shield]: https://img.shields.io/github/last-commit/YunaBraska/maven-license-info-action?style=flat-square

[commit_link]: https://github.com/YunaBraska/maven-license-info-action/issues

[license_shield]: https://img.shields.io/github/license/YunaBraska/maven-license-info-action?style=flat-square

[license_link]: https://github.com/YunaBraska/maven-license-info-action/blob/main/LICENSE

[tag_shield]: https://img.shields.io/github/v/tag/YunaBraska/maven-license-info-action?style=flat-square

[tag_link]: https://github.com/YunaBraska/maven-license-info-action/releases

[size_shield]: https://img.shields.io/github/repo-size/YunaBraska/maven-license-info-action?style=flat-square

[label_shield]: https://img.shields.io/badge/Yuna-QueenInside-blueviolet?style=flat-square

[gitter_shield]: https://img.shields.io/gitter/room/YunaBraska/maven-license-info-action?style=flat-square

[gitter_link]: https://gitter.im/maven-license-info-action/Lobby

[node_version]: https://img.shields.io/badge/node-16-blueviolet?style=flat-square
