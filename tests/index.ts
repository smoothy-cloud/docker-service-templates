import fs from 'fs'
import YAML from 'yaml'
import ParseTemplate from './templates/ParseTemplate'
import ValidateTemplate from './templates/ValidateTemplate'
import InstallTemplate from './templates/InstallTemplate'
import UninstallTemplate from './templates/UninstallTemplate'
import ApiError from '@/api/ApiError'
import { Service, Template, Variables } from '@/types'

export default class TemplateTests {

    template_path: string

    constructor(template_path: string) {
        this.template_path = template_path
    }

    parseYamlFile(file_path: string): any
    {
        return YAML.parse(fs.readFileSync(file_path).toString())
    }
    
    async parseTemplate(
        application_slug: string, service_id: string, variables: Variables = {}, environment: Variables = {}
    ): Promise<Template>
    {
        return await (new ParseTemplate).execute(
            application_slug, service_id, this.template_path, 'latest', variables, environment
        )
    }
    
    async validateTemplate(): Promise<ApiError|null>
    {
        return await (new ValidateTemplate).execute(this.template_path)
    }
    
    async installTemplate(
        code_repository_path: string|null, variables: Variables = {}, environment: Variables = {}, 
        initialization_time_in_seconds: number = 10
    ): Promise<Service>
    {
        return await (new InstallTemplate).execute(
            code_repository_path, this.template_path, 'latest', variables, environment, initialization_time_in_seconds
        )
    }
    
    async uninstallTemplate(service: Service): Promise<void>
    {
        return await (new UninstallTemplate).execute(service)
    }

}