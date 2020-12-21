import Docker from 'dockerode'

interface Container {
    name: string;
}

class DeleteContainer
{
    docker: Docker;

    constructor()
    {
        this.docker = new Docker()
    }

    async execute(application_id: string, container: Container)
    {
        const container_slug = `${application_id}_container_${container.name}`

        const docker_containers: Docker.ContainerInfo[] = await this.docker.listContainers({ all: true })

        const container_exists: boolean = docker_containers.flatMap(container => container.Names).includes(`/${container_slug}`)

        if(! container_exists) return

        const docker_container: Docker.Container = this.docker.getContainer(container_slug)

        if((await docker_container.inspect()).State.Running) {
            await docker_container.stop()
        }

        await docker_container.remove()
    }
}

export default DeleteContainer