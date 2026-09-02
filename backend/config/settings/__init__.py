"""
Settings Package Init

WHAT: Makes config/settings/ a Python package.
WHY:  When Django looks for config.settings.development, Python needs __init__.py
      to know that 'settings' is a package (directory), not a module (file).
"""
