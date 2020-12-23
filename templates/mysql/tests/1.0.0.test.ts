import { InstallTemplate, UninstallTemplate, ValidateTemplate, ParseTemplate } from 'tests'
import path from 'path'
import ApiError from '@/api/ApiError';
import fs from 'fs'
import 'jest-extended'
import mysql from 'mysql2'

const template_path = path.resolve(__dirname, '../')

test('the template is valid', async () => {

    const error = await (new ValidateTemplate).execute(template_path)

    expect(error).toBe(null)

})

test('the template cannot be parsed without mysql_version and mysql_root_password', async () => {

    let thrown_error

    try {
        await (new ParseTemplate).execute('service', template_path, '1.0.0', {})
    } catch (error) {
        thrown_error = error
    }

    expect(thrown_error).toBeInstanceOf(ApiError)
    expect(thrown_error.status).toBe(422)
    expect(thrown_error.errors).toMatchObject({
        mysql_version: [ 'The version field is required.' ],
        mysql_root_password: [ 'The root password field is required.' ],
    })

})

test('the template can be parsed', async () => {

    const template = await (new ParseTemplate).execute('service', template_path, '1.0.0', {
        'mysql_version': '8.0',
        'mysql_root_password': 'abc123',
    })

    const expected_template = JSON.parse(
        fs.readFileSync(__dirname+'/concerns/parsed_templates/1.0.0/template.json').toString()
    )

    expect(template.template.deployment).toIncludeAllMembers(expected_template.template.deployment)
    expect(template.template.interface.logs).toIncludeAllMembers(expected_template.template.interface.logs)

})

test("the mysql 5.7 service works correctly when installed", async () => {

    const service = await (new InstallTemplate).execute(template_path, '1.0.0', {
        'mysql_version': '5.7',
        'mysql_root_password': 'secret',
    }, 30)

    try {

        const pool = mysql.createPool({
            host: '127.0.0.1',
            user: 'root',
            port: service.entrypoints['mysql'],
            password : 'secret',
        })

        pool.query('SELECT 1 + 1 AS solution', function(error, result, fields) {
            const rows = (result as any)
            expect(rows[0].solution).toBe(2)
        })
        
        pool.query('SELECT VERSION() AS version', function(error, result, fields) {
            const rows = (result as any)
            expect(rows[0].version).toBeString()
            expect(rows[0].version).toStartWith('5.7')
        })

    } finally {
        await (new UninstallTemplate).execute(service)
    }

}, 1000 * 60 * 3)

test("the mysql 8.0 service works correctly when installed", async () => {

    const service = await (new InstallTemplate).execute(template_path, '1.0.0', {
        'mysql_version': '8.0',
        'mysql_root_password': 'secret',
    }, 30)

    try {

        const pool = mysql.createPool({
            host: '127.0.0.1',
            user: 'root',
            port: service.entrypoints['mysql'],
            password : 'secret'
        })

        pool.query('SELECT 1 + 1 AS solution', function(error, result, fields) {
            const rows = (result as any)
            expect(rows[0].solution).toBe(2)
        })
        
        pool.query('SELECT VERSION() AS version', function(error, result, fields) {
            const rows = (result as any)
            expect(rows[0].version).toBeString()
            expect(rows[0].version).toStartWith('8.0')
        })

    } finally {
        await (new UninstallTemplate).execute(service)
    }

}, 1000 * 60 * 3)