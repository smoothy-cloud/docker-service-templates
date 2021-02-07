import TemplateUtils from 'tests'
import path from 'path'
import ApiError from '@/api/ApiError';

const utils = new TemplateUtils(path.resolve(__dirname, '../'))

test('the template is valid', async () => {

    await utils.assertThatTheTemplateSyntaxIsValid()

})

test('the template cannot be parsed without package_manager and build_script', async () => {

    let thrown_error

    try {
        await utils.parseTemplate('app', 'website')
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

        const variables = {
            'path_to_source_code': 'src/',
            'package_manager': 'npm',
            'build_script': "npm run build\nnpm run optimize"
        }
        
        const actual_template = await utils.parseTemplate('app', 'website', variables)
    
        const expected_template = utils.readParsedTemplateFile(__dirname+'/concerns/parsed_templates/npm.yml')
    
        utils.assertThatTemplatesAreEqual(actual_template, expected_template)

    })
  
    test('with yarn as package manager', async () => {

        const variables = {
            'path_to_source_code': '',
            'package_manager': 'yarn',
            'build_script': "yarn run build"
        }
        
        const actual_template = await utils.parseTemplate('app', 'website', variables)
    
        const expected_template = utils.readParsedTemplateFile(__dirname+'/concerns/parsed_templates/yarn.yml')
    
        utils.assertThatTemplatesAreEqual(actual_template, expected_template)

    })
  
})

describe("the service works correctly when installed", () => {

    test('with npm as package manager', async () => {
        
        const code_repository_path = path.resolve(__dirname, 'concerns/application/')

        const variables = {
            'path_to_source_code': 'vue/',
            'package_manager': 'npm',
            'build_script': "npm run build"
        }

        const service = await utils.installTemplate(code_repository_path, variables)

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
            await utils.uninstallTemplate(service)
        }

    }, 1000 * 60 * 3)

    test('with yarn as package manager', async () => {
        
        const code_repository_path = path.resolve(__dirname, 'concerns/application/vue/')

        const variables = {
            'path_to_source_code': '/',
            'package_manager': 'yarn',
            'build_script': "yarn run build"
        }

        const service = await utils.installTemplate(code_repository_path, variables)

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
            await utils.uninstallTemplate(service)
        }

    }, 1000 * 60 * 3)

})