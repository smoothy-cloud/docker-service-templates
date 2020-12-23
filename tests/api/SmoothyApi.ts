import axios from 'axios'
import FormData from 'form-data'
import ApiError from '@/api/ApiError'
import { Template, ImportedTemplate, Variables } from '@/types'

export default class SmoothyApi {

    host = "https://api.smoothy.cloud"

    async validateTemplate(form: FormData): Promise<void>
    {
        try {
            await axios.post(`${this.host}/v1/service-templates/local/validate`, form, {
                headers: {
                    ...form.getHeaders()
                }
            })
        } catch (error) {
            throw new ApiError(error.response)
        }
    }

    async importTemplate(form: FormData): Promise<ImportedTemplate>
    {
        try {
            const response = await axios.post(`${this.host}/v1/service-templates/local/import`, form, {
                headers: {
                    ...form.getHeaders()
                }
            })

            return response.data.data
        } catch (error) {
            throw new ApiError(error.response)
        }
    }

    async parseTemplate(template: Template, service_id: string, variables: Variables): Promise<Template>
    {
        try {
            const response = await axios.post(`${this.host}/v1/service-templates/local/parse`, {
                template, 
                service_slug: service_id, 
                variables
            })

            return response.data.data
        } catch (error) {
            throw new ApiError(error.response)
        }
    }

}