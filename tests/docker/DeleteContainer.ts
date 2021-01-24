import Docker from 'dockerode'
import { Container } from '@/types'

class DeleteContainer
{
    docker: Docker;

    constructor()
    {
        this.docker = new Docker()
    }

    async execute(container: Container)
    {
        const docker_containers: Docker.ContainerInfo[] = await this.docker.listContainers({ all: true })

        const container_exists: boolean = docker_containers.flatMap(container => container.Names).includes(`/${container.id}`)

        if(! container_exists) return

        const docker_container: Docker.Container = this.docker.getContainer(container.id)

        if((await docker_container.inspect()).State.Running) {
            await docker_container.stop()
        }

        await docker_container.remove()
    }
}

export default DeleteContainer