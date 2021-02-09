import fs from 'fs'
import YAML from 'yaml'
import ParseTemplate from './templates/ParseTemplate'
import ValidateTemplate from './templates/ValidateTemplate'
import InstallTemplate from './templates/InstallTemplate'
import UninstallTemplate from './templates/UninstallTemplate'
import { Service, Template, Variables } from '@/types'
import 'jest-extended'

export default class TemplateTests {

    template_path: string

    constructor(template_path: string) {
        this.template_path = template_path
    }

    readParsedTemplateFile(file_path: string): any
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

    assertThatTemplatesAreEqual(actual_template: Template, expected_template: Template): void
    {
        if(expected_template?.template?.deployment) {
            expect(actual_template?.template?.deployment || []).toIncludeAllMembers(expected_template.template.deployment)
        }

        if(expected_template?.template?.interface?.volumes) {
            expect(actual_template?.template?.interface?.volumes || []).toIncludeAllMembers(expected_template.template.interface.volumes)
        }

        if(expected_template?.template?.interface?.logs) {
            expect(actual_template?.template?.interface?.logs || []).toIncludeAllMembers(expected_template.template.interface.logs)
        }

        if(expected_template?.files) {
            expect(actual_template?.files || {}).toMatchObject(expected_template.files)
        }
    }
    
    async assertThatTheTemplateSyntaxIsValid(): Promise<void>
    {
        const error =  await (new ValidateTemplate).execute(this.template_path)

        expect(error).toBe(null)
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

    async sleep(seconds: number): Promise<void>
    {
        await new Promise(resolve => setTimeout(resolve, 1000 * seconds))
    }

}