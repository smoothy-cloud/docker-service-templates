export * from './templates/ParseTemplate'
export * from './templates/ValidateTemplate'
export * from './templates/InstallTemplate'
export * from './templates/UninstallTemplate'

import fs from 'fs'
import YAML from 'yaml'

export function parseYamlFile(file_path: string): any {
    return YAML.parse(fs.readFileSync(file_path).toString())
}