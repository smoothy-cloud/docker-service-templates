import Docker from 'dockerode'
import { DirResult as Directory } from 'tmp'
import { Job } from '@/types'

class RunJob
{
    docker: Docker

    constructor()
    {
        this.docker = new Docker()
    }

    async execute(directory: Directory, job: Job)
    {
        const docker_containers = await this.docker.listContainers()
        const job_exists = docker_containers.flatMap(container => container.Names).includes(job.id)

        if(job_exists) return

        const image = job.image
        const command = job.command
        const environment = job.environment || []
        const volume_mounts = job.volume_mounts || []
        const config_file_mounts = job.config_file_mounts || []

        const binds: string[] = []

        for(const volume_mount of volume_mounts) {
            binds.push(`${volume_mount.volume}:${volume_mount.mount_path}`)
        }

        for(const config_file_mount of config_file_mounts) {
            binds.push(`${directory.name}/${config_file_mount.config_file}:${config_file_mount.mount_path}`)
        }

        const config: Docker.ContainerCreateOptions = {
            name: job.id,
            Tty: true,
            Env: environment.map(environment_variable => `${environment_variable.key}=${environment_variable.value}`),
            Image: image,
            Cmd: command,
            HostConfig: {
                NetworkMode: 'smoothy',
                Binds: binds,
                RestartPolicy: {
                    Name: 'on-failure',
                    MaximumRetryCount: 3
                }
            }
        }
        
        const docker_container: Docker.Container = await this.docker.createContainer(config)

        await docker_container.start()
    }
}

export default RunJob