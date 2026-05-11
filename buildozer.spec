[app]

title = Content Creation
package.name = contentcreation
package.domain = com.kaushikin

source.dir = .
source.include_exts = py,png,jpg,jpeg,webp,svg,json,txt,kv,ttf,otf

version = 1.0

requirements = python3,kivy,pyjnius,android

orientation = portrait
fullscreen = 1

android.permissions = INTERNET,ACCESS_NETWORK_STATE

android.api = 35
android.minapi = 23
android.ndk = 25b

android.archs = arm64-v8a, armeabi-v7a

android.accept_sdk_license = True

[buildozer]

log_level = 2
warn_on_root = 1
