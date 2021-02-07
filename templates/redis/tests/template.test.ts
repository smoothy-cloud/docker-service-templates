import TemplateUtils from 'tests'
import path from 'path'
import ApiError from '@/api/ApiError';
import { promisify } from 'util'
import redis from 'redis'

const utils = new TemplateUtils(path.resolve(__dirname, '../'))

test('the template is valid', async () => {

    await utils.assertThatTheTemplateSyntaxIsValid()

})

test('the template cannot be parsed without version and password', async () => {

    let thrown_error

    try {
        await utils.parseTemplate('app', 'cache')
    } catch (error) {
        thrown_error = error
    }

    expect(thrown_error).toBeInstanceOf(ApiError)
    expect(thrown_error.status).toBe(422)
    expect(thrown_error.errors).toMatchObject({
        version: [ 'The version field is required.' ],
        password: [ 'The password field is required.' ],
    })

})

test('the template can be parsed', async () => {

    const variables = {
        'version': '6',
        'password': 'abc123',
    }

    const actual_template = await utils.parseTemplate('app', 'cache', variables)

    const expected_template = utils.readParsedTemplateFile(__dirname+'/concerns/parsed_template.yml')

    utils.assertThatTemplatesAreEqual(actual_template, expected_template)

})

test("the redis 5 service works correctly when installed", async () => {

    const variables = {
        'version': '5',
        'password': 'secret',
    }

    const service = await utils.installTemplate(null, variables)

    try {

        const client = redis.createClient({
            host: '127.0.0.1',
            port: service.entrypoints['redis'],
            password: 'secret'
        })
    
        const setAsync = promisify(client.set).bind(client)
        const getAsync = promisify(client.get).bind(client)
    
        await setAsync('foo', 'bar')

        expect(await getAsync('foo')).toEqual('bar')
        expect(client.server_info.versions[0]).toEqual(5)

        client.quit()

    } finally {
        await utils.uninstallTemplate(service)
    }

}, 1000 * 60 * 3)

test("the redis 6 service works correctly when installed", async () => {

    const variables = {
        'version': '6',
        'password': 'secret',
    }

    const service = await utils.installTemplate(null, variables)

    try {

        const client = redis.createClient({
            host: '127.0.0.1',
            port: service.entrypoints['redis'],
            password: 'secret',
        })
    
        const setAsync = promisify(client.set).bind(client)
        const getAsync = promisify(client.get).bind(client)
    
        await setAsync('foo', 'bar')

        expect(await getAsync('foo')).toEqual('bar')
        expect(client.server_info.versions[0]).toEqual(6)

        client.quit()

    } finally {
        await utils.uninstallTemplate(service)
    }

}, 1000 * 60 * 3)