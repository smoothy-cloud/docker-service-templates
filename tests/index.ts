import fs from 'fs'
import YAML from 'yaml'
import ParseTemplate from './templates/ParseTemplate'
import ValidateTemplate from './templates/ValidateTemplate'
import InstallTemplate from './templates/InstallTemplate'
import UninstallTemplate from './templates/UninstallTemplate'
import * as types from '@/types'
import 'jest-extended'

export class Template {

    template_path: string
    installed_service?: types.Service

    constructor(template_path: string) {
        this.template_path = template_path
    }
    
    async parse(
        application_slug: string, service_id: string, variables: types.Variables = {}, environment: types.Variables = {}
    ): Promise<types.Template>
    {
        return await (new ParseTemplate).execute(
            application_slug, service_id, this.template_path, 'latest', variables, environment
        )
    }
    
    async assertThatSyntaxIsValid(): Promise<void>
    {
        const error =  await (new ValidateTemplate).execute(this.template_path)

        expect(error).toBe(null)
    }
    
    async install(
        code_repository_path: string|null, variables: types.Variables = {}, environment: types.Variables = {}, 
        initialization_time_in_seconds: number = 10
    ): Promise<types.Service>
    {
        this.installed_service = await (new InstallTemplate).execute(
            code_repository_path, this.template_path, 'latest', variables, environment, initialization_time_in_seconds
        )

        return this.installed_service
    }
    
    async uninstall(): Promise<void>
    {
        if(! this.installed_service) return

        return await (new UninstallTemplate).execute(this.installed_service)
    }

}

export const utils = {

    readParsedTemplateFile: function(file_path: string): any
    {
        return YAML.parse(fs.readFileSync(file_path).toString())
    },

    assertThatTemplatesAreEqual: function(actual_template: types.Template, expected_template: types.Template): void
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
    },

    sleep: async function(seconds: number): Promise<void>
    {
        await new Promise(resolve => setTimeout(resolve, 1000 * seconds))
    },

}