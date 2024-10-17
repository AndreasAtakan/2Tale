# 2Tale

This repository contains the source-code for a hobby project to create an AI-driven mobile app that creates fictional stories based on a series of images.
The stories are saved on the device as mp4's with text-to-speech AI voice-over as audio and the image series with smooth transitions as video.


### TODO
- Register e-mail at API
- Add AdSense bar on top of screen (that persists when navigating between views)

- Fix ffmpeg bugs
`ffmpeg -loop 1 -i in.jpg -i in.mp3 -shortest -c:v libx264 -b:v 5M -preset slow out.mp4`


### Notes

##### Google AdMob
2Tale-iOS: ca-app-pub-4056519983936625/9240170312
2Tale-Android: ca-app-pub-4056519983936625/4789735514
