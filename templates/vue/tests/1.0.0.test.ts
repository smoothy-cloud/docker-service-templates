import * as tests from 'tests'
import path from 'path'
import ApiError from '@/api/ApiError';
import 'jest-extended'

const template_path = path.resolve(__dirname, '../')

test('the template is valid', async () => {

    const error = await tests.validateTemplate(template_path)

    expect(error).toBe(null)

})

test('the template cannot be parsed without package_manager and build_script', async () => {

    let thrown_error

    try {
        await tests.parseTemplate('service', template_path, '1.0.0', {})
    } catch (error) {
        thrown_error = error
    }

    expect(thrown_error).toBeInstanceOf(ApiError)
    expect(thrown_error.status).toBe(422)
    expect(thrown_error.errors).toMatchObject({
        package_manager: [ 'The package manager field is required.' ],
        build_script: [ 'The build script field is required.' ],
    })

})

describe('the template can be parsed', () => {
  
    test('with npm as package manager', async () => {
        
        const template = await tests.parseTemplate('service', template_path, '1.0.0', {
            'path_to_source_code': 'src/',
            'package_manager': 'npm',
            'build_script': "npm run build\nnpm run optimize"
        })
    
        const expected_template = tests.parseYamlFile(__dirname+'/concerns/parsed_templates/1.0.0/npm.yml')
    
        expect(template.template.deployment).toIncludeAllMembers(expected_template.template.deployment)
        expect(template.template.interface.logs).toIncludeAllMembers(expected_template.template.interface.logs)
        expect(template.files).toMatchObject(expected_template.files)

    })
  
    test('with yarn as package manager', async () => {
        
        const template = await tests.parseTemplate('service', template_path, '1.0.0', {
            'path_to_source_code': '',
            'package_manager': 'yarn',
            'build_script': "yarn run build"
        })
    
        const expected_template = tests.parseYamlFile(__dirname+'/concerns/parsed_templates/1.0.0/yarn.yml')
    
        expect(template.template.deployment).toIncludeAllMembers(expected_template.template.deployment)
        expect(template.template.interface.logs).toIncludeAllMembers(expected_template.template.interface.logs)
        expect(template.files).toMatchObject(expected_template.files)

    })
  
})

describe("the service works correctly when installed", () => {

    test('with npm as package manager', async () => {
        
        const code_repository_path = path.resolve(__dirname, 'concerns/application/')

        const service = await tests.installTemplate(code_repository_path, template_path, '1.0.0', {
            'path_to_source_code': 'vue/',
            'package_manager': 'npm',
            'build_script': "npm run build"
        })

        try {

            const host = `http://localhost:${service.entrypoints.vue_service}`

            await page.goto(`${host}/`)
            await expect(await page.url()).toEqual(`${host}/`)
            await expect(await page.content()).toContain('You are viewing page: foo')

            await page.goto(`${host}/bar`)
            await expect(await page.url()).toEqual(`${host}/bar`)
            await expect(await page.content()).toContain('You are viewing page: bar')

            await page.goto(`${host}/baz`)
            await expect(await page.url()).toEqual(`${host}/404`)
            await expect(await page.content()).toContain('Oops, page not found!')

        } finally {
            await tests.uninstallTemplate(service)
        }

    }, 1000 * 60 * 3)

    test('with yarn as package manager', async () => {
        
        const code_repository_path = path.resolve(__dirname, 'concerns/application/vue/')

        const service = await tests.installTemplate(code_repository_path, template_path, '1.0.0', {
            'path_to_source_code': './',
            'package_manager': 'yarn',
            'build_script': "yarn run build"
        })

        try {

            const host = `http://localhost:${service.entrypoints.vue_service}`

            await page.goto(`${host}/`)
            await expect(await page.url()).toEqual(`${host}/`)
            await expect(await page.content()).toContain('You are viewing page: foo')

            await page.goto(`${host}/bar`)
            await expect(await page.url()).toEqual(`${host}/bar`)
            await expect(await page.content()).toContain('You are viewing page: bar')

            await page.goto(`${host}/baz`)
            await expect(await page.url()).toEqual(`${host}/404`)
            await expect(await page.content()).toContain('Oops, page not found!')

        } finally {
            await tests.uninstallTemplate(service)
        }

    }, 1000 * 60 * 3)

})