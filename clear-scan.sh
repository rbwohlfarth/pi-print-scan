#!/bin/bash
# 
# Copyright (c) 2017 Robert Wohlfarth <rbwohlfarth@gmail.com>
# Released under the GNU GPL 3.0 or later.

ID="$1"
if [ -n "$ID" ]; then
    rm "$ID/*"
    rmdir "$ID"
fi