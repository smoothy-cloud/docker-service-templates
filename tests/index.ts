import fs from 'fs'
import YAML from 'yaml'
import ParseTemplate from './templates/ParseTemplate'
import ValidateTemplate from './templates/ValidateTemplate'
import InstallTemplate from './templates/InstallTemplate'
import UninstallTemplate from './templates/UninstallTemplate'
import ApiError from '@/api/ApiError'
import { Service, Template, Variables } from '@/types'

export function parseYamlFile(file_path: string): any {
    return YAML.parse(fs.readFileSync(file_path).toString())
}

export async function parseTemplate(
    service_id: string, template_path: string, template_version: string, variables: Variables = {},
    environment: Variables = {}
): Promise<Template> {
    return await (new ParseTemplate).execute(
        service_id, template_path, template_version, variables, environment
    )
}

export async function validateTemplate(template_path: string): Promise<ApiError|null> {
    return await (new ValidateTemplate).execute(template_path)
}

export async function installTemplate(
    code_repository_path: string|null, template_path: string, template_version: string, variables: Variables = {}, 
    environment: Variables = {}, initialization_time_in_seconds: number = 10
): Promise<Service> {
    return await (new InstallTemplate).execute(
        code_repository_path, template_path, template_version, variables, environment,
        initialization_time_in_seconds
    )
}

export async function uninstallTemplate(service: Service): Promise<void> {
    return await (new UninstallTemplate).execute(service)
}