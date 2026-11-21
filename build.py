#!/usr/bin/env python3
"""Builds sfb-duel.html from src/ (same result as build.ps1). Usage: python3 build.py [output]"""
import os,sys
root=os.path.dirname(os.path.abspath(__file__))
def rd(rel):
    with open(os.path.join(root,'src',rel),encoding='utf-8',newline='') as f:return f.read().replace('\r\n','\n')
js=''.join(rd(l.strip()) for l in rd('manifest.txt').split('\n') if l.strip() and not l.strip().startswith('#'))
html=rd('template.html').replace('@@CSS@@',rd('style.css')).replace('@@JS@@',js)
out=sys.argv[1] if len(sys.argv)>1 else os.path.join(root,'sfb-duel.html')
with open(out,'w',encoding='utf-8',newline='') as f:f.write(html)
print('Built',out,len(html),'characters')
