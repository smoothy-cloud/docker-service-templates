export interface PrivateTemplateDetails {
    deployment_type: "docker_server" | "kubernetes_cluster";
    meta: Record<string, any>;
    versions: string[];
    private?: boolean;
    template_name?: string;
    path?: string;
}

export interface PrivateTemplate extends ParsedTemplate {
    template_name: string;
    template_version: string;
}

export interface ImportedTemplate {
    details: PrivateTemplateDetails
    versions: Record<string, PrivateTemplate>
}

export type TemplateFiles = Record<string, string>

export type Variables = Record<string, any>

export type Resource = Image | Volume | ConfigFile | Container | Job | Entrypoint

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

export interface TemplateSpec {
    deployment: Resource[]
    interface: Interface
}

export interface ParsedTemplate {
    template: TemplateSpec;
    files: TemplateFiles;
}

export interface Image {
    name: string;
    id: string;
    type: "image";
    dockerfile: string;
    code_repository: string;
}

export interface Volume {
    name: string;
    id: string;
    type: "volume";
}

export interface ConfigFile {
    name: string;
    id: string;
    type: "config_file";
    contents: string;
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
    id: string;
    type: "container";
    image: string;
    command?: string[];
    environment?: EnvironmentVariable[];
    volume_mounts?: VolumeMount[];
    config_file_mounts?: ConfigFileMount[];
}

export interface Job {
    name: string;
    id: string;
    type: "job";
    image: string;
    command: string[];
    environment?: EnvironmentVariable[];
    volume_mounts?: VolumeMount[];
    config_file_mounts?: ConfigFileMount[];
}

export interface Entrypoint {
    name: string;
    id: string;
    type: "entrypoint";
    container: string;
    port: number;
    host_port?: number;
}