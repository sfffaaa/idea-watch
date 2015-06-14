#!/usr/bin/python
# -*- coding: utf-8 -*-

import goslate
import sys
import json

gs = goslate.Goslate()

translate = []
for word in sys.argv[1:]:
	translate.append(gs.translate(word, 'zh-TW'))

print json.dumps(translate)
	
