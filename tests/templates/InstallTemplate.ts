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
import { Service, Volume, Image, Entrypoint, ConfigFile, Template, Variables } from '@/types'
import { v4 as uuidv4 } from 'uuid'

tmp.setGracefulCleanup()

export class InstallTemplate
{
    directory: Directory

    constructor()
    {
        this.directory = tmp.dirSync()
    }

    async execute(
        code_repository_path: string|null, template_path: string, template_version: string, variables: Variables, 
        initialization_time_in_seconds: number = 10
    ): Promise<Service>
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
            await this.buildImages(service_id, code_repository_path, template)
            await this.createVolumes(service_id, template)
            await this.createConfigFiles(service_id, template)
            service.entrypoints = await this.runContainers(service_id, template)
        } catch (error) {
            (new UninstallTemplate).execute(service)
            throw error
        }

        await new Promise(resolve => setTimeout(resolve, 1000 * initialization_time_in_seconds))

        return service
    }

    async buildImages(service_id: string, code_repository_path: string|null, template: Template): Promise<void>
    {
        const images: Image[] = []

        for(const resource of template.template.deployment) {
            if(resource.resource !== 'image') continue
            images.push(resource)
        }

        if(images.length === 0) return

        if(code_repository_path === null) {
            throw new Error("No code repository path provided.")
        }

        for(const image of images) {
            await new BuildImage().execute(service_id, code_repository_path, template, image)
        }
    }

    async createVolumes(service_id: string, template: Template): Promise<void>
    {
        const volumes: Volume[] = []

        for(const resource of template.template.deployment) {
            if(resource.resource !== 'volume') continue
            volumes.push(resource)
        }

        if(volumes.length === 0) return

        for(const volume of volumes) {
            await new CreateVolume().execute(service_id, volume)
        }
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

        template.template.deployment.forEach(resource => {

            if(resource.resource !== 'entrypoint') return null

            const min_port = 50000
            const max_port = 65353
            const random_port = Math.floor(Math.random() * (max_port - min_port) ) + min_port

            resource.host_port = random_port

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