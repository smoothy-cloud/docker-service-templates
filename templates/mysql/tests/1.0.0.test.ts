import * as tests from 'tests'
import path from 'path'
import 'jest-extended'
import mysql from 'mysql2'

const template_version = 'latest'
const template_path = path.resolve(__dirname, '../')

test('the template is valid', async () => {

    const error = await tests.validateTemplate(template_path)

    expect(error).toBe(null)

})

test('the template can be parsed', async () => {

    const variables = {
        'version': '8.0',
        'root_password': 'abc123',
        'user': 'johndoe',
        'password': 's3cr3t',
        'databases': [
            { 'name': 'gaming_platform' },
            { 'name': 'backups' },
        ]
    }

    const template = await tests.parseTemplate('app', 'database', template_path, template_version, variables)

    const expected_template = tests.parseYamlFile(__dirname+'/concerns/parsed_templates/1.0.0/template.yml')

    expect(template.template.deployment).toIncludeAllMembers(expected_template.template.deployment)
    expect(template.template.interface.logs).toIncludeAllMembers(expected_template.template.interface.logs)

})

test("the mysql 5.7 service works correctly when installed", async () => {

    const variables = {
        'version': '5.7',
        'root_password': 'secret',
        'user': 'johndoe',
        'password': 's3cr3t',
        'databases': [
            { 'name': 'gaming_platform' },
            { 'name': 'backups' },
        ]
    }

    const service = await tests.installTemplate(null, template_path, template_version, variables, {}, 30)

    try {

        const root_pool = mysql.createPool({
            host: '127.0.0.1',
            user: 'root',
            port: service.entrypoints['mysql'],
            password : 'secret',
        })

        root_pool.query('SELECT 1 + 1 AS solution', function(error, result, fields) {
            const rows = (result as any)
            expect(rows[0].solution).toBe(2)
        })
        
        root_pool.query('SELECT VERSION() AS version', function(error, result, fields) {
            const rows = (result as any)
            expect(rows[0].version).toBeString()
            expect(rows[0].version).toStartWith('5.7')
        })
        
        root_pool.query('SHOW DATABASES', function(error, result, fields) {
            const rows = (result as any)
            expect(rows.find((row: any) => row.Database === 'gaming_platform')).toBeDefined()
            expect(rows.find((row: any) => row.Database === 'backups')).toBeDefined()
        })

        const user_pool = mysql.createPool({
            host: '127.0.0.1',
            user: 'johndoe',
            port: service.entrypoints['mysql'],
            password : 's3cr3t',
        })

        user_pool.query('SHOW DATABASES', function(error, result, fields) {
            const rows = (result as any)
            expect(rows.find((row: any) => row.Database === 'gaming_platform')).toBeDefined()
            expect(rows.find((row: any) => row.Database === 'backups')).toBeDefined()
        })

    } finally {
        await tests.uninstallTemplate(service)
    }

}, 1000 * 60 * 3)

test("the mysql 8.0 service works correctly when installed", async () => {

    const variables = {
        'version': '8.0',
        'root_password': 'secret',
        'user': 'johndoe',
        'password': 's3cr3t',
        'databases': [
            { 'name': 'gaming_platform' },
            { 'name': 'backups' },
        ]
    }

    const service = await tests.installTemplate(null, template_path, template_version, variables, {}, 30)

    try {

        const root_pool = mysql.createPool({
            host: '127.0.0.1',
            user: 'root',
            port: service.entrypoints['mysql'],
            password : 'secret',
        })

        root_pool.query('SELECT 1 + 1 AS solution', function(error, result, fields) {
            const rows = (result as any)
            expect(rows[0].solution).toBe(2)
        })
        
        root_pool.query('SELECT VERSION() AS version', function(error, result, fields) {
            const rows = (result as any)
            expect(rows[0].version).toBeString()
            expect(rows[0].version).toStartWith('8.0')
        })
        
        root_pool.query('SHOW DATABASES', function(error, result, fields) {
            const rows = (result as any)
            expect(rows.find((row: any) => row.Database === 'gaming_platform')).toBeDefined()
            expect(rows.find((row: any) => row.Database === 'backups')).toBeDefined()
        })

        const user_pool = mysql.createPool({
            host: '127.0.0.1',
            user: 'johndoe',
            port: service.entrypoints['mysql'],
            password : 's3cr3t',
        })

        user_pool.query('SHOW DATABASES', function(error, result, fields) {
            const rows = (result as any)
            expect(rows.find((row: any) => row.Database === 'gaming_platform')).toBeDefined()
            expect(rows.find((row: any) => row.Database === 'backups')).toBeDefined()
        })

    } finally {
        await tests.uninstallTemplate(service)
    }

}, 1000 * 60 * 3)