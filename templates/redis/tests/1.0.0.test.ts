import * as tests from 'tests'
import path from 'path'
import ApiError from '@/api/ApiError';
import 'jest-extended'
import { promisify } from 'util'
import redis from 'redis'

const template_version = '1.0.0'
const template_path = path.resolve(__dirname, '../')

test('the template is valid', async () => {

    const error = await tests.validateTemplate(template_path)

    expect(error).toBe(null)

})

test('the template cannot be parsed without version and password', async () => {

    let thrown_error

    try {
        await tests.parseTemplate('app', 'cache', template_path, template_version)
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

    const template = await tests.parseTemplate('app', 'cache', template_path, template_version, variables)

    const expected_template = tests.parseYamlFile(__dirname+'/concerns/parsed_templates/1.0.0/template.yml')

    expect(template.template.deployment).toIncludeAllMembers(expected_template.template.deployment)
    expect(template.template.interface.logs).toIncludeAllMembers(expected_template.template.interface.logs)

})

test("the redis 5 service works correctly when installed", async () => {

    const variables = {
        'version': '5',
        'password': 'secret',
    }

    const service = await tests.installTemplate(null, template_path, template_version, variables)

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
        await tests.uninstallTemplate(service)
    }

}, 1000 * 60 * 3)

test("the redis 6 service works correctly when installed", async () => {

    const variables = {
        'version': '6',
        'password': 'secret',
    }

    const service = await tests.installTemplate(null, template_path, template_version, variables)

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
        await tests.uninstallTemplate(service)
    }

}, 1000 * 60 * 3)