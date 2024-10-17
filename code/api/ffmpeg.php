<?php

/**/

$data = json_decode(file_get_contents("php://input"), true);

$img = "/tmp/{$data["img"]}";
$audio = "/tmp/{$data["audio"]}";

$id = uniqid("ffmpeg_", true);
$path = "/tmp/{$id}.mp4";

$res = shell_exec("ffmpeg -y -loop 1 -i {$img} -i {$audio} -shortest -c:v libx264 -b:v 5M -preset slow {$path} </dev/null >/dev/null 2>/var/log/ffmpeg_api.log &");

if(!$res || !file_exists($path) {
	echo "FFmpeg error";
	exit(1);
}
else{
	$size = filesize($path);
	header($_SERVER["SERVER_PROTOCOL"] . " 200 OK");
	header("Cache-Control: public"); // needed for internet explorer
	header("Content-Type: video/mp4");
	header("Accept-Ranges: bytes");
	header("Content-Length: ".$size);
	header("Content-Disposition: inline;");
	header("Content-Range: bytes .$size");
	header("Content-Transfer-Encoding: binary\n");
	header("Connection: close");
	readfile($path);
	exit;
}
