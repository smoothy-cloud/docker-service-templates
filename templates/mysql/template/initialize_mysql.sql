{% for database in variable.databases %}
CREATE DATABASE IF NOT EXISTS {{ database.name }};
GRANT ALL PRIVILEGES ON {{ database.name }}.* TO '{{ variable.mysql_user }}'@'%';
{% endfor %}