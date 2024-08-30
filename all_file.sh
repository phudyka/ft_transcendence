#!/bin/bash

# Define the output file
output_file="file.txt"

# Clear the output file if it exists
> "$output_file"

# Function to append file name and contents to the output file
append_file_contents() {
    local file_path="$1"
    echo "===== $file_path =====" >> "$output_file"
    awk 'BEGIN { ORS="" } { gsub(/[ \t\n]+/, ""); print }' "$file_path" >> "$output_file"
    echo "" >> "$output_file" # Add a newline for readability
}

# Append index.html if it exists
if [ -f "index.html" ]; then
    append_file_contents "index.html"
fi

if [ -f "styles.css" ]; then
    append_file_contents "styles.css"
fi

# Exclude node_modules and Django-specific directories
exclude_dirs=( "./node_modules" "./venv" "./env" "./__pycache__" "./migrations")

# Find all .js and Django config files excluding specified directories
find . -type f \( -name "index.html" -o -name "*.js" -o -name "admin.py" -o -name "apps.py" -o -name "models.py" -o -name "urls.py" -o -name "views.py" -o -name "asgi.py" -o -name "settings.py" -o -name "wsgi.py" \) ! -path "*/node_modules/*" ! -path "*/venv/*" ! -path "*/env/*" ! -path "*/__pycache__/*" ! -path "*/migrations/*" | while read -r file
do
    append_file_contents "$file"
done

echo "All .js and Django config files, and index.html have been appended to $output_file"

