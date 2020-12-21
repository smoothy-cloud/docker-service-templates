import SmoothyApi from '@/api/SmoothyApi'
import ImportTemplate from '@/templates/ImportTemplate'
import { Template, Variables } from '@/types'

export class ParseTemplate 
{
    async execute(service_id: string, template_path: string, template_version: string, variables: Variables): Promise<Template>
    {
        const template = await (new ImportTemplate).execute(template_path, 'docker_server')

        if(!(template_version in template.versions)) {
            throw "Non existing version"
        }

        const versioned_template = template.versions[template_version]

        return await (new SmoothyApi).parseTemplate(versioned_template, service_id, variables)
    }
}

export default ParseTemplate