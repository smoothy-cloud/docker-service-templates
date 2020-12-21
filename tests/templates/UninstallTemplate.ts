// import path from 'path'
// import rimraf from 'rimraf'
// import fs from 'fs'
import DeleteImage from '@/docker/DeleteImage'
import DeleteVolume from '@/docker/DeleteVolume'
import DeleteContainer from '@/docker/DeleteContainer'
import { Service } from '@/types'

export class UninstallTemplate
{
    async execute(service: Service): Promise<void>
    {
        await this.deleteContainers(service)
        // await this.deleteConfigFiles(service)
        await this.deleteVolumes(service)
        await this.deleteImages(service)
    }

    async deleteContainers(service: Service): Promise<void>
    {
        const promises: Promise<void>[] = []

        service.template.template.deployment.forEach(resource => {

            if(resource.resource !== 'container') return

            promises.push(new DeleteContainer().execute(service.id, resource))

        })

        await Promise.all(promises)
    }

    /*
    async deleteConfigFiles(service: Service): Promise<void>
    {        
        const folder_path = path.join(app.getPath('userData'), `services/${service_id}`)

        if(! fs.existsSync(folder_path)) return
        
        rimraf.sync(folder_path)
    }
    */

    async deleteVolumes(service: Service): Promise<void>
    {
        const promises: Promise<void>[] = []

        service.template.template.deployment.forEach(resource => {
            
            if(resource.resource !== 'volume') return
            
            promises.push(new DeleteVolume().execute(service.id, resource))
            
         })

        await Promise.all(promises)
    }

    async deleteImages(service: Service): Promise<void>
    {
        const promises: Promise<void>[] = []

        service.template.template.deployment.forEach(resource => {
            
            if(resource.resource !== 'image') return
            
            promises.push(new DeleteImage().execute(service.id, resource))
            
        })

        await Promise.all(promises)
    }
}

export default UninstallTemplate