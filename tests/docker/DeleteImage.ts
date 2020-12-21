import Docker from 'dockerode'
import { Image } from '@/types'

class DeleteImage
{
    docker: Docker

    constructor()
    {
        this.docker = new Docker()
    }

    async execute(application_id: string, image: Image): Promise<void>
    {
        const image_slug: string = `${application_id}_image_${image.name}`
        
        const docker_images: Docker.ImageInfo[] = await this.docker.listImages()
        
        const image_exists: boolean = docker_images.flatMap(image => image.RepoTags).includes(`${image_slug}:latest`)

        if(! image_exists) return

        const docker_image: Docker.Image = this.docker.getImage(image_slug)
        
        await docker_image.remove()
    }
}

export default DeleteImage