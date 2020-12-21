export interface PrivateTemplateDetails {
    deployment_type: "docker_server" | "kubernetes_cluster";
    meta: Record<string, any>;
    versions: string[];
    private?: boolean;
    template_name?: string;
    path?: string;
}

export interface PrivateTemplate extends Template {
    template_name: string;
    template_version: string;
}

export interface ImportedTemplate {
    details: PrivateTemplateDetails
    versions: Record<string, PrivateTemplate>
}

export type TemplateFiles = Record<string, string>

export type Variables = Record<string, any>

export type Resource = Image | Volume | ConfigFile | Container | Entrypoint

export interface Interface {
    logs?: LogInterface[]
    volumes?: VolumeInterface[]
}

export interface LogInterface {
    //
}

export interface VolumeInterface {
    //
}

export interface Service {
    id: string
    template: Template
    entrypoints: Record<string, number>
}

export interface TemplateSpec {
    deployment: Resource[]
    interface: Interface
}

export interface Template {
    template: TemplateSpec;
    files: TemplateFiles;
}

export interface Image {
    name: string;
    resource: "image";
    dockerfile: string;
    code_repository: string;
}

export interface Volume {
    name: string;
    resource: "volume";
}

export interface ConfigFile {
    name: string;
    resource: "config_file";
    contents: string;
}

export interface CommandPart {
    part: string;
}

export interface EnvironmentVariable {
    key: string;
    value: any;
}

export interface VolumeMount {
    volume: string;
    mount_path: string;
}

export interface ConfigFileMount {
    config_file: string;
    mount_path: string;
}

export interface Container {
    name: string;
    resource: "container";
    image: string;
    command?: CommandPart[];
    environment?: EnvironmentVariable[];
    volume_mounts?: VolumeMount[];
    config_file_mounts?: ConfigFileMount[];
}

export interface Entrypoint {
    name: string;
    resource: "entrypoint";
    container: string;
    port: number;
    host_port: number;
}