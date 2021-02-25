#!/bin/bash

#####################################
# init Laravel application
#####################################

{% for command in variable.init_script|trim|split('\n') %}
{{ command }}
{% endfor %}