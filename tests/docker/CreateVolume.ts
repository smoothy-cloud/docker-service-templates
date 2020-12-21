import Docker from 'dockerode'
import { Volume } from '@/types'

class CreateVolume
{
    docker: Docker;

    constructor()
    {
        this.docker = new Docker()
    }

    async execute(application_id: string, volume: Volume)
    {
        const volume_slug: string = `${application_id}_volume_${volume.name}`

        const docker_volumes: Docker.VolumeInspectInfo[] = (await this.docker.listVolumes()).Volumes

        const volume_exists: boolean = docker_volumes.map(volume => volume.Name).includes(volume_slug)

        if(volume_exists) return

        await this.docker.createVolume({ Name: volume_slug })
    }
}

export default CreateVolume