import tmp, { DirResult as Directory } from 'tmp'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import ParseTemplate from '@/templates/ParseTemplate'
import UninstallTemplate from '@/templates/UninstallTemplate'
import BuildImage from '@/docker/BuildImage'
import CreateNetwork from '@/docker/CreateNetwork'
import CreateVolume from '@/docker/CreateVolume'
import RunContainer from '@/docker/RunContainer'
import { Service, Entrypoint, ConfigFile, Template, Variables } from '@/types'
import { v4 as uuidv4 } from 'uuid'

tmp.setGracefulCleanup()

export class InstallTemplate
{
    directory: Directory

    constructor()
    {
        this.directory = tmp.dirSync()
    }

    async execute(template_path: string, template_version: string, variables: Variables): Promise<Service>
    {
        const service_id = uuidv4()
        const template = await (new ParseTemplate).execute(service_id, template_path, template_version, variables)

        let service = {
            id: service_id,
            template: template,
            entrypoints: {},
        }

        try {
            await new CreateNetwork().execute('smoothy')
            await this.buildImages(service_id, template)
            await this.createVolumes(service_id, template)
            await this.createConfigFiles(service_id, template)
            service.entrypoints = await this.runContainers(service_id, template)
        } catch (error) {
            (new UninstallTemplate).execute(service)
            throw error
        }

        // wait for service to finish initializing
        await new Promise(resolve => setTimeout(resolve, 1000 * 15))

        return service
    }

    async buildImages(service_id: string, template: Template): Promise<void>
    {
        const promises: Promise<void>[] = []

        template.template.deployment.forEach(resource => {

            if(resource.resource !== "image") return

            promises.push(new BuildImage().execute(service_id, template, resource))

        })

        await Promise.all(promises)
    }

    async createVolumes(service_id: string, template: Template): Promise<void>
    {
        const promises: Promise<void>[] = []

        template.template.deployment.forEach(resource => {

            if(resource.resource !== "volume") return

            promises.push(new CreateVolume().execute(service_id, resource))

        })

        await Promise.all(promises)
    }

    async createConfigFiles(service_id: string, template: Template): Promise<void>
    {
        const config_files: ConfigFile[] = []

        for(const resource of template.template.deployment) {
            if(resource.resource !== 'config_file') continue
            config_files.push(resource)
        }

        if(config_files.length === 0) return

        const folder_path = path.join(this.directory.name, `services/${service_id}`)
            
        mkdirp.sync(folder_path)

        for(const config_file of config_files) {
            const file_path = `${folder_path}/${service_id}_config_file_${config_file.name}`
            fs.writeFileSync(file_path, config_file.contents)
        }
    }

    async runContainers(service_id: string, template: Template): Promise<Record<string, number>>
    {
        const entrypoints: Entrypoint[] = []
        const entrypoint_host_port_mapping: Record<string, number> = {}

        template.template.deployment.forEach((resource, i) => {

            if(resource.resource !== 'entrypoint') return null

            resource.host_port = 50000 + i

            entrypoints.push(resource)

            entrypoint_host_port_mapping[resource.name] = resource.host_port

        })

        for(const resource of template.template.deployment) {

            if(resource.resource !== 'container') continue

            await new RunContainer().execute(this.directory, service_id, entrypoints, resource)

        }

        return entrypoint_host_port_mapping
    }
}

export default InstallTemplate