import TemplateUtils from 'tests'
import path from 'path'
import Docker from 'dockerode'
import { Service } from '@/types'

const utils = new TemplateUtils(path.resolve(__dirname, '../'))
const redis_utils = new TemplateUtils(path.resolve(__dirname, '../../redis'))

test('the template is valid', async () => {

    await utils.assertThatTheTemplateSyntaxIsValid()

})

test('the template can be parsed', async () => {

    const variables = {
        'path_to_source_code': 'services/laravel/',
        'paths_to_shared_libraries': [
            'libraries/ui-components',
        ],
        'php_version': '7.4',
        'private_composer_registries': [
            {
                'url': 'private.packagist.com',
                'username': 'john.doe@example.com',
                'password': 'secret',
            }
        ],
        'system_dependencies': [
            'default-mysql-client'
        ],
        'timezone': 'Europe/Brussels',
        'opcache_enabled': true,
        'maximum_file_upload_size': 25,
        'run_scheduler': true,
        'daemons': [
            'php artisan horizon'
        ],
        'build_assets': true,
        'package_manager': 'npm',
        'build_assets_script': 'npm run production',
        'deploy_script': 'php artisan config:cache\nphp artisan route:cache\nphp artisan view:cache\nphp artisan migrate --force\nrm public/storage\nphp artisan storage:link'
    }

    const environment = {
        'APP_KEY': 'base64:c3SzeMQZZHPT+eLQH6BnpDhw/uKH2N5zgM2x2a8qpcA=',
        'APP_ENV': 'production',
        'APP_DEBUG': false,
    }

    const actual_template = await utils.parseTemplate('app', 'backend', variables, environment)

    const expected_template = utils.readParsedTemplateFile(__dirname+'/concerns/parsed_template.yml')

    utils.assertThatTemplatesAreEqual(actual_template, expected_template)

})

test("the service works correctly when installed", async () => {

    const code_repository_path = path.resolve(__dirname, 'concerns/application/')
    
    const variables = {
        'path_to_source_code': '',
        'paths_to_shared_libraries': [],
        'php_version': '7.4',
        'private_composer_registries': [],
        'system_dependencies': [
            'default-mysql-client'
        ],
        'timezone': 'Europe/Brussels',
        'opcache_enabled': true,
        'maximum_file_upload_size': 25,
        'run_scheduler': true,
        'daemons': [
            'php artisan queue:work'
        ],
        'build_assets': true,
        'package_manager': 'npm',
        'build_assets_script': 'npm run production',
        'deploy_script': 'php artisan config:cache\nphp artisan route:cache\nphp artisan migrate --force\nphp artisan view:cache\nrm -f public/storage\nphp artisan storage:link'
    }

    const redis_service = await redis_utils.installTemplate(null, { 'version': '6', 'password': 'abc123' })

    const environment = {
        'APP_KEY': 'base64:c3SzeMQZZHPT+eLQH6BnpDhw/uKH2N5zgM2x2a8qpcA=',
        'APP_ENV': 'production',
        'APP_DEBUG': false,
        'REDIS_HOST': 'host.docker.internal',
        'REDIS_PASSWORD': 'abc123',
        'REDIS_PORT': redis_service.entrypoints.redis,
    }

    const laravel_service = await utils.installTemplate(code_repository_path, variables, environment)

    try {

        const host = `http://localhost:${laravel_service.entrypoints.laravel_service}`

        await assertThatHomepageCanBeVisited(host)
        await assertThatPhpinfoShowsTheExpectedConfiguration(host)
        await assertThatLogsAreWrittenToStdout(host, laravel_service)
        await assertThatCronJobIsExecuted(laravel_service)
        await assertThatQueuedJobsAreExecuted(host, laravel_service)

    } finally {
        await utils.uninstallTemplate(laravel_service)
        await utils.uninstallTemplate(redis_service)
    }

}, 1000 * 60 * 5)

async function assertThatHomepageCanBeVisited(host: string): Promise<void>
{
    await page.goto(`${host}/`)
    await expect(await page.url()).toEqual(`${host}/`)
    await expect(await page.content()).toContain('Laravel')
}

async function assertThatPhpinfoShowsTheExpectedConfiguration(host: string): Promise<void>
{
    await page.goto(`${host}/phpinfo`)
    await expect(await page.url()).toEqual(`${host}/phpinfo`)

    const html = await page.evaluate(() => document.body.innerHTML)
    await expect(html).toContain('<td class="e">post_max_size</td><td class="v">25M</td><td class="v">25M</td>')
    await expect(html).toContain('<td class="e">upload_max_filesize</td><td class="v">25M</td><td class="v">25M</td>')
    await expect(html).toContain('<td class="e">date.timezone</td><td class="v">Europe/Brussels</td>')
}

async function assertThatLogsAreWrittenToStdout(host: string, service: Service): Promise<void>
{
    const resources = service.template.template.deployment
    const laravel_container_id = resources.find(resource => resource.resource === 'container' && resource.name === 'laravel')?.id

    if(! laravel_container_id) fail()

    const laravel_container = await new Docker().getContainer(laravel_container_id)

    const logs_1 = await laravel_container.logs({ stdout: true, stderr: true, tail: 100, follow: false })

    expect(logs_1.toString()).toContain("Current default time zone: 'Europe/Brussels'")
    expect(logs_1.toString()).not.toContain("production.ERROR: Woops, something went wrong.")

    await page.goto(`${host}/log`)

    const logs_2 = await laravel_container.logs({ stdout: true, stderr: true, tail: 100, follow: false })

    expect(logs_2.toString()).toContain("production.ERROR: Woops, something went wrong.")
}

async function assertThatCronJobIsExecuted(service: Service): Promise<void>
{
    const resources = service.template.template.deployment
    const scheduler_container_id = resources.find(resource => resource.resource === 'container' && resource.name === 'scheduler')?.id

    if(! scheduler_container_id) fail()

    const scheduler_container = await new Docker().getContainer(scheduler_container_id)

    const logs_1 = await scheduler_container.logs({ stdout: true, stderr: true, tail: 100, follow: false })

    expect(logs_1.toString()).toContain('production.NOTICE: Cron job executed.')
}

async function assertThatQueuedJobsAreExecuted(host: string, service: Service): Promise<void>
{
    const resources = service.template.template.deployment

    const laravel_container_id = resources.find(resource => resource.resource === 'container' && resource.name === 'laravel')?.id
    const daemon_container_id = resources.find(resource => resource.resource === 'container' && resource.name === 'daemon_0')?.id

    if(! laravel_container_id) fail()
    if(! daemon_container_id) fail()

    const laravel_container = await new Docker().getContainer(laravel_container_id)
    const daemon_container = await new Docker().getContainer(daemon_container_id)

    await page.goto(`${host}/job`)

    await utils.sleep(5)

    const logs_1 = await laravel_container.logs({ stdout: true, stderr: true, tail: 100, follow: false })
    const logs_2 = await daemon_container.logs({ stdout: true, stderr: true, tail: 100, follow: false })

    console.log(logs_1.toString())
    console.log(logs_2.toString())
}