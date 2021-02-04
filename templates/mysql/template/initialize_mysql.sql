{% for database in variable.databases %}
CREATE DATABASE IF NOT EXISTS {{ database }};
GRANT ALL PRIVILEGES ON {{ database }}.* TO '{{ variable.mysql_user }}'@'localhost';
{% endfor %}