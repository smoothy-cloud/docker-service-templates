#####################################
# BUILD ASSETS
#####################################

{% if variable.build_assets %}
FROM node:alpine as asset-stage

RUN mkdir -p {{ path('/app/', variable.path_to_source_code) }}
WORKDIR {{ path('/app/', variable.path_to_source_code) }}

{% if variable.package_manager == "npm" %}
COPY {{ path('code-repository/', variable.path_to_source_code, '/package*.json') }} {{ path('/app/', variable.path_to_source_code, '/') }}
RUN npm install --silent
{% elseif variable.package_manager == "yarn" %}
COPY {{ path('code-repository/', variable.path_to_source_code, '/package*.json') }} {{ path('code-repository/', variable.path_to_source_code, '/yarn.*') }} {{ path('/app/', variable.path_to_source_code, '/') }}
RUN yarn install --silent
{% endif %}

COPY {{ path('code-repository/', variable.path_to_source_code, '/') }} {{ path('/app/', variable.path_to_source_code, '/') }}

{% for path_to_shared_library in variable.paths_to_shared_libraries|list %}
COPY {{ path('code-repository/', path_to_shared_library, '/') }}  {{ path('/app/', path_to_shared_library, '/') }}
{% endfor %}

{% for command in variable.build_assets_script|trim|split('\n') %}
RUN {{ command }}
{% endfor %}
{% endif %}

#####################################
# CREATE PHP CONTAINER
#####################################

{% if variable.php_version == "7.4" %}
FROM smoothy/php-7.4-fpm:1.0.0
{% endif %}

# configure base image
ENV APPLICATION_ROOT {{ path('/var/www/html', variable.path_to_source_code, '/public') }}

{% if variable.system_dependencies|length > 0 %}
RUN apt-get -qq update \
 && apt-get -qq install \
    {% for dependency in variable.system_dependencies|list %}
        {{ dependency }} \
    {% endfor %}
    > /dev/null \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
{% endif %}

{% if variable.run_scheduler %}
COPY run_scheduler /etc/cron.d/run_scheduler
RUN crontab /etc/cron.d/run_scheduler
{% endif %}

COPY {{ path('code-repository/', variable.path_to_source_code, '/') }} {{ path('/var/www/html', variable.path_to_source_code, '/') }}

{% for path_to_shared_library in variable.paths_to_shared_libraries|list %}
COPY {{ path('code-repository/', path_to_shared_library, '/') }}  {{ path('/var/www/html', path_to_shared_library, '/') }}
{% endfor %}

{% if variable.build_assets %}
COPY --from=asset-stage {{ path('/app/', variable.path_to_source_code, '/public') }} {{ path('/var/www/html/', variable.path_to_source_code, '/public') }}
{% endif %}

RUN chown -R www-data:smoothy /var/www/html \
 && chmod -R 775 {{ path('/var/www/html/', variable.path_to_source_code, '/storage') }} \
 && chmod -R 775 {{ path('/var/www/html/', variable.path_to_source_code, '/bootstrap/cache') }}

WORKDIR {{ path('/var/www/html/', variable.path_to_source_code) }}

{% for private_composer_registry in variable.private_composer_registries|list %}
ARG PRIVATE_COMPOSER_REGISTRY_URL_{{ loop.index0 }}
ARG PRIVATE_COMPOSER_REGISTRY_USERNAME_{{ loop.index0 }}
ARG PRIVATE_COMPOSER_REGISTRY_PASSWORD_{{ loop.index0 }}
RUN composer config $PRIVATE_COMPOSER_REGISTRY_URL_{{ loop.index0 }} $PRIVATE_COMPOSER_REGISTRY_USERNAME_{{ loop.index0 }} $PRIVATE_COMPOSER_REGISTRY_PASSWORD_{{ loop.index0 }}
{% endfor %}

RUN composer install --quiet --ignore-platform-reqs --no-interaction --prefer-dist

COPY run.sh /entrypoints/run.sh
