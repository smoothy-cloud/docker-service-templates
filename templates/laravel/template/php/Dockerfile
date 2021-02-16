#####################################
# CREATE PHP CONTAINER
#####################################

{% if variable.php_version == "7.4" %}
FROM smoothy/php-fpm:7.4-1.0.0
{% endif %}

ENV APPLICATION_ROOT {{ path('/var/www/html', variable.path_to_source_code, '/public') }}

{% if variable.system_dependencies|length > 0 %}
RUN apt-get -qq update \
 && apt-get -qq install \
    {% for dependency in variable.system_dependencies %}
        {{ dependency }} \
    {% endfor %}
    > /dev/null \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
{% endif %}

COPY {{ path('code-repository/', variable.path_to_source_code, '/') }} {{ path('/var/www/html', variable.path_to_source_code, '/') }}

{% for path_to_shared_library in variable.paths_to_shared_libraries %}
COPY {{ path('code-repository/', path_to_shared_library, '/') }}  {{ path('/var/www/html', path_to_shared_library, '/') }}
{% endfor %}

RUN chown -R smoothy:smoothy /var/www/html \
 && chmod -R 775 {{ path('/var/www/html/', variable.path_to_source_code, '/storage') }} \
 && chmod -R 775 {{ path('/var/www/html/', variable.path_to_source_code, '/bootstrap/cache') }}

WORKDIR {{ path('/var/www/html/', variable.path_to_source_code) }}

{% for private_composer_registry in variable.private_composer_registries %}
ARG PRIVATE_COMPOSER_REGISTRY_URL_{{ loop.key }}
ARG PRIVATE_COMPOSER_REGISTRY_USERNAME_{{ loop.key }}
ARG PRIVATE_COMPOSER_REGISTRY_PASSWORD_{{ loop.key }}
RUN composer config $PRIVATE_COMPOSER_REGISTRY_URL_{{ loop.key }} $PRIVATE_COMPOSER_REGISTRY_USERNAME_{{ loop.key }} $PRIVATE_COMPOSER_REGISTRY_PASSWORD_{{ loop.key }}
{% endfor %}

RUN composer install --ignore-platform-reqs --no-dev --no-interaction --prefer-dist

COPY --chown=smoothy:smoothy php/run.sh /entrypoints/run.sh
COPY --chown=smoothy:smoothy php/scheduler.sh /scheduler.sh
