import Docker from 'dockerode'
import path from 'path'
import { DirResult as Directory } from 'tmp'
import { Container, Entrypoint } from '@/types'

type PortBindings = Record<string, Object>

class RunContainer
{
    docker: Docker

    constructor()
    {
        this.docker = new Docker()
    }

    async execute(directory: Directory, service_id: string, entrypoints: Entrypoint[], container: Container)
    {
        const docker_containers = await this.docker.listContainers()
        const container_exists = docker_containers.flatMap(container => container.Names).includes(container.id)

        if(container_exists) return

        const image = container.image
        const command = container.command
        const environment = container.environment || []
        const volume_mounts = container.volume_mounts || []
        const config_file_mounts = container.config_file_mounts || []

        const binds: string[] = []

        for(const volume_mount of volume_mounts) {
            binds.push(`${volume_mount.volume}:${volume_mount.mount_path}`)
        }

        for(const config_file_mount of config_file_mounts) {
            const local_path = path.join(directory.name, `services/${service_id}/${config_file_mount.config_file}`)
            binds.push(`${local_path}:${config_file_mount.mount_path}`)
        }

        const port_bindings: PortBindings = {}

        entrypoints
            .filter(entrypoint => entrypoint.container === container.id)
            .forEach(entrypoint => port_bindings[`${entrypoint.port}/tcp`] = [ { HostPort: `${entrypoint.host_port}` } ])

        const config: Docker.ContainerCreateOptions = {
            name: container.id,
            Tty: true,
            Env: environment.map(environment_variable => `${environment_variable.key}=${environment_variable.value}`),
            Image: image,
            HostConfig: {
                NetworkMode: 'smoothy',
                Binds: binds,
                PortBindings: port_bindings
            }
        }

        if(command && typeof command === 'string') {
            config.Cmd = command
        }
        
        const docker_container: Docker.Container = await this.docker.createContainer(config)

        await docker_container.start()
    }
}

export default RunContainer