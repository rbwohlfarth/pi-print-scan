#!/bin/bash
# 
# Copyright (c) 2017 Robert Wohlfarth <rbwohlfarth@gmail.com>
# Released under the GNU GPL 3.0 or later.

output=$(mktemp --suffix='pnm' 'pi-print-scan-XXXXXX')
scanimage --resolution 600 > "$output"
gm convert "$output" "$output.jpg"
cat "$output.jpg"