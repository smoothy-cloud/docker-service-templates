// import path from 'path'
// import rimraf from 'rimraf'
// import fs from 'fs'
import DeleteImage from '@/docker/DeleteImage'
import DeleteVolume from '@/docker/DeleteVolume'
import DeleteContainer from '@/docker/DeleteContainer'
import { ParsedTemplate } from '@/types'

export class UninstallTemplate
{
    async execute(template: ParsedTemplate): Promise<void>
    {
        await this.deleteContainers(template)
        // await this.deleteConfigFiles(template)
        await this.deleteVolumes(template)
        await this.deleteImages(template)
    }

    async deleteContainers(template: ParsedTemplate): Promise<void>
    {
        const promises: Promise<void>[] = []

        template.template.deployment.forEach(resource => {

            if(resource.resource !== 'container') return

            promises.push(new DeleteContainer().execute(resource))

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

    async deleteVolumes(template: ParsedTemplate): Promise<void>
    {
        const promises: Promise<void>[] = []

        template.template.deployment.forEach(resource => {
            
            if(resource.resource !== 'volume') return
            
            promises.push(new DeleteVolume().execute(resource))
            
         })

        await Promise.all(promises)
    }

    async deleteImages(template: ParsedTemplate): Promise<void>
    {
        const promises: Promise<void>[] = []

        template.template.deployment.forEach(resource => {
            
            if(resource.resource !== 'image') return
            
            promises.push(new DeleteImage().execute(resource))
            
        })

        await Promise.all(promises)
    }
}

export default UninstallTemplate