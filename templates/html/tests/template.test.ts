import TemplateUtils from 'tests'
import path from 'path'
import ApiError from '@/api/ApiError';

const utils = new TemplateUtils(path.resolve(__dirname, '../'))

test('the template is valid', async () => {

    await utils.assertThatTheTemplateSyntaxIsValid()

})

test('the template cannot be parsed without path_to_source_code', async () => {

    let thrown_error

    try {
        await utils.parseTemplate('app', 'website')
    } catch (error) {
        thrown_error = error
    }

    expect(thrown_error).toBeInstanceOf(ApiError)
    expect(thrown_error.status).toBe(422)
    expect(thrown_error.errors).toMatchObject({
        path_to_source_code: [ 'The path to html source code field is required.' ],
    })

})

test('the template can be parsed', async () => {

    const variables = {
        'path_to_source_code': 'src/',
    }

    const actual_template = await utils.parseTemplate('app', 'website', variables)

    const expected_template = utils.readParsedTemplateFile(__dirname+'/concerns/parsed_template.yml')

    utils.assertThatTemplatesAreEqual(actual_template, expected_template)

})

test("the service works correctly when installed", async () => {

    const code_repository_path = path.resolve(__dirname, 'concerns/application/')

    const variables = {
        'path_to_source_code': 'src/',
    }

    const service = await utils.installTemplate(code_repository_path, variables)

    try {

        const host = `http://localhost:${service.entrypoints.html_service}`

        await page.goto(`${host}/`)
        await expect(await page.url()).toEqual(`${host}/`)
        await expect(await page.content()).toContain('You are viewing the home page.')

        await page.goto(`${host}/index.html`)
        await expect(await page.url()).toEqual(`${host}/`)
        await expect(await page.content()).toContain('You are viewing the home page.')

        await page.goto(`${host}/hello`)
        await expect(await page.url()).toEqual(`${host}/hello`)
        await expect(await page.content()).toContain('You are viewing the hello page.')

        await page.goto(`${host}/hello.html`)
        await expect(await page.url()).toEqual(`${host}/hello`)
        await expect(await page.content()).toContain('You are viewing the hello page.')

        await page.goto(`${host}/hello/team`)
        await expect(await page.url()).toEqual(`${host}/hello/team`)
        await expect(await page.content()).toContain('You are viewing the team page.')

        await page.goto(`${host}/hello/team.html`)
        await expect(await page.url()).toEqual(`${host}/hello/team`)
        await expect(await page.content()).toContain('You are viewing the team page.')

        await page.goto(`${host}/baz`)
        await expect(await page.url()).toEqual(`${host}/baz`)
        await expect(await page.content()).toContain('Woops, page not found!')

    } finally {
        await utils.uninstallTemplate(service)
    }

}, 1000 * 60 * 3)