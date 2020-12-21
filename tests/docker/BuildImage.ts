import tmp, { DirResult as Directory } from 'tmp'
// @ts-ignore
import exec from 'await-exec'
import fs from 'fs'
import Docker from 'dockerode'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import tarfs from 'tar-fs'
import { Template, TemplateFiles, Image } from '@/types'

interface ProgressEvent {
    error?: string;
    stream?: string;
}

class BuildImage
{
    docker: Docker

    constructor()
    {
        this.docker = new Docker()
    }

    async execute(application_id: string, template: Template, image: Image): Promise<void>
    {
        const build_directory: Directory = tmp.dirSync()

        try {

            await this.copyCodeRepositoryContentsToBuildFolder(image, build_directory)

            this.copyImageFilesToBuildFolder(template.files, build_directory)

            const stream: NodeJS.ReadableStream = await this.buildImage(application_id, image, build_directory)

            await this.processBuildOutput(stream)

        } finally {
            rimraf.sync(build_directory.name)
        }
    }

    /*
     * Do not copy .git directory and respect .gitignore file.
     */
    async copyCodeRepositoryContentsToBuildFolder(image: Image, build_directory: Directory): Promise<void>
    {
        const path_to_code_repository_contents = image.code_repository.replace(/[/]+$/, "")

        await exec(`rsync -azP --delete --exclude='.git' --filter=":- .gitignore" ${path_to_code_repository_contents}/. ${build_directory.name}/code-repository/`)
    }

    copyImageFilesToBuildFolder(files: TemplateFiles, build_directory: Directory): void
    {
        for (const [path, contents] of Object.entries(files)) {
            const folder_path = path.substring(0, path.lastIndexOf("/"))
            mkdirp.sync(`${build_directory.name}/${folder_path}`)
            fs.writeFileSync(`${build_directory.name}/${path}`, contents)
        }
    }

    async buildImage(application_id: string, image: Image, build_directory: Directory): Promise<NodeJS.ReadableStream>
    {
        const pack = tarfs.pack(build_directory.name)

        return await this.docker.buildImage(pack, {
            dockerfile: image.dockerfile,
            t: `${application_id}_image_${image.name}`,
        })
    }

    async processBuildOutput(stream: NodeJS.ReadableStream): Promise<void>
    {
        await new Promise((resolve, reject) => {

            this.docker.modem.followProgress(stream, onFinished, onProgress);

            function onFinished(err: Error|string, output: any) {
                if (err) {
                    reject(err)
                }
                resolve(output)
            }

            function onProgress(event: ProgressEvent) {
                if (event.error) {
                    console.log(event.error)
                    reject(`An error occurred during the build of the Dockerfile: ${event.error}`)
                }
                if(event.stream) {
                    console.log(event.stream)
                }
            }

        })
    }
}

export default BuildImage