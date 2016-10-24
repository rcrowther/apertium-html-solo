#!/usr/bin/env python3

import json
import os.path

def run(json_path, out_path, config_path):
    JIn = json.loads("".join(open(json_path).readlines()))
 
    count = 0
    sampleLinkHTML = ''
    
    for k, v in JIn.items():        
        # generate sample HTML files
        oP = os.path.join(out_path, "sample-" + str(count) + ".htm")
        with open(oP, 'w') as out:
            out.write(v[1])

        # generate link HTML
        title = k
        if v[0]:
            title = '"' + title + '"'
        sampleLinkHTML += "<li><a href=\"#\" id=\"sampleLink-{0}\" class=\"sampleLink\">{1}</a></li>\n".format(count, title)
        
        count = count + 1
        
    # rewrite links
    with open(config_path, 'w') as out:
        out.write(sampleLinkHTML)



if __name__ == "__main__":
    run('samples.json', 'build', 'samplelinks.html.in')
