#!/bin/bash

# Define the output file
output_file="file"

# Clear the output file if it exists
> "$output_file"

# Function to append file name and contents to the output file
append_file_contents() {
    local file_path="$1"
    echo "===== $file_path =====" >> "$output_file"
    # cat "$file_path" >> "$output_file"
    tr -d '\n \t' < "$file_path" >> "$output_file"
    echo "" >> "$output_file" # Add a newline for readability
}

# Append ../index.html if it exists
if [ -f "../index.html" ]; then
    append_file_contents "../index.html"
fi

if [ -f "../css/styles.css" ]; then
    append_file_contents "../css/styles.css"
fi

# Loop through all .js files in the current directory and its subdirectories
find . -name "*.js" -type f | while read -r file
do
    append_file_contents "$file"
done

echo "All files have been appended to $output_file"
