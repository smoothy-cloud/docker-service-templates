import TemplateUtils from 'tests'
import path from 'path'

const utils = new TemplateUtils(path.resolve(__dirname, '../'))

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
        'daemons': [],
        'build_assets': true,
        'package_manager': 'npm',
        'build_assets_script': 'npm run production',
        'deploy_script': 'php artisan config:cache\nphp artisan route:cache\nphp artisan view:cache\nrm public/storage\nphp artisan storage:link'
    }

    const environment = {
        'APP_KEY': 'base64:c3SzeMQZZHPT+eLQH6BnpDhw/uKH2N5zgM2x2a8qpcA=',
        'APP_ENV': 'production',
        'APP_DEBUG': false,
    }

    const service = await utils.installTemplate(code_repository_path, variables, environment)

    try {

        const host = `http://localhost:${service.entrypoints.laravel_service}`

        await page.goto(`${host}/`)
        await expect(await page.url()).toEqual(`${host}/`)
        await expect(await page.content()).toContain('Laravel')

        await page.goto(`${host}/phpinfo`)
        await expect(await page.url()).toEqual(`${host}/phpinfo`)

        const html = await page.evaluate(() => document.body.innerHTML)
        await expect(html).toContain('<tr><td class="e">post_max_size</td><td class="v">25M</td><td class="v">25M</td></tr>')
        await expect(html).toContain('<tr><td class="e">upload_max_filesize</td><td class="v">25M</td><td class="v">25M</td></tr>')

    } finally {
        await utils.uninstallTemplate(service)
    }

}, 1000 * 60 * 3)