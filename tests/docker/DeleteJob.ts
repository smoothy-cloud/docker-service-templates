import Docker from 'dockerode'
import { Job } from '@/types'

class DeleteJob
{
    docker: Docker;

    constructor()
    {
        this.docker = new Docker()
    }

    async execute(job: Job)
    {
        const docker_containers: Docker.ContainerInfo[] = await this.docker.listContainers({ all: true })

        const job_exists: boolean = docker_containers.flatMap(job => job.Names).includes(`/${job.id}`)

        if(! job_exists) return

        const docker_container: Docker.Container = this.docker.getContainer(job.id)

        if((await docker_container.inspect()).State.Running) {
            await docker_container.stop()
        }

        await docker_container.remove()
    }
}

export default DeleteJob