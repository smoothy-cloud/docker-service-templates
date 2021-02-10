#!/bin/bash

while [ true ]
do
    /usr/local/bin/php {{ path('/var/www/html', variable.path_to_source_code, '/artisan') }} schedule:run &
    sleep 60
done