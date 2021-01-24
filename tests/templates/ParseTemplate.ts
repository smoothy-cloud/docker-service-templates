import SmoothyApi from '@/api/SmoothyApi'
import ImportTemplate from '@/templates/ImportTemplate'
import { Template, Variables } from '@/types'

export class ParseTemplate 
{
    async execute(
        application_slug: string, service_id: string, template_path: string, template_version: string, 
        variables: Variables, environment: Variables
    ): Promise<Template>
    {
        const template = await (new ImportTemplate).execute(template_path, 'docker_server')

        if(!(template_version in template.versions)) {
            throw "Non existing version"
        }

        const versioned_template = template.versions[template_version]

        return await (new SmoothyApi).parseTemplate(
            application_slug, service_id, versioned_template, variables, environment
        )
    }
}

export default ParseTemplate