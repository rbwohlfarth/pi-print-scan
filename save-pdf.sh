#!/bin/bash
# 
# Copyright (c) 2017 Robert Wohlfarth <rbwohlfarth@gmail.com>
# Released under the GNU GPL 3.0 or later.

ID="$1"
if [ -n "$ID" ]; then
    FILE=$(mktemp --suffix='pdf' --tmpdir="$ID" "document-XXXXXX")
    cd "$ID"
    gm convert *.pnm "$FILE"
    cat "$FILE"
fi