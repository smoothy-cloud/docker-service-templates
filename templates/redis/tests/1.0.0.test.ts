import * as tests from 'tests'
import path from 'path'
import ApiError from '@/api/ApiError';
import 'jest-extended'
import { promisify } from 'util'
import redis from 'redis'

const template_path = path.resolve(__dirname, '../')

test('the template is valid', async () => {

    const error = await tests.validateTemplate(template_path)

    expect(error).toBe(null)

})

test('the template cannot be parsed without redis_version and redis_password', async () => {

    let thrown_error

    try {
        await tests.parseTemplate('app', 'cache', template_path, '1.0.0')
    } catch (error) {
        thrown_error = error
    }

    expect(thrown_error).toBeInstanceOf(ApiError)
    expect(thrown_error.status).toBe(422)
    expect(thrown_error.errors).toMatchObject({
        redis_version: [ 'The version field is required.' ],
        redis_password: [ 'The password field is required.' ],
    })

})

test('the template can be parsed', async () => {

    const variables = {
        'redis_version': '6.0',
        'redis_password': 'abc123',
    }

    const template = await tests.parseTemplate('app', 'cache', template_path, '1.0.0', variables)

    const expected_template = tests.parseYamlFile(__dirname+'/concerns/parsed_templates/1.0.0/template.yml')

    expect(template.template.deployment).toIncludeAllMembers(expected_template.template.deployment)
    expect(template.template.interface.logs).toIncludeAllMembers(expected_template.template.interface.logs)

})

test("the redis 5.0 service works correctly when installed", async () => {

    const variables = {
        'redis_version': '5.0',
        'redis_password': 'secret',
    }

    const service = await tests.installTemplate(null, template_path, '1.0.0', variables)

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

test("the redis 6.0 service works correctly when installed", async () => {

    const variables = {
        'redis_version': '6.0',
        'redis_password': 'secret',
    }

    const service = await tests.installTemplate(null, template_path, '1.0.0', variables)

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