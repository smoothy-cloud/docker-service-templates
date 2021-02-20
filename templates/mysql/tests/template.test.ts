import { Template, utils } from 'tests'
import path from 'path'
import mysql from 'mysql2'

const mysql_template = new Template(path.resolve(__dirname, '../'))

test('the template is valid', async () => {

    await mysql_template.assertThatSyntaxIsValid()

})

test('the template can be parsed', async () => {

    const variables = {
        'version': '8.0',
        'root_password': 'abc123',
        'user': 'johndoe',
        'password': 's3cr3t',
        'databases': [
            { 'name': 'gaming_platform' },
            { 'name': 'platform-backups' },
        ]
    }

    const actual_template = await mysql_template.parse('app', 'database', variables)

    const expected_template = utils.readParsedTemplateFile(__dirname+'/concerns/parsed_template.yml')

    utils.assertThatTemplatesAreEqual(actual_template, expected_template)

})

test("the mysql 5.7 service works correctly when installed", async () => {

    const variables = {
        'version': '5.7',
        'root_password': 'secret',
        'user': 'johndoe',
        'password': 's3cr3t',
        'databases': [
            { 'name': 'gaming_platform' },
            { 'name': 'platform-backups' },
        ]
    }

    await mysql_template.install(null, variables, {}, 30)

    try {

        const root_pool = mysql.createPool({
            host: '127.0.0.1',
            user: 'root',
            port: mysql_template.getEntrypoint('mysql')?.host_port,
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
            expect(rows.find((row: any) => row.Database === 'platform-backups')).toBeDefined()
        })

        const user_pool = mysql.createPool({
            host: '127.0.0.1',
            user: 'johndoe',
            port: mysql_template.getEntrypoint('mysql')?.host_port,
            password : 's3cr3t',
        })

        user_pool.query('SHOW DATABASES', function(error, result, fields) {
            const rows = (result as any)
            expect(rows.find((row: any) => row.Database === 'gaming_platform')).toBeDefined()
            expect(rows.find((row: any) => row.Database === 'platform-backups')).toBeDefined()
        })

    } finally {
        await mysql_template.uninstall()
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
            { 'name': 'platform-backups' },
        ]
    }

    await mysql_template.install(null, variables, {}, 30)

    try {

        const root_pool = mysql.createPool({
            host: '127.0.0.1',
            user: 'root',
            port: mysql_template.getEntrypoint('mysql')?.host_port,
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
            expect(rows.find((row: any) => row.Database === 'platform-backups')).toBeDefined()
        })

        const user_pool = mysql.createPool({
            host: '127.0.0.1',
            user: 'johndoe',
            port: mysql_template.getEntrypoint('mysql')?.host_port,
            password : 's3cr3t',
        })

        user_pool.query('SHOW DATABASES', function(error, result, fields) {
            const rows = (result as any)
            expect(rows.find((row: any) => row.Database === 'gaming_platform')).toBeDefined()
            expect(rows.find((row: any) => row.Database === 'platform-backups')).toBeDefined()
        })

    } finally {
        await mysql_template.uninstall()
    }

}, 1000 * 60 * 3)