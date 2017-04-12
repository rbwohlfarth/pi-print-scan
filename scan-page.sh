#!/bin/bash
# 
# Copyright (c) 2017 Robert Wohlfarth <rbwohlfarth@gmail.com>
# Released under the GNU GPL 3.0 or later.

ID="$1"
if [ -z "$ID" ]; then
    ID=$(mktemp --directory 'pi-print-scan-XXXXXX')
fi

PAGE=$(ls -1 "$ID" | wc --lines)
PAGE=$((PAGE+1))
FILE=$(mktemp --suffix='pnm' --tmpdir="$ID" "page-$PAGE-XXXXXX")
scanimage --resolution 600 > "$FILE"

echo "$ID"
